import { createClient } from '@supabase/supabase-js';
import { LegalDocument, AnalysisData, ComparisonData, QAMessage } from '@/types';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawAnonKey && 
  rawUrl !== 'YOUR_SUPABASE_URL' && 
  (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawAnonKey : 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DOCUMENTS ---
export async function getDocuments(): Promise<{ data: LegalDocument[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as LegalDocument[], error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch documents') };
  }
}

export async function getDocumentById(id: string): Promise<{ data: LegalDocument | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as LegalDocument, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch document details') };
  }
}

export async function createDocumentRecord(doc: Omit<LegalDocument, 'id' | 'created_at'>): Promise<{ data: LegalDocument | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY) are not configured. Please add valid HTTPS URLs in .env.local.')
    };
  }
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([doc])
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as LegalDocument, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to register document record in Supabase') };
  }
}

export async function uploadDocumentFile(file: File): Promise<{ path: string | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return {
      path: null,
      error: new Error('Supabase Storage is not configured. Please supply valid NEXT_PUBLIC_SUPABASE_URL in .env.local.')
    };
  }
  try {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `user_documents/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return { path: null, error: new Error(uploadError.message) };
    }

    return { path: filePath, error: null };
  } catch (err: any) {
    return { path: null, error: err instanceof Error ? err : new Error('File upload failed') };
  }
}

// --- ANALYSIS ---
export async function getAnalysisByDocumentId(documentId: string): Promise<{ data: AnalysisData | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('document_id', documentId)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as AnalysisData | null, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch analysis') };
  }
}

// --- COMPARISON ---
export async function getComparisonRecord(docAId: string, docBId: string): Promise<{ data: ComparisonData | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('comparisons')
      .select('*')
      .or(`and(doc_a_id.eq.${docAId},doc_b_id.eq.${docBId}),and(doc_a_id.eq.${docBId},doc_a_id.eq.${docAId})`)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as ComparisonData | null, error: null };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch comparison record') };
  }
}

// --- Q&A / CHAT MESSAGES ---
export async function getQAMessages(documentId: string): Promise<{ data: QAMessage[] | null; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: [], error: null };
  }
  try {
    // Try chat_messages table first
    const { data: chatData, error: chatErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (!chatErr && chatData && chatData.length > 0) {
      // Map chat_messages (paired user/assistant or individual messages) to QAMessage structure
      const mappedMessages: QAMessage[] = [];
      for (let i = 0; i < chatData.length; i++) {
        const msg = chatData[i];
        if (msg.role === 'user') {
          const nextMsg = chatData[i + 1];
          const hasAssistant = nextMsg && nextMsg.role === 'assistant';
          mappedMessages.push({
            id: msg.id,
            document_id: msg.document_id,
            question: msg.content,
            answer: hasAssistant ? nextMsg.content : null,
            citations: hasAssistant && nextMsg.sources ? nextMsg.sources : [],
            status: hasAssistant ? 'completed' : 'pending',
            created_at: msg.created_at,
          });
          if (hasAssistant) i++; // skip assistant row
        } else if (msg.role === 'assistant') {
          mappedMessages.push({
            id: msg.id,
            document_id: msg.document_id,
            question: 'Question',
            answer: msg.content,
            citations: msg.sources || [],
            status: 'completed',
            created_at: msg.created_at,
          });
        }
      }
      return { data: mappedMessages, error: null };
    }

    // Fallback to qa_messages if chat_messages is empty
    const { data: qaData, error: qaErr } = await supabase
      .from('qa_messages')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true });

    if (qaErr) return { data: [], error: null };
    return { data: (qaData || []) as QAMessage[], error: null };
  } catch (err: any) {
    return { data: [], error: null };
  }
}
