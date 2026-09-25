'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReviewRadarModal from '@/components/ReviewRadarModal';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, getAnalysisByDocumentId } from '@/lib/supabase';
import { LegalDocument, AnalysisData, ReviewRadarItem } from '@/types';
import { 
  FileText, 
  BarChart3, 
  FileSearch, 
  AlertTriangle, 
  CheckSquare, 
  HelpCircle, 
  ShieldAlert, 
  Info, 
  Layers, 
  CheckCircle2,
  Clock,
  Sparkles,
  Layers3,
  AlertCircle,
  Play,
  Loader2
} from 'lucide-react';

interface ExtractedChunkItem {
  id: string;
  content: string;
  chunk_index: number;
  section?: string | null;
  page_number?: number | null;
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('doc') || '';

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [chunks, setChunks] = useState<ExtractedChunkItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [analyzingGemini, setAnalyzingGemini] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Review Radar Modal State
  const [activeRadarItem, setActiveRadarItem] = useState<ReviewRadarItem | null>(null);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState<boolean>(false);

  const handleOpenRadarModal = (item: ReviewRadarItem) => {
    setActiveRadarItem(item);
    setIsRadarModalOpen(true);
  };

  // Load all documents for dropdown selector
  useEffect(() => {
    const loadDocs = async () => {
      setLoadingDocs(true);
      const { data, error: err } = await getDocuments();
      if (err) {
        setError(err);
      } else if (data && data.length > 0) {
        setDocuments(data);
        if (!selectedDocId) {
          setSelectedDocId(data[0].id);
          setSelectedDoc(data[0]);
        } else {
          const match = data.find(d => d.id === selectedDocId);
          if (match) setSelectedDoc(match);
        }
      }
      setLoadingDocs(false);
    };
    loadDocs();
  }, []);

  // Fetch analysis & chunks when selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) return;
    const docMatch = documents.find(d => d.id === selectedDocId);
    if (docMatch) setSelectedDoc(docMatch);

    const loadAnalysisAndChunks = async () => {
      setLoadingAnalysis(true);
      setError(null);
      
      // Fetch stored analysis from Supabase
      const { data: analysisData, error: err } = await getAnalysisByDocumentId(selectedDocId);
      if (err) {
        setError(err);
        setAnalysis(null);
      } else {
        setAnalysis(analysisData);
      }

      // Fetch extracted chunks from API route
      try {
        const res = await fetch(`/api/documents/${selectedDocId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            if (json.document) {
              setSelectedDoc(json.document);
            }
            if (json.chunks) {
              setChunks(json.chunks);
            }
          }
        }
      } catch (cErr) {
        console.error('Failed to fetch extracted chunks:', cErr);
      }

      setLoadingAnalysis(false);
    };

    loadAnalysisAndChunks();
  }, [selectedDocId, documents]);

  // Trigger Real Google Gemini Analysis API call
  const handleRunGeminiAnalysis = async () => {
    if (!selectedDocId) return;

    setAnalyzingGemini(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: selectedDocId }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gemini API analysis failed.');
      }

      setAnalysis(json.analysis);

      // Refresh document details
      const { data: updatedDocs } = await getDocuments();
      if (updatedDocs) {
        setDocuments(updatedDocs);
        const match = updatedDocs.find(d => d.id === selectedDocId);
        if (match) setSelectedDoc(match);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to complete Gemini analysis'));
    } finally {
      setAnalyzingGemini(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
    <>
      {/* Top Header & Document Selector */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Badge type="AI_ANALYSIS" />
              <Badge type="GENERATED_BY_GEMINI" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Legal Document AI Analysis
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Grounded document comprehension, clause significance, review radar, and action checklist.
            </p>
          </div>

          {/* Document Selector Dropdown */}
          <div className="w-full md:w-80">
            <label htmlFor="document-select" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Document to Analyze:
            </label>
            <select
              id="document-select"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {documents.length === 0 && <option value="">No documents found in Supabase</option>}
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.file_type || 'PDF'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global Legal Notice Banner */}
      <div className="mb-6 p-3.5 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950 uppercase tracking-wide">Legal Notice:</strong> LexiGuard provides general informational assistance and document navigation. It does not provide legal advice or determine whether a provision is legally valid. Consider discussing identified provisions with a qualified legal professional.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Gemini Analysis Request Error"
          error={error}
          onRetry={handleRunGeminiAnalysis}
          actionText="Retry Gemini Analysis"
        />
      )}

      {/* TWO-COLUMN INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Document Information & Metadata Viewer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Document Information</span>
            </h2>

            {selectedDoc ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900 text-sm break-all">{selectedDoc.name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 border-t border-slate-200 pt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">FORMAT</span>
                      <span className="font-semibold text-slate-800 uppercase">{selectedDoc.file_type || 'PDF'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">FILE SIZE</span>
                      <span className="font-semibold text-slate-800">{(selectedDoc.file_size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span>Status</span>
                    {getStatusBadge(selectedDoc.status)}
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span>Extracted Chunks</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800">{chunks.length} clauses</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span>Uploaded Date</span>
                    <span className="font-mono text-[11px] text-slate-700">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Gemini Trigger Button */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleRunGeminiAnalysis}
                    disabled={analyzingGemini || chunks.length === 0}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    {analyzingGemini ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Running Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>{analysis ? 'Re-run Gemini AI Analysis' : 'Run Gemini AI Analysis'}</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/ask?doc=${selectedDoc.id}`}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Ask Questions About This Doc</span>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No document selected.</p>
            )}
          </div>

          {/* Extracted Chunks Preview Box */}
          {chunks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Layers3 className="w-4 h-4 text-purple-600" />
                <span>Extracted Legal Chunks ({chunks.length})</span>
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {chunks.slice(0, 5).map((chunk) => (
                  <div key={chunk.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                    <div className="flex justify-between font-mono text-[10px] text-slate-800 mb-1">
                      <span className="font-bold">Chunk #{chunk.chunk_index + 1} • {chunk.section || 'Provision'}</span>
                      <span className="text-slate-400">P. {chunk.page_number || 1}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 font-mono text-[10px]">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Grounding Principles Card */}
          <div className="bg-slate-900 text-slate-200 rounded-xl border border-slate-800 p-5 text-xs space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Grounded AI Principles</span>
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Statements cite explicit document provisions.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>No claims of definitive enforceability.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Preserves attorney review necessity.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Analysis Sections */}
        <div className="lg:col-span-8 space-y-6">

          {/* Loading Analysis */}
          {(loadingAnalysis || analyzingGemini) && (
            <LoadingState
              message={analyzingGemini ? "Calling Google Gemini API..." : "Fetching analysis from Supabase..."}
              subtext={analyzingGemini ? "Generating structured plain-language summary, key facts, obligations, important clauses, review radar, and action checklist" : "Reading stored AI analysis records"}
            />
          )}

          {/* Empty / Unreadable Document Error Banner */}
          {!loadingAnalysis && !analyzingGemini && selectedDoc && selectedDoc.status === 'failed' && (
            <div className="p-6 bg-red-50 border border-red-200 text-red-900 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center space-x-2 font-bold text-sm text-red-900">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Document Unreadable Error</span>
              </div>
              <p className="text-xs font-semibold text-red-800 bg-red-100/80 p-3 rounded border border-red-200/80 font-mono">
                "We couldn't extract readable text from this document."
              </p>
              <p className="text-xs text-red-700 leading-relaxed">
                To protect Gemini API context quality, unreadable documents or empty files are not submitted to the AI pipeline.
              </p>
            </div>
          )}

          {/* Prompt to Run Gemini if Document is Chunked & Ready */}
          {!loadingAnalysis && !analyzingGemini && !analysis && selectedDoc && selectedDoc.status !== 'failed' && (
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Ready for Google Gemini AI Analysis</h2>
                </div>
                {getStatusBadge(selectedDoc.status)}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Real Source Text Chunks Ready ({chunks.length} clauses)</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  Document <strong className="font-semibold">{selectedDoc.name}</strong> has been extracted and stored in Supabase. Click below to execute the real Google Gemini GenAI pipeline.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunGeminiAnalysis}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Real Google Gemini Analysis</span>
                </button>
              </div>
            </div>
          )}

          {/* Structured Analysis View */}
          {!loadingAnalysis && !analyzingGemini && analysis && (
            <div className="space-y-6">

              {/* Disclaimer Notice */}
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge type="AI_ANALYSIS" />
                  <Badge type="GENERATED_BY_GEMINI" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  AI-generated informational assistance — not legal advice.
                </span>
              </div>

              {/* 1. AI Summary */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <FileSearch className="w-4 h-4 text-blue-600" />
                    <span>AI Summary</span>
                  </h2>
                  <Badge type="DOCUMENT_GROUNDED" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {analysis.summary}
                </p>
              </section>

              {/* 2. Key Facts */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Key Facts</span>
                </h2>
                <ul className="space-y-2">
                  {analysis.key_facts?.map((fact, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 3. Obligations */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Obligations</span>
                </h2>
                <div className="space-y-2">
                  {analysis.obligations?.map((ob, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 flex items-start space-x-2">
                      <span className="font-bold text-slate-400 text-xs">#{idx + 1}</span>
                      <p className="leading-relaxed">{ob}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Important Clauses */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Important Clauses</span>
                </h2>
                <div className="space-y-4">
                  {analysis.important_clauses?.map((clause, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                          <span>{clause.title}</span>
                          {clause.page && (
                            <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                              Page {clause.page}
                            </span>
                          )}
                        </h3>
                        {clause.risk_level === 'high' && <Badge type="HIGH_RISK" />}
                        {clause.risk_level === 'medium' && <Badge type="MEDIUM_RISK" />}
                        {clause.risk_level === 'low' && <Badge type="LOW_RISK" />}
                      </div>
                      <blockquote className="p-3 bg-white rounded border-l-4 border-blue-600 text-xs font-mono text-slate-700 mb-2 italic">
                        "{clause.excerpt}"
                      </blockquote>
                      <p className="text-xs text-slate-600">
                        <strong className="text-slate-800 font-semibold">Significance:</strong> {clause.significance}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Review Radar */}
              <section className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Review Radar
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Provisions deserving review derived dynamically from Gemini AI analysis. Click any item to inspect source clause.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Badge type="AI_ANALYSIS" />
                    <Badge type="GENERATED_BY_GEMINI" />
                  </div>
                </div>

                <div className="space-y-3">
                  {analysis.review_radar?.map((item, idx) => {
                    const catUpper = (item.category || '').toUpperCase();
                    const isHigher = catUpper === 'HIGHER ATTENTION' || catUpper === 'CRITICAL' || catUpper === 'HIGH';
                    const isInfo = catUpper === 'INFORMATIONAL' || catUpper === 'INFO' || catUpper === 'LOW';

                    return (
                      <div
                        key={idx}
                        onClick={() => handleOpenRadarModal(item)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group hover:scale-[1.005] ${
                          isHigher
                            ? 'bg-slate-950/90 border-red-900/60 hover:border-red-600'
                            : isInfo
                            ? 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                            : 'bg-slate-950/90 border-amber-900/60 hover:border-amber-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              {/* Category Badge */}
                              {isHigher ? (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800 rounded">
                                  HIGHER ATTENTION
                                </span>
                              ) : isInfo ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded">
                                  INFORMATIONAL
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded">
                                  WORTH REVIEWING
                                </span>
                              )}

                              <h3 className="font-bold text-xs text-white group-hover:text-blue-300 transition-colors">
                                {item.title || item.category}
                              </h3>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {item.description}
                            </p>

                            {/* Why It May Matter */}
                            <p className="text-[11px] text-amber-200/90 font-medium pt-1">
                              <strong>Why It May Matter:</strong> {item.reason || item.impact}
                            </p>
                          </div>

                          {/* Source Tag & Link Indicator */}
                          <div className="text-right shrink-0 space-y-1">
                            <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded block">
                              {item.source_section || 'Section'}
                            </span>
                            {item.page_number && (
                              <span className="text-[10px] font-mono text-slate-500 block">
                                Page {item.page_number}
                              </span>
                            )}
                            <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity block font-semibold">
                              View Clause →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 6. QUESTIONS TO CONSIDER */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        QUESTIONS TO CONSIDER
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Targeted questions derived specifically from clauses found in the uploaded document.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
                    <Badge type="GENERATED_BY_GEMINI" />
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Based on uploaded document
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5">
                  {analysis.questions_to_consider?.map((q, idx) => (
                    <li key={idx} className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-slate-800 flex items-start space-x-3">
                      <span className="font-bold text-blue-600 text-xs shrink-0 mt-0.5">Q{idx + 1}.</span>
                      <div className="space-y-1 flex-1">
                        <p className="leading-relaxed font-medium text-slate-900">{q}</p>
                        <p className="text-[10px] text-slate-500 italic">
                          Consider discussing this with a qualified legal professional if clarification is needed.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Informational assistance — not legal advice.
                </div>
              </section>

              {/* 7. DOCUMENT CHECKLIST */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        DOCUMENT CHECKLIST
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Actionable document review items generated from AI document analysis.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
                    <Badge type="GENERATED_BY_GEMINI" />
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Based on uploaded document
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {analysis.action_checklist?.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200 flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <label className="flex items-center space-x-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          defaultChecked={item.completed}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <span className="font-semibold text-slate-900">{item.task}</span>
                      </label>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded font-mono uppercase shrink-0 ml-3">
                        Target: {item.target_role || 'Legal Counsel'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Informational assistance — not legal advice.
                </div>
              </section>

            </div>
          )}

        </div>

      </div>

      {/* Review Radar Clause Link Modal */}
      <ReviewRadarModal
        item={activeRadarItem}
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
      />
    </>
  );
}

export default function AnalysisPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingState message="Loading Analysis view..." />}>
          <AnalysisContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
