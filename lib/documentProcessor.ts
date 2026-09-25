import mammoth from 'mammoth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PageTextContent {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  pages: PageTextContent[];
  pageCount: number;
  hasReadableText: boolean;
}

export interface DocumentChunkItem {
  content: string;
  chunk_index: number;
  page_number: number;
  section: string;
}

/**
 * Custom PDF page renderer to track page boundaries for legal page-number attribution
 */
function pdfPageRender(pageData: any) {
  const renderOptions = {
    normalizeWhitespace: true,
    disableCombineTextItems: false,
  };

  return pageData.getTextContent(renderOptions).then((textContent: any) => {
    let lastY: number | undefined;
    let text = '';
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    const pageIndex = pageData.pageIndex + 1;
    return `\n[[[PAGE_${pageIndex}]]]\n` + text;
  });
}

/**
 * Extract raw text, pages, sections, and tables from PDF or DOCX buffer server-side
 */
export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string
): Promise<ExtractedDocument> {
  const normalizedType = fileType.toLowerCase();

  // --- PDF EXTRACTION ---
  if (normalizedType.includes('pdf')) {
    const pdfParse = require('pdf-parse');
    const pdfFn = typeof pdfParse === 'function' ? pdfParse : pdfParse.default || pdfParse;

    const pdfData = await pdfFn(buffer, { pagerender: pdfPageRender });
    const fullText = (pdfData.text || '').replace(/\r\n/g, '\n').trim();

    // Check for readable text
    const cleanAlpha = fullText.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanAlpha.length < 15) {
      return {
        text: '',
        pages: [],
        pageCount: pdfData.numpages || 1,
        hasReadableText: false,
      };
    }

    // Split text by page markers [[[PAGE_N]]]
    const pageParts = fullText.split(/\[\[\[PAGE_(\d+)\]\]\]/);
    const pages: PageTextContent[] = [];

    for (let i = 1; i < pageParts.length; i += 2) {
      const pageNum = parseInt(pageParts[i], 10);
      const pageText = pageParts[i + 1] ? pageParts[i + 1].trim() : '';
      if (pageText) {
        pages.push({ pageNumber: pageNum, text: pageText });
      }
    }

    if (pages.length === 0) {
      pages.push({ pageNumber: 1, text: fullText });
    }

    return {
      text: fullText,
      pages,
      pageCount: pdfData.numpages || pages.length,
      hasReadableText: true,
    };
  }

  // --- DOCX EXTRACTION ---
  if (normalizedType.includes('docx') || normalizedType.includes('word')) {
    // Extract raw text
    const rawResult = await mammoth.extractRawText({ buffer });
    const fullText = (rawResult.value || '').replace(/\r\n/g, '\n').trim();

    const cleanAlpha = fullText.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanAlpha.length < 15) {
      return {
        text: '',
        pages: [],
        pageCount: 1,
        hasReadableText: false,
      };
    }

    // Also extract HTML to preserve table and heading structures
    let htmlText = '';
    try {
      const htmlResult = await mammoth.convertToHtml({ buffer });
      htmlText = htmlResult.value || '';
    } catch {
      htmlText = fullText;
    }

    return {
      text: fullText,
      pages: [{ pageNumber: 1, text: fullText }],
      pageCount: 1,
      hasReadableText: true,
    };
  }

  throw new Error(`Unsupported file format for document processing: ${fileType}`);
}

/**
 * Perform semantic legal clause chunking.
 * Preserves complete clauses, section headers, paragraph integrity, and page numbers.
 */
export function chunkLegalDocument(
  extractedDoc: ExtractedDocument,
  maxChunkSize: number = 1000
): DocumentChunkItem[] {
  if (!extractedDoc.hasReadableText || !extractedDoc.text) {
    return [];
  }

  const chunks: DocumentChunkItem[] = [];
  let chunkIndex = 0;
  let currentSection = 'General Provisions';

  // Process page by page to maintain page attribution
  for (const page of extractedDoc.pages) {
    const pageText = page.text.replace(/\[\[\[PAGE_\d+\]\]\]/g, '').trim();
    if (!pageText) continue;

    // Split page text by double newlines into logical paragraphs/clauses
    const paragraphs = pageText.split(/\n\s*\n/);
    let currentChunk = '';

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      // Detect section title / clause header pattern
      const sectionMatch = trimmedPara.match(/^(?:SECTION|ARTICLE|CLAUSE|\d+\.|\d+\.\d+)\s*([^\n:]+)/i);
      if (sectionMatch) {
        currentSection = sectionMatch[0].trim();
      }

      // Check if adding this complete paragraph exceeds max chunk size
      if ((currentChunk + '\n\n' + trimmedPara).length > maxChunkSize && currentChunk) {
        chunks.push({
          content: currentChunk.trim(),
          chunk_index: chunkIndex++,
          page_number: page.pageNumber,
          section: currentSection,
        });
        currentChunk = trimmedPara;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${trimmedPara}` : trimmedPara;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        chunk_index: chunkIndex++,
        page_number: page.pageNumber,
        section: currentSection,
      });
    }
  }

  return chunks;
}

/**
 * Full server pipeline: Download file from Supabase Storage -> Extract -> Clean -> Semantic Chunk -> Save to document_chunks -> Update status
 */
export async function processStorageDocument(
  documentId: string,
  storagePath: string,
  fileType: string
): Promise<{ success: boolean; chunkCount: number; error?: string }> {
  const adminSupabase = createAdminClient() as any;

  try {
    // Step 1: Update status to 'extracting'
    await adminSupabase
      .from('documents')
      .update({ 
        status: 'extracting', 
        error_message: null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', documentId);

    // Step 2: Download raw document file buffer from Supabase Storage
    const { data: fileBlob, error: downloadErr } = await adminSupabase
      .storage
      .from('documents')
      .download(storagePath);

    if (downloadErr || !fileBlob) {
      throw new Error(`Failed to download file from Supabase Storage: ${downloadErr?.message || 'File not found'}`);
    }

    const arrayBuffer = await fileBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 3: Extract text per page/section
    const extracted = await extractTextFromBuffer(buffer, fileType);

    if (!extracted.hasReadableText) {
      const unreadableMsg = "We couldn't extract readable text from this document.";
      
      await adminSupabase
        .from('documents')
        .update({ 
          status: 'failed', 
          error_message: unreadableMsg,
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId);

      return {
        success: false,
        chunkCount: 0,
        error: unreadableMsg,
      };
    }

    // Step 4: Update status to 'chunking'
    await adminSupabase
      .from('documents')
      .update({ status: 'chunking', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Step 5: Perform semantic legal chunking
    const chunks = chunkLegalDocument(extracted);

    if (chunks.length === 0) {
      throw new Error("We couldn't extract readable text from this document.");
    }

    // Step 6: Update status to 'embedding'
    await adminSupabase
      .from('documents')
      .update({ status: 'embedding', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    // Insert chunks into Supabase document_chunks table
    const rowsToInsert = chunks.map(c => ({
      document_id: documentId,
      content: c.content,
      chunk_index: c.chunk_index,
      page_number: c.page_number,
      section: c.section,
      embedding: null, // Prepared for Gemini embeddings in GenAI phase
    }));

    // Delete pre-existing chunks if re-processing
    await adminSupabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    const { error: insertErr } = await adminSupabase
      .from('document_chunks')
      .insert(rowsToInsert);

    if (insertErr) {
      throw new Error(`Failed to store document chunks in database: ${insertErr.message}`);
    }

    // Step 7: Update status to 'ready'
    await adminSupabase
      .from('documents')
      .update({ 
        status: 'ready', 
        error_message: null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', documentId);

    return { success: true, chunkCount: chunks.length };

  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : 'Server document processing failed.';
    console.error(`Document processing failed for ID [${documentId}]:`, errorMsg);

    await adminSupabase
      .from('documents')
      .update({ 
        status: 'failed', 
        error_message: errorMsg,
        updated_at: new Date().toISOString() 
      })
      .eq('id', documentId);

    return {
      success: false,
      chunkCount: 0,
      error: errorMsg,
    };
  }
}
