import mammoth from 'mammoth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ExtractedDocument {
  text: string;
  pageCount?: number;
}

export interface DocumentChunkItem {
  content: string;
  chunk_index: number;
  page_number?: number | null;
  section?: string | null;
}

/**
 * Extract raw text from PDF or DOCX buffer server-side
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string
): Promise<ExtractedDocument> {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType.includes('pdf')) {
    // Dynamic import/require to prevent top-level DOMMatrix canvas polyfill evaluation in Next.js
    const pdfParse = require('pdf-parse');
    const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || pdfParse;
    const pdfData = await pdfFn(buffer);
    return {
      text: pdfData.text || '',
      pageCount: pdfData.numpages || 1,
    };
  }

  if (normalizedType.includes('docx') || normalizedType.includes('word')) {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value || '',
      pageCount: 1,
    };
  }

  throw new Error(`Unsupported file type for server extraction: ${fileType}`);
}

/**
 * Split document text into structured, contextual legal clauses/chunks
 */
export function chunkDocumentText(
  text: string,
  maxChunkSize: number = 1000
): DocumentChunkItem[] {
  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (!cleanText) return [];

  // Split by double newlines (paragraphs/clauses) first
  const paragraphs = cleanText.split(/\n\s*\n/);
  const chunks: DocumentChunkItem[] = [];

  let currentChunk = '';
  let chunkIndex = 0;
  let currentSection = 'General Provisions';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect heading/section patterns (e.g. "Section 1", "ARTICLE II", "Clause 3")
    const sectionMatch = trimmed.match(/^(?:SECTION|ARTICLE|CLAUSE|\d+\.)\s*([^\n:]+)/i);
    if (sectionMatch) {
      currentSection = sectionMatch[0].trim();
    }

    if ((currentChunk + '\n\n' + trimmed).length > maxChunkSize && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        chunk_index: chunkIndex++,
        section: currentSection,
        page_number: 1,
      });
      currentChunk = trimmed;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunk_index: chunkIndex,
      section: currentSection,
      page_number: 1,
    });
  }

  return chunks;
}

/**
 * Server pipeline to extract, chunk, and save document content to Supabase
 */
export async function processAndStoreDocument(
  documentId: string,
  buffer: Buffer,
  fileType: string
): Promise<{ success: boolean; chunkCount: number; error?: string }> {
  const adminSupabase = createAdminClient() as any;

  try {
    // Step 1: Update status to 'extracting'
    await adminSupabase
      .from('documents')
      .update({ status: 'extracting', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Step 2: Extract Text
    const extracted = await extractTextFromBuffer(buffer, fileType);

    if (!extracted.text || extracted.text.trim().length === 0) {
      throw new Error('Extracted document text is empty.');
    }

    // Step 3: Update status to 'chunking'
    await adminSupabase
      .from('documents')
      .update({ status: 'chunking', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Step 4: Chunk document
    const chunks = chunkDocumentText(extracted.text);

    if (chunks.length > 0) {
      // Insert chunks into Supabase document_chunks table
      const rowsToInsert = chunks.map(c => ({
        document_id: documentId,
        content: c.content,
        chunk_index: c.chunk_index,
        section: c.section || 'General Provision',
        page_number: c.page_number || 1,
        embedding: null,
      }));

      const { error: chunkErr } = await adminSupabase
        .from('document_chunks')
        .insert(rowsToInsert);

      if (chunkErr) {
        console.error('Failed to insert chunks:', chunkErr);
      }
    }

    // Step 5: Update status to 'ready'
    await adminSupabase
      .from('documents')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    return { success: true, chunkCount: chunks.length };

  } catch (err: any) {
    console.error('Error processing document background:', err);

    await adminSupabase
      .from('documents')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    return {
      success: false,
      chunkCount: 0,
      error: err instanceof Error ? err.message : 'Processing failed',
    };
  }
}
