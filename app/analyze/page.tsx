'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, getAnalysisByDocumentId } from '@/lib/supabase';
import { LegalDocument, AnalysisData } from '@/types';
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
  Layers3
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
  const [error, setError] = useState<Error | null>(null);

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
      
      // Fetch analysis
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
          if (json.success && json.chunks) {
            setChunks(json.chunks);
          }
        }
      } catch (cErr) {
        console.error('Failed to fetch extracted chunks:', cErr);
      }

      setLoadingAnalysis(false);
    };

    loadAnalysisAndChunks();
  }, [selectedDocId, documents]);

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
          title="Failed to fetch analysis record"
          error={error}
          onRetry={() => {
            if (selectedDocId) {
              setLoadingAnalysis(true);
              getAnalysisByDocumentId(selectedDocId).then(({ data, error: err }) => {
                if (err) setError(err);
                else setAnalysis(data);
                setLoadingAnalysis(false);
              });
            }
          }}
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

                <div className="pt-2 space-y-2">
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
                {chunks.slice(0, 5).map((chunk, cIdx) => (
                  <div key={chunk.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800 text-[10px] uppercase font-mono block mb-1">
                      Chunk #{chunk.chunk_index + 1} — {chunk.section || 'Provision'}
                    </span>
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
          {loadingAnalysis && (
            <LoadingState
              message="Fetching analysis & chunks from Supabase..."
              subtext="Reading document chunks and structured analysis records"
            />
          )}

          {/* Extracted Chunks Status Banner if Analysis is Pending */}
          {!loadingAnalysis && !analysis && selectedDoc && (
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Document Processed & Ready for AI Analysis</h2>
                </div>
                {getStatusBadge(selectedDoc.status)}
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real Document Successfully Uploaded & Parsed</span>
                </div>
                <p className="text-emerald-800">
                  Document <strong className="font-semibold">{selectedDoc.name}</strong> was stored in Supabase Storage and parsed into <strong>{chunks.length} structured text chunks</strong> in database table <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">document_chunks</code>.
                </p>
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Extracted Source Chunks Preview:</h3>
                <div className="space-y-3">
                  {chunks.map((chunk) => (
                    <div key={chunk.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-800">Chunk #{chunk.chunk_index + 1}: {chunk.section}</span>
                        <span className="text-slate-400">Page {chunk.page_number || 1}</span>
                      </div>
                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Structured Analysis View */}
          {!loadingAnalysis && analysis && (
            <div className="space-y-6">

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
                              Section / Page {clause.page}
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
              <section className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Review Radar</span>
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/80">
                    Potential Areas Requiring Review
                  </span>
                </div>
                <div className="space-y-3">
                  {analysis.review_radar?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-start space-x-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">{item.category}</span>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                            [{item.severity}]
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                        <p className="text-[11px] text-amber-200 mt-2 font-medium">
                          <strong>Potential Impact:</strong> {item.impact}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 6. Questions to Consider */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Questions to Consider</span>
                </h2>
                <ul className="space-y-2">
                  {analysis.questions_to_consider?.map((q, idx) => (
                    <li key={idx} className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-slate-800 flex items-start space-x-2">
                      <span className="font-bold text-blue-600 text-xs">Q{idx + 1}.</span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 7. Action Checklist */}
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-200 mb-4">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Action Checklist</span>
                </h2>
                <div className="space-y-2">
                  {analysis.action_checklist?.map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={item.completed}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="font-medium text-slate-900">{item.task}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-mono uppercase">
                        Target: {item.target_role}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}

        </div>

      </div>
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
