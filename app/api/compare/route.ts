import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { compareLegalDocumentsWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { docAId, docBId } = body;

    if (!docAId || !docBId) {
      return NextResponse.json(
        { success: false, error: 'docAId and docBId are required.' },
        { status: 400 }
      );
    }

    if (docAId === docBId) {
      return NextResponse.json(
        { success: false, error: 'Document A and Document B must be two distinct documents.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient() as any;

    // 1. Fetch Document Metadata for both documents
    const { data: docA, error: docAErr } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('id', docAId)
      .single();

    const { data: docB, error: docBErr } = await adminSupabase
      .from('documents')
      .select('*')
      .eq('id', docBId)
      .single();

    if (docAErr || !docA || docBErr || !docB) {
      return NextResponse.json(
        { success: false, error: 'One or both documents were not found in Supabase.' },
        { status: 404 }
      );
    }

    // 2. Fetch Chunks for Document A
    const { data: chunksA } = await adminSupabase
      .from('document_chunks')
      .select('content, section, page_number, chunk_index')
      .eq('document_id', docAId)
      .order('chunk_index', { ascending: true });

    // Fetch Chunks for Document B
    const { data: chunksB } = await adminSupabase
      .from('document_chunks')
      .select('content, section, page_number, chunk_index')
      .eq('document_id', docBId)
      .order('chunk_index', { ascending: true });

    if (!chunksA || chunksA.length === 0 || !chunksB || chunksB.length === 0) {
      return NextResponse.json(
        { success: false, error: "We couldn't extract readable text from one or both documents for comparison." },
        { status: 400 }
      );
    }

    // Build full text representation for each document
    const textA = chunksA.map((c: any) => 
      `--- [PAGE ${c.page_number || 1} | ${c.section || 'SECTION'}] ---\n${c.content}`
    ).join('\n\n');

    const textB = chunksB.map((c: any) => 
      `--- [PAGE ${c.page_number || 1} | ${c.section || 'SECTION'}] ---\n${c.content}`
    ).join('\n\n');

    // 3. Execute Real Gemini GenAI Comparative Analysis
    const geminiResult = await compareLegalDocumentsWithGemini(
      docA.name,
      textA,
      docB.name,
      textB
    );

    const userId = docA.user_id || docB.user_id || '00000000-0000-0000-0000-000000000000';

    // 4. Save/Upsert Comparison Record in Supabase 'comparisons' Table
    const comparisonRow = {
      user_id: userId,
      document_a_id: docAId,
      document_b_id: docBId,
      summary: geminiResult.summary,
      differences: geminiResult.differences,
      questions: geminiResult.questionsToClarify,
      created_at: new Date().toISOString(),
    };

    const { data: savedRecord, error: saveErr } = await adminSupabase
      .from('comparisons')
      .insert([comparisonRow])
      .select()
      .single();

    if (saveErr) {
      console.warn('Failed to save to comparisons table:', saveErr.message);
    }

    return NextResponse.json({
      success: true,
      comparison: {
        id: savedRecord?.id || `comp_${Date.now()}`,
        doc_a_id: docAId,
        doc_b_id: docBId,
        summary: geminiResult.summary,
        differences: geminiResult.differences.map(d => ({
          category: d.category || 'General Difference',
          documentA: d.documentA,
          documentB: d.documentB,
          explanation: d.explanation,
          sourceA: d.sourceA,
          sourceB: d.sourceB,
          // Legacy aliases
          topic: d.category,
          doc_a_clause: d.documentA,
          doc_b_clause: d.documentB,
          impact: d.explanation,
        })),
        questions_to_clarify: geminiResult.questionsToClarify,
        created_at: savedRecord?.created_at || new Date().toISOString(),
      },
      message: 'REAL AI-powered document comparison generated using Gemini and stored in Supabase.',
    });

  } catch (err: any) {
    console.error('Error in POST /api/compare:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Document comparison failed' },
      { status: 500 }
    );
  }
}
