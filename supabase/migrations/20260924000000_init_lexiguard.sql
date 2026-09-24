-- LexiGuard AI Legal Document Navigator - Supabase Schema Migration
-- Enables pgvector, creates production tables, RLS security policies, vector search function, and storage policies.

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create DOCUMENTS Table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'analyzed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create DOCUMENT_CHUNKS Table (pgvector 768 dimensions for Gemini embeddings)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER,
  section TEXT,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create ANALYSES Table
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL UNIQUE REFERENCES public.documents(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
  parties JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration TEXT,
  obligations JSONB NOT NULL DEFAULT '[]'::jsonb,
  important_clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  unclear_information JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create CHAT_MESSAGES Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create COMPARISONS Table
CREATE TABLE IF NOT EXISTS public.comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_a_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  document_b_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  differences JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INDEXES for Performance & Vector Search
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_analyses_document_id ON public.analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_document_user ON public.chat_messages(document_id, user_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_user_id ON public.comparisons(user_id);

-- HNSW Vector Index for Fast Cosine Similarity
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- 9. VECTOR SIMILARITY SEARCH RPC FUNCTION
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5,
  filter_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  chunk_index INT,
  page_number INT,
  section TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.page_number,
    dc.section,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE (filter_document_id IS NULL OR dc.document_id = filter_document_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Documents Policies
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Document Chunks Policies (Owner of document)
CREATE POLICY "Users can view chunks of own documents" ON public.document_chunks 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can insert chunks into own documents" ON public.document_chunks 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can delete chunks of own documents" ON public.document_chunks 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_chunks.document_id AND d.user_id = auth.uid())
);

-- Analyses Policies (Owner of document)
CREATE POLICY "Users can view analysis of own documents" ON public.analyses 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = analyses.document_id AND d.user_id = auth.uid())
);
CREATE POLICY "Users can insert analysis for own documents" ON public.analyses 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = analyses.document_id AND d.user_id = auth.uid())
);

-- Chat Messages Policies
CREATE POLICY "Users can view own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Comparisons Policies
CREATE POLICY "Users can view own comparisons" ON public.comparisons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comparisons" ON public.comparisons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comparisons" ON public.comparisons FOR DELETE USING (auth.uid() = user_id);

-- 11. SUPABASE STORAGE BUCKET & RLS POLICIES
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload documents" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can view own stored document files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'documents' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own stored document files" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'documents' AND auth.role() = 'authenticated'
);
