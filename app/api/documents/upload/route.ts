import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { processStorageDocument } from '@/lib/documentProcessor';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['pdf', 'docx'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No document file provided in request.' },
        { status: 400 }
      );
    }

    // 1. Validation: Size checks
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'File is empty (0 bytes). Please upload a valid document.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 15MB.` },
        { status: 400 }
      );
    }

    // 2. Validation: Extension & MIME type checks
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file format ".${ext}". LexiGuard requires PDF or DOCX files.` },
        { status: 400 }
      );
    }

    // Convert file to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const adminSupabase = createAdminClient() as any;

    // Generate unique storage path
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const storagePath = `user_documents/${cleanFileName}`;

    // 3. Upload raw document file to Supabase Storage bucket 'documents'
    const { error: storageErr } = await adminSupabase
      .storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        upsert: false,
      });

    if (storageErr) {
      console.error('Supabase Storage Upload Error:', storageErr);
      return NextResponse.json(
        { success: false, error: `Supabase Storage upload failed: ${storageErr.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = adminSupabase.storage.from('documents').getPublicUrl(storagePath);
    const fileUrl = urlData?.publicUrl || storagePath;

    // Default user ID for session
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    // 4. Create row in Supabase DB 'documents' table
    const { data: docRecord, error: dbErr } = await adminSupabase
      .from('documents')
      .insert([{
        user_id: defaultUserId,
        name: file.name,
        file_url: fileUrl,
        file_type: ext.toUpperCase(),
        file_size: file.size,
        status: 'uploaded',
        error_message: null,
      }])
      .select()
      .single();

    if (dbErr || !docRecord) {
      console.error('Supabase DB Insert Error:', dbErr);
      return NextResponse.json(
        { success: false, error: `Failed to insert document record in database: ${dbErr?.message}` },
        { status: 500 }
      );
    }

    // 5. Run Server Processing Pipeline (Download from Storage -> Page/Section Extraction -> Semantic Legal Chunking -> Save Chunks)
    const processResult = await processStorageDocument(docRecord.id, storagePath, ext);

    return NextResponse.json({
      success: processResult.success,
      documentId: docRecord.id,
      document: {
        ...docRecord,
        status: processResult.success ? 'ready' : 'failed',
        error_message: processResult.error || null,
      },
      chunkCount: processResult.chunkCount,
      error: processResult.error || null,
      message: processResult.success 
        ? 'Document uploaded, retrieved, and processed successfully into document_chunks.'
        : processResult.error || 'Failed to process document text',
    });

  } catch (err: any) {
    console.error('Unhandled upload route error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server upload error occurred.' },
      { status: 500 }
    );
  }
}
