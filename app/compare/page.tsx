'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, getComparisonRecord } from '@/lib/supabase';
import { LegalDocument, ComparisonData } from '@/types';
import { GitCompare, FileText, ShieldAlert, ArrowRight, CheckCircle2, HelpCircle, AlertCircle, Layers } from 'lucide-react';

export default function ComparisonPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [docAId, setDocAId] = useState<string>('');
  const [docBId, setDocBId] = useState<string>('');

  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [comparing, setComparing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Load documents
  useEffect(() => {
    const loadDocs = async () => {
      setLoadingDocs(true);
      const { data, error: err } = await getDocuments();
      if (err) {
        setError(err);
      } else if (data && data.length > 0) {
        setDocuments(data);
        setDocAId(data[0].id);
        if (data.length > 1) {
          setDocBId(data[1].id);
        }
      }
      setLoadingDocs(false);
    };
    loadDocs();
  }, []);

  const handleRunComparison = async () => {
    if (!docAId || !docBId) {
      setError(new Error('Please select two documents to compare.'));
      return;
    }
    if (docAId === docBId) {
      setError(new Error('Document A and Document B must be two distinct documents.'));
      return;
    }

    setComparing(true);
    setError(null);

    try {
      const { data, error: err } = await getComparisonRecord(docAId, docBId);
      if (err) throw err;
      setComparison(data);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to fetch comparison record from Supabase.'));
      setComparison(null);
    } finally {
      setComparing(false);
    }
  };

  const docA = documents.find(d => d.id === docAId);
  const docB = documents.find(d => d.id === docBId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md mb-8">
          <div className="flex items-center space-x-2 mb-1">
            <Badge type="AI_COMPARISON" />
            <Badge type="GENERATED_BY_GEMINI" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Compare Two Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Side-by-side analysis of clause variations, obligation differences, and questions to clarify for legal counsel.
          </p>
        </div>

        {/* Legal Notice */}
        <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-950 uppercase tracking-wide">Legal Notice:</strong> Document comparison highlights clause differences for informational navigation. It does not provide legal opinions on which contract version is legally superior or valid.
          </p>
        </div>

        {/* DOCUMENT SELECTOR PANEL: Document A VS Document B */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-indigo-600" />
            <span>Select Target Documents to Compare</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            
            {/* Document A Selector */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="doc-a-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">A</span>
                <span>Document A</span>
              </label>
              <select
                id="doc-a-select"
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.file_type})
                  </option>
                ))}
              </select>
              {docA && (
                <p className="text-[11px] text-slate-500 font-mono mt-2 truncate">
                  File Size: {(docA.file_size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            {/* VS Badge */}
            <div className="md:col-span-1 text-center py-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center mx-auto shadow-sm border border-slate-700">
                VS
              </div>
            </div>

            {/* Document B Selector */}
            <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label htmlFor="doc-b-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center space-x-2">
                <span className="w-5 h-5 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px]">B</span>
                <span>Document B</span>
              </label>
              <select
                id="doc-b-select"
                value={docBId}
                onChange={(e) => setDocBId(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.file_type})
                  </option>
                ))}
              </select>
              {docB && (
                <p className="text-[11px] text-slate-500 font-mono mt-2 truncate">
                  File Size: {(docB.file_size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleRunComparison}
              disabled={comparing || !docAId || !docBId}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Documents</span>
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorState
            title="Comparison Request Error"
            error={error}
            onRetry={handleRunComparison}
            actionText="Retry Comparison"
          />
        )}

        {/* Loading State */}
        {comparing && (
          <LoadingState
            message="Comparing Document A vs Document B in Supabase..."
            subtext="Aligning clause topics, liability variations, and clarification questions"
          />
        )}

        {/* Empty State */}
        {!comparing && !comparison && !error && (
          <EmptyState
            title="No Comparison Record Loaded"
            description="Select Document A and Document B above, then click 'Compare Documents' to inspect side-by-side clause variations."
            icon={GitCompare}
          />
        )}

        {/* RESULT SECTIONS */}
        {!comparing && comparison && (
          <div className="space-y-8">

            {/* 1. Comparison Summary */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Comparison Summary</span>
                </h2>
                <Badge type="AI_COMPARISON" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {comparison.summary}
              </p>
            </section>

            {/* 2. Differences */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Differences & Clause Variations</span>
              </h2>

              <div className="space-y-4">
                {comparison.differences?.map((diff, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>Topic: {diff.topic}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Doc A Provision */}
                      <div className="p-3 bg-white rounded-lg border border-blue-200 text-xs">
                        <span className="font-bold text-blue-800 text-[11px] block mb-1">
                          Document A Provision ({docA?.name})
                        </span>
                        <blockquote className="font-mono text-[11px] text-slate-700 bg-blue-50/50 p-2 rounded border border-blue-100 italic">
                          "{diff.doc_a_clause}"
                        </blockquote>
                      </div>

                      {/* Doc B Provision */}
                      <div className="p-3 bg-white rounded-lg border border-indigo-200 text-xs">
                        <span className="font-bold text-indigo-800 text-[11px] block mb-1">
                          Document B Provision ({docB?.name})
                        </span>
                        <blockquote className="font-mono text-[11px] text-slate-700 bg-indigo-50/50 p-2 rounded border border-indigo-100 italic">
                          "{diff.doc_b_clause}"
                        </blockquote>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900 font-semibold">Practical Impact:</strong> {diff.impact}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Questions to Clarify */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                <HelpCircle className="w-4 h-4 text-purple-600" />
                <span>Questions to Clarify</span>
              </h2>

              <ul className="space-y-2">
                {comparison.questions_to_clarify?.map((q, idx) => (
                  <li key={idx} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-xs text-slate-800 flex items-start space-x-2">
                    <span className="font-bold text-purple-700 text-xs">Q{idx + 1}.</span>
                    <span className="leading-relaxed">{q}</span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
