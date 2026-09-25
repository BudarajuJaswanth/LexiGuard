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
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docAId, docBId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Comparison API request failed.');
      }

      setComparison(json.comparison);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to complete Gemini document comparison.'));
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
          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
            <Badge type="AI_COMPARISON" />
            <Badge type="GENERATED_BY_GEMINI" />
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 rounded">
              Compared using Gemini
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Compare Documents
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AI-generated factual comparison — informational only. Objective side-by-side analysis of clause variations.
          </p>
        </div>

        {/* Legal Notice */}
        <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-950 uppercase tracking-wide">Legal Notice:</strong> LexiGuard describes objective factual differences between documents. It does not rank contract versions, declare winners, or provide legal advice.
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
              <span>{comparing ? 'Comparing Documents with Gemini...' : 'Compare Documents'}</span>
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
            message="Executing real Gemini AI comparative analysis..."
            subtext="Comparing parties, duration, notice periods, termination, confidentiality, liabilities, and obligations"
          />
        )}

        {/* Empty State */}
        {!comparing && !comparison && !error && (
          <EmptyState
            title="No Comparison Record Loaded"
            description="Select Document A and Document B above, then click 'Compare Documents' to run real Gemini AI comparative analysis."
            icon={GitCompare}
          />
        )}

        {/* RESULT SECTIONS */}
        {!comparing && comparison && (
          <div className="space-y-8">

            {/* COMPARISON RESULTS Header Box */}
            <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight uppercase">
                  COMPARISON RESULTS
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-generated factual comparison — informational only.
                </p>
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                <Badge type="AI_COMPARISON" />
                <Badge type="GENERATED_BY_GEMINI" />
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 rounded">
                  Compared using Gemini
                </span>
              </div>
            </div>

            {/* 1. Comparison Summary */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Summary</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Factual Comparative Overview
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {comparison.summary}
              </p>
            </section>

            {/* 2. Structured Differences Table */}
            <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Differences & Provision Comparison</span>
                </h2>
                <span className="text-[11px] text-slate-500 font-mono">
                  {comparison.differences?.length || 0} categories analyzed
                </span>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-3.5 border-b border-slate-800 w-36">Category</th>
                      <th className="p-3.5 border-b border-slate-800 w-1/3">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">A</span>
                          <span>Document A ({docA?.name || 'Doc A'})</span>
                        </div>
                      </th>
                      <th className="p-3.5 border-b border-slate-800 w-1/3">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold">B</span>
                          <span>Document B ({docB?.name || 'Doc B'})</span>
                        </div>
                      </th>
                      <th className="p-3.5 border-b border-slate-800">Objective Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {comparison.differences?.map((diff, idx) => {
                      const categoryName = diff.category || diff.topic || 'Provision';
                      const textA = diff.documentA || diff.doc_a_clause || 'Not specified';
                      const textB = diff.documentB || diff.doc_b_clause || 'Not specified';
                      const explanation = diff.explanation || diff.impact || '';
                      const sourceA = diff.sourceA;
                      const sourceB = diff.sourceB;

                      return (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                          {/* Category */}
                          <td className="p-3.5 align-top font-bold text-slate-900 bg-slate-50/80 border-r border-slate-200">
                            <span className="capitalize block">{categoryName}</span>
                          </td>

                          {/* Document A Provision */}
                          <td className="p-3.5 align-top border-r border-slate-200 space-y-1.5">
                            <p className="text-slate-800 leading-relaxed font-sans">{textA}</p>
                            {sourceA && (
                              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded inline-block">
                                {sourceA}
                              </span>
                            )}
                          </td>

                          {/* Document B Provision */}
                          <td className="p-3.5 align-top border-r border-slate-200 space-y-1.5">
                            <p className="text-slate-800 leading-relaxed font-sans">{textB}</p>
                            {sourceB && (
                              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded inline-block">
                                {sourceB}
                              </span>
                            )}
                          </td>

                          {/* Objective Explanation */}
                          <td className="p-3.5 align-top text-slate-700 leading-relaxed font-medium bg-amber-50/20">
                            {explanation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
