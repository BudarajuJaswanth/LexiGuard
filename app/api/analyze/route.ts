import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeLegalDocumentWithGemini } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient() as any;

    // 1. Fetch Document Metadata
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

    // 2. Fetch Document Chunks from Supabase
    const { data: chunks, error: chunksErr } = await adminSupabase
      .from('document_chunks')
      .select('content, chunk_index, page_number, section')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    if (chunksErr || !chunks || chunks.length === 0) {
      const emptyMsg = "We couldn't extract readable text from this document.";
      await adminSupabase
        .from('documents')
        .update({ status: 'failed', error_message: emptyMsg })
        .eq('id', documentId);

      return NextResponse.json(
        { success: false, error: emptyMsg },
        { status: 400 }
      );
    }

    // Combine text chunks into full grounded context for Gemini
    const combinedText = chunks.map((c: any) => 
      `--- [PAGE ${c.page_number || 1} | ${c.section || 'SECTION'}] ---\n${c.content}`
    ).join('\n\n');

    // 3. Update status to 'analyzing'
    await adminSupabase
      .from('documents')
      .update({ status: 'analyzing', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // 4. Call Real Google Gemini GenAI Model
    const geminiResult = await analyzeLegalDocumentWithGemini(document.name, combinedText);

    // 5. Store structured analysis in Supabase 'analyses' table
    const analysisRow = {
      document_id: documentId,
      summary: geminiResult.summary,
      key_facts: geminiResult.keyFacts,
      parties: geminiResult.parties,
      duration: geminiResult.duration,
      obligations: geminiResult.obligations,
      important_clauses: geminiResult.importantClauses,
      review_areas: geminiResult.reviewAreas,
      unclear_information: geminiResult.unclearInformation,
      questions: geminiResult.questionsForProfessional,
      checklist: geminiResult.checklist,
      created_at: new Date().toISOString(),
    };

    // Upsert analysis record
    const { data: savedAnalysis, error: analysisErr } = await adminSupabase
      .from('analyses')
      .upsert(analysisRow, { onConflict: 'document_id' })
      .select()
      .single();

    if (analysisErr) {
      console.error('Failed to save Gemini analysis to Supabase:', analysisErr);
      throw new Error(`Failed to save Gemini analysis to database: ${analysisErr.message}`);
    }

    // 6. Update document status to 'completed'
    await adminSupabase
      .from('documents')
      .update({ status: 'completed', error_message: null, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    return NextResponse.json({
      success: true,
      documentId,
      analysis: {
        id: savedAnalysis.id,
        document_id: documentId,
        summary: geminiResult.summary,
        key_facts: geminiResult.keyFacts,
        obligations: geminiResult.obligations,
        important_clauses: geminiResult.importantClauses.map(c => ({
          ...c,
          risk_level: c.risk_level || 'medium',
        })),
        review_radar: geminiResult.reviewAreas.map((r: any) => ({
          title: r.title || r.category || 'Provision for Review',
          description: r.description || '',
          reason: r.reason || r.impact || 'May require closer review and clarification with legal counsel.',
          category: (r.category === 'HIGHER ATTENTION' || r.category === 'WORTH REVIEWING' || r.category === 'INFORMATIONAL')
            ? r.category
            : (r.severity === 'critical' ? 'HIGHER ATTENTION' : r.severity === 'info' ? 'INFORMATIONAL' : 'WORTH REVIEWING'),
          source_section: r.source_section || 'Document Provision',
          page_number: r.page_number || null,
          original_clause: r.original_clause || r.description || '',
          explanation: r.explanation || r.description || '',
          impact: r.impact || r.reason,
          severity: r.severity || 'warning',
        })),
        questions_to_consider: geminiResult.questionsForProfessional,
        action_checklist: geminiResult.checklist,
        created_at: savedAnalysis.created_at,
      },
      message: 'Real Gemini GenAI document analysis completed and stored in Supabase.',
    });

  } catch (err: any) {
    console.error('Error in POST /api/analyze:', err);

    const errorMessage = err instanceof Error ? err.message : 'AI analysis failed';

    // Update DB status to failed
    if (req.body) {
      try {
        const adminSupabase = createAdminClient() as any;
        const body = await req.json().catch(() => ({}));
        if (body.documentId) {
          await adminSupabase
            .from('documents')
            .update({ status: 'failed', error_message: errorMessage })
            .eq('id', body.documentId);
        }
      } catch {}
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
