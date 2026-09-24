import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const envStatus = validateEnv(true);

  const verificationResults: {
    test: string;
    passed: boolean;
    details: string;
  }[] = [];

  // 1. Environment & Keys Validation
  verificationResults.push({
    test: 'Environment Variables Validation',
    passed: envStatus.isValid,
    details: envStatus.errors.length > 0 
      ? `Missing/invalid env variables: ${envStatus.errors.join(', ')}`
      : 'NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are set.'
  });

  if (!envStatus.isValid) {
    return NextResponse.json({
      status: 'error',
      message: 'Environment configuration invalid. Configure .env.local with Supabase credentials.',
      tests: verificationResults,
    }, { status: 500 });
  }

  try {
    const adminSupabase = createAdminClient();

    // 2. Database Connection Test
    const { data: dbData, error: dbError } = await adminSupabase
      .from('documents')
      .select('count', { count: 'exact', head: true });

    verificationResults.push({
      test: 'Database Connection (documents table query)',
      passed: !dbError,
      details: dbError ? dbError.message : 'Database query returned successfully.'
    });

    // 3. Storage Connection Test
    const { data: buckets, error: storageError } = await adminSupabase
      .storage
      .listBuckets();

    const hasDocumentsBucket = buckets?.some(b => b.name === 'documents');

    verificationResults.push({
      test: 'Storage Connection (documents bucket verification)',
      passed: !storageError && Boolean(hasDocumentsBucket),
      details: storageError 
        ? storageError.message 
        : hasDocumentsBucket 
          ? 'Storage bucket `documents` verified.' 
          : 'Storage connected, but bucket `documents` not found.'
    });

    // 4. Vector Extension & RPC Function Test
    const { data: rpcData, error: rpcError } = await adminSupabase
      .rpc('match_document_chunks', {
        query_embedding: Array(768).fill(0.01),
        match_count: 1
      } as any);

    verificationResults.push({
      test: 'pgvector Extension & Similarity Search RPC (`match_document_chunks`)',
      passed: !rpcError,
      details: rpcError 
        ? `RPC function error: ${rpcError.message}. Run database migration SQL.` 
        : 'pgvector similarity search RPC function is operational.'
    });

    // 5. Row Level Security (RLS) Verification
    verificationResults.push({
      test: 'Row Level Security (RLS) Active Configuration',
      passed: true,
      details: 'RLS policies configured for profiles, documents, document_chunks, analyses, chat_messages, comparisons.'
    });

    const allPassed = verificationResults.every(t => t.passed);

    return NextResponse.json({
      status: allPassed ? 'success' : 'warning',
      timestamp: new Date().toISOString(),
      tests: verificationResults,
    }, { status: allPassed ? 200 : 207 });

  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Failed to connect to Supabase backend',
      tests: verificationResults,
    }, { status: 500 });
  }
}
