import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateGeminiEmbedding, generateGroundedQAAnswer } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, question } = body;

    if (!documentId || !question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'documentId and question are required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient() as any;

    // 1. Fetch Document Record
    const { data: document, error: docErr } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docErr || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied.' },
        { status: 404 }
      );
    }

    const userId = document.user_id || '00000000-0000-0000-0000-000000000000';

    // 2. Generate 768-dim Query Embedding using Gemini text-embedding-004
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateGeminiEmbedding(question.trim());
    } catch (e: any) {
      console.warn('Vector query embedding generation warning:', e.message);
    }

    let chunksToUse: { content: string; section?: string; page_number?: number }[] = [];

    // 3. Perform pgvector Cosine Similarity Search via Supabase match_document_chunks RPC
    if (queryEmbedding && queryEmbedding.length > 0) {
      try {
        const { data: matched, error: matchErr } = await adminSupabase.rpc('match_document_chunks', {
          query_embedding: queryEmbedding,
          match_count: 5,
          filter_document_id: documentId,
        });

        if (!matchErr && matched && matched.length > 0) {
          chunksToUse = matched.map((m: any) => ({
            content: m.content,
            section: m.section,
            page_number: m.page_number,
          }));
        }
      } catch (rErr) {
        console.warn('pgvector match_document_chunks RPC warning:', rErr);
      }
    }

    // 4. Fallback if pgvector returns 0 chunks (or embeddings not generated yet)
    if (chunksToUse.length === 0) {
      const { data: dbChunks } = await adminSupabase
        .from('document_chunks')
        .select('content, section, page_number')
        .eq('document_id', documentId)
        .order('chunk_index', { ascending: true })
        .limit(8);

      if (dbChunks && dbChunks.length > 0) {
        chunksToUse = dbChunks;
      }
    }

    if (chunksToUse.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "We couldn't extract readable text from this document." 
        },
        { status: 400 }
      );
    }

    // 5. Generate Grounded AI Answer with Real Google Gemini
    const groundedResult = await generateGroundedQAAnswer(
      document.name,
      question.trim(),
      chunksToUse
    );

    // 6. Save Conversation History to Supabase chat_messages table
    try {
      await adminSupabase.from('chat_messages').insert([
        {
          document_id: documentId,
          user_id: userId,
          role: 'user',
          content: question.trim(),
          sources: [],
          created_at: new Date().toISOString(),
        },
        {
          document_id: documentId,
          user_id: userId,
          role: 'assistant',
          content: groundedResult.answer,
          sources: groundedResult.sources,
          created_at: new Date(Date.now() + 10).toISOString(),
        },
      ]);
    } catch (saveErr) {
      console.warn('Failed to save to chat_messages table:', saveErr);
    }

    // Also write to qa_messages table for extra compatibility if it exists
    try {
      await adminSupabase.from('qa_messages').insert([
        {
          document_id: documentId,
          question: question.trim(),
          answer: groundedResult.answer,
          citations: groundedResult.sources,
          status: 'completed',
          created_at: new Date().toISOString(),
        }
      ]);
    } catch {}

    // 7. Return Grounded Response
    return NextResponse.json({
      success: true,
      found: groundedResult.found,
      answer: groundedResult.answer,
      sources: groundedResult.sources,
      limitations: 'LexiGuard provides general informational assistance and document navigation — not legal advice.',
      message: 'Grounded document Q&A generated using Gemini and Supabase pgvector.',
    });

  } catch (err: any) {
    console.error('Error in POST /api/chat:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Q&A processing failed' },
      { status: 500 }
    );
  }
}
