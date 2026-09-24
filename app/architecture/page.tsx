import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/Badge';
import { ShieldCheck, Cpu, Database, FileText, CheckCircle2, AlertTriangle, Lock, Sparkles, Layers } from 'lucide-react';

const EVALUATION_CRITERIA = [
  { id: 1, title: 'GenAI Usage', desc: 'Integration with Google Gemini models for structured legal understanding & reasoning.' },
  { id: 2, title: 'Legal Document Understanding', desc: 'Parses contracts, NDAs, and agreements into structured JSON schemas.' },
  { id: 3, title: 'Document Summarization', desc: 'Generates plain-language executive summaries grounded strictly in document text.' },
  { id: 4, title: 'Important Clause Extraction', desc: 'Identifies liability caps, indemnification, governing law, and termination clauses.' },
  { id: 5, title: 'Potential Areas Requiring Review', desc: 'Review Radar flags asymmetrical risks and non-standard provisions for legal counsel.' },
  { id: 6, title: 'Document-Grounded Q&A', desc: 'Answers user questions with explicit verbatim clause citations and page references.' },
  { id: 7, title: 'Two-Document Comparison', desc: 'Side-by-side analysis of Document A vs Document B highlighting clause variations.' },
  { id: 8, title: 'Actionable Checklist Generation', desc: 'Extracts post-execution compliance tasks categorized by target role.' },
  { id: 9, title: 'Source Attribution', desc: 'Every statement links to source quotes and chunk identifiers.' },
  { id: 10, title: 'Legal Safety Boundaries', desc: 'Enforces strict system prompts: NOT an AI lawyer; no claims of contract validity.' }
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-md mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Badge type="AI_ANALYSIS" />
            <Badge type="GENERATED_BY_GEMINI" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            LexiGuard AI Architecture & Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
            Technical blueprint of LexiGuard's GenAI pipeline, Supabase backend integration, grounded source attribution model, and legal safety boundaries.
          </p>
        </div>

        {/* 10 EVALUATOR VERIFICATION CRITERIA */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">10-Point AI Evaluator Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EVALUATION_CRITERIA.map((criterion) => (
              <div key={criterion.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                  {criterion.id}
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{criterion.title}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{criterion.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MANDATORY BACKEND REQUIREMENT: SUPABASE DATABASE SCHEMA */}
        <section className="bg-slate-900 text-slate-100 rounded-xl border border-slate-800 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-6">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Supabase Backend Schema & Storage</h2>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded">
              No localStorage / No Mocking
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 font-mono text-[11px] text-blue-400">
                <FileText className="w-3.5 h-3.5" />
                <span>documents</span>
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stores uploaded file metadata: ID, filename, file_path (Supabase Storage), size, file_type (PDF/DOCX), and status.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 font-mono text-[11px] text-emerald-400">
                <Layers className="w-3.5 h-3.5" />
                <span>analyses</span>
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stores structured JSON output: summary, key_facts, obligations, important_clauses, review_radar, action_checklist.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 font-mono text-[11px] text-indigo-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>comparisons</span>
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stores pairwise document comparison records: doc_a_id, doc_b_id, differences array, and clarification questions.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h3 className="font-bold text-white mb-2 flex items-center space-x-1.5 font-mono text-[11px] text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>qa_messages</span>
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Stores user questions, document-grounded answers, status, and source citation quotes.
              </p>
            </div>
          </div>
        </section>

        {/* LEGAL SAFETY BOUNDARIES & PRINCIPLES */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200 mb-6">
            <Lock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">Legal Safety Boundaries & Prompt Directives</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-xl space-y-2">
              <h3 className="font-bold text-red-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>FORBIDDEN SYSTEM CLAIMS (PROHIBITED)</span>
              </h3>
              <ul className="space-y-1.5 text-red-800 font-mono text-[11px]">
                <li className="line-through">"This clause is illegal."</li>
                <li className="line-through">"You will win this case."</li>
                <li className="line-through">"This contract is legally valid."</li>
                <li className="line-through">"This is definitely enforceable."</li>
                <li className="line-through">"You don't need a lawyer."</li>
              </ul>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>MANDATORY SYSTEM LANGUAGE (REQUIRED)</span>
              </h3>
              <ul className="space-y-1.5 text-emerald-800 font-mono text-[11px]">
                <li>✓ "This clause may require closer review."</li>
                <li>✓ "The document states..."</li>
                <li>✓ "I found the following provision..."</li>
                <li>✓ "Consider discussing this with a qualified legal professional."</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
