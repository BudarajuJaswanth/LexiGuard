import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processStorageDocument } from '@/lib/documentProcessor';

export async function POST(
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

    const adminSupabase = createAdminClient() as any;

    // Fetch document record
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

    // Extract storage path from file_url or storage path
    let storagePath = document.file_url;
    if (storagePath.includes('/documents/')) {
      storagePath = storagePath.split('/documents/').pop() || storagePath;
    }

    const fileType = document.file_type || 'PDF';

    // Run processing
    const result = await processStorageDocument(documentId, storagePath, fileType);

    return NextResponse.json({
      success: result.success,
      documentId,
      chunkCount: result.chunkCount,
      error: result.error || null,
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Processing error occurred' },
      { status: 500 }
    );
  }
}
