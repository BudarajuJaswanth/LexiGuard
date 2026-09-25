'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/StateHandlers';
import { getDocuments, getQAMessages } from '@/lib/supabase';
import { LegalDocument, QAMessage } from '@/types';
import { MessageSquare, Send, ShieldAlert, FileText, Loader2 } from 'lucide-react';

function QAContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('doc') || '';

  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);

  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [questionInput, setQuestionInput] = useState<string>('');
  
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [loadingQA, setLoadingQA] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
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

  // Fetch QA Thread
  const fetchQA = async (docId: string) => {
    if (!docId) return;
    setLoadingQA(true);
    setError(null);
    const { data, error: err } = await getQAMessages(docId);
    if (err) {
      setError(err);
      setMessages([]);
    } else {
      setMessages(data || []);
    }
    setLoadingQA(false);
  };

  useEffect(() => {
    if (selectedDocId) {
      const match = documents.find(d => d.id === selectedDocId);
      if (match) setSelectedDoc(match);
      fetchQA(selectedDocId);
    }
  }, [selectedDocId, documents]);

  const handleSubmitQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !selectedDocId) return;

    const qText = questionInput.trim();
    setQuestionInput('');
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          question: qText,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Q&A request failed.');
      }

      // Refresh QA list directly from Supabase
      await fetchQA(selectedDocId);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error('Failed to complete Gemini Q&A request.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Title & Selector */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Badge type="DOCUMENT_GROUNDED" />
              <Badge type="GENERATED_BY_GEMINI" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Ask This Document
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Ask precise questions regarding clauses, obligations, liabilities, or deadlines.
            </p>
          </div>

          {/* Selector */}
          <div className="w-full md:w-80">
            <label htmlFor="qa-doc-select" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Document:
            </label>
            <select
              id="qa-doc-select"
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

      {/* Mandatory Legal Notice */}
      <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start space-x-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-amber-950 uppercase tracking-wide">Legal Notice:</strong> LexiGuard answers are provided for informational assistance and document navigation. Answers do not constitute legal advice or formal determination of contract enforceability.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to process Q&A request"
          error={error}
          onRetry={() => fetchQA(selectedDocId)}
          actionText="Retry Q&A Fetch"
        />
      )}

      {/* Main Q&A Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Selected Document Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Selected Document Context</span>
            </h2>

            {selectedDoc ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-900 text-sm break-all">{selectedDoc.name}</p>
                  <div className="mt-2 text-[11px] text-slate-500 font-mono">
                    Size: {(selectedDoc.file_size / 1024).toFixed(1)} KB • Type: {selectedDoc.file_type}
                  </div>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                  <strong>Grounded Search:</strong> Q&A queries inspect document text chunks in Supabase to return verified citations.
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No document selected.</p>
            )}
          </div>
        </div>

        {/* Right Panel: Q&A Input & Conversation History */}
        <div className="lg:col-span-8 space-y-6">

          {/* Input Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Ask This Document</span>
            </h2>

            <form onSubmit={handleSubmitQuestion} className="space-y-3">
              <textarea
                rows={3}
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask a question about the uploaded document..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Queries are saved to Supabase table <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">qa_messages</code>.
                </span>
                <button
                  type="submit"
                  disabled={submitting || !questionInput.trim() || !selectedDocId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Generating Answer...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Conversation History / List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Question & Answer Thread ({messages.length})
            </h3>

            {loadingQA && (
              <LoadingState
                message="Fetching Q&A thread from Supabase..."
                subtext="Querying `chat_messages` table via pgvector RAG"
              />
            )}

            {!loadingQA && messages.length === 0 && (
              <EmptyState
                title="No questions asked yet for this document"
                description="Type your question in the box above (e.g. 'What is the notice period?') and click Ask AI."
                icon={MessageSquare}
              />
            )}

            {!loadingQA && messages.map((msg) => {
              const isNotFound = msg.answer?.includes("couldn't find") || msg.answer?.includes("not found");

              return (
                <div key={msg.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  
                  {/* User Question */}
                  <div className="flex items-start space-x-3 pb-3 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      Q
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">{msg.question}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className={`flex items-start space-x-3 p-4 rounded-xl border ${
                    isNotFound 
                      ? 'bg-amber-50/70 border-amber-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      AI
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <Badge type="DOCUMENT_GROUNDED" />
                        <Badge type="GENERATED_BY_GEMINI" />
                      </div>

                      <p className={`text-xs leading-relaxed font-sans ${
                        isNotFound ? 'text-amber-900 font-medium' : 'text-slate-800'
                      }`}>
                        {msg.answer || 'Analyzing document chunks with Gemini GenAI...'}
                      </p>

                      {/* Source Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sources from uploaded document ({msg.citations.length})</span>
                          </h4>
                          <div className="space-y-2">
                            {msg.citations.map((cite: any, cIdx: number) => (
                              <div key={cIdx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
                                  <span className="font-bold text-blue-700">{cite.section || cite.clause || 'Section'}</span>
                                  {cite.page_number && (
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                                      Page {cite.page_number}
                                    </span>
                                  )}
                                </div>
                                {(cite.excerpt || cite.text) && (
                                  <blockquote className="text-[11px] text-slate-600 italic font-mono border-l-2 border-blue-500 pl-2 py-0.5">
                                    "{cite.excerpt || cite.text}"
                                  </blockquote>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>

      </div>
    </>
  );
}

export default function QAPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingState message="Loading Q&A view..." />}>
          <QAContent />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
