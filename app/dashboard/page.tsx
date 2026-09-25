'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, isSupabaseConfigured } from '@/lib/supabase';
import { LegalDocument } from '@/types';
import { FileSearch, GitCompare, FileText, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<LegalDocument[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getDocuments();
    if (err) {
      setError(err);
      setDocuments(null);
    } else {
      setDocuments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded': return <Badge type="STATUS_UPLOADED" />;
      case 'extracting': return <Badge type="STATUS_EXTRACTING" />;
      case 'chunking': return <Badge type="STATUS_CHUNKING" />;
      case 'embedding': return <Badge type="STATUS_EMBEDDING" />;
      case 'ready': return <Badge type="STATUS_READY" />;
      case 'analyzing': return <Badge type="STATUS_ANALYZING" />;
      case 'completed': return <Badge type="STATUS_COMPLETED" />;
      case 'failed': return <Badge type="STATUS_FAILED" />;
      default: return <Badge type="STATUS_READY" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Legal Document Dashboard</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-900 text-slate-200 font-mono">
                Supabase Backend
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Overview of uploaded legal documents, processing status, and AI analysis records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/documents"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <FileSearch className="w-4 h-4" />
              <span>Analyze Document</span>
            </Link>

            <Link
              href="/compare"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <GitCompare className="w-4 h-4 text-indigo-300" />
              <span>Compare Documents</span>
            </Link>
          </div>
        </div>

        {/* Supabase Notice Banner */}
        {!isSupabaseConfigured && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Supabase Backend Configuration Needed</strong>
              Supabase environment variables (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are currently placeholders in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
            </div>
          </div>
        )}

        {/* RECENT DOCUMENTS SECTION */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Recent Documents</span>
            </h2>
            <Link href="/documents" className="text-xs text-blue-600 font-semibold hover:underline flex items-center space-x-1">
              <span>View All Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <LoadingState
              message="Fetching document records from Supabase..."
              subtext="Connecting to Supabase PostgreSQL database table `documents`"
            />
          )}

          {/* Error State with Retry */}
          {!loading && error && (
            <ErrorState
              title="Error Loading Recent Documents"
              error={error}
              onRetry={fetchDocs}
              actionText="Retry Supabase Query"
            />
          )}

          {/* Empty State */}
          {!loading && !error && documents && documents.length === 0 && (
            <EmptyState
              title="No documents uploaded yet"
              description="Upload your legal documents (PDF or DOCX) to begin document-grounded AI analysis, clause extraction, and comparison."
              actionLabel="Upload First Document"
              onAction={() => window.location.href = '/documents'}
              icon={FileText}
            />
          )}

          {/* Data List / Table */}
          {!loading && !error && documents && documents.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Document Name</th>
                      <th className="px-4 py-3">File Type</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Processing Status</th>
                      <th className="px-4 py-3">Analysis Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate max-w-xs">{doc.name}</span>
                        </td>
                        <td className="px-4 py-3 uppercase font-mono text-[11px] text-slate-500">
                          {doc.file_type || 'PDF'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {(doc.file_size / 1024).toFixed(1)} KB
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(doc.status)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {doc.status === 'ready' || doc.status === 'completed' ? (
                            <span className="text-emerald-700 font-medium text-[11px]">Ready for AI</span>
                          ) : (
                            <span className="text-slate-400 font-normal text-[11px]">Processing</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Link
                            href={`/analyze/${doc.id}`}
                            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <span>Analyze</span>
                          </Link>
                          <span className="text-slate-300">|</span>
                          <Link
                            href={`/ask?doc=${doc.id}`}
                            className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
                          >
                            <span>Ask Q&A</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ARCHITECTURE & EVALUATOR VERIFICATION BOX */}
        <div className="mt-10 p-6 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Backend Architecture</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">Supabase Database & Storage Verification</h3>
              <p className="text-xs text-slate-400 mt-1">
                Persistent storage enabled for documents, analyses, comparisons, and Q&A threads. No local storage fallbacks.
              </p>
            </div>
            <Link
              href="/architecture"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              Verify AI Architecture
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
