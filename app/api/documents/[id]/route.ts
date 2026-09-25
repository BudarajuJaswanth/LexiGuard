import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Fetch document metadata
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

    // Fetch extracted chunks
    const { data: chunks, error: chunksErr } = await adminSupabase
      .from('document_chunks')
      .select('id, content, chunk_index, section, page_number')
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true });

    return NextResponse.json({
      success: true,
      document,
      chunkCount: chunks?.length || 0,
      chunks: chunks || [],
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
