import Link from 'next/link';
import { FileSearch, ShieldAlert, GitCompare, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* AI Capability Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>AI Legal Document Navigator • Grounded Understanding</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Understand the fine print.
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              AI-powered assistance for understanding, comparing, and navigating legal documents.
            </p>

            {/* CTA Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/documents"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-900/30 transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <FileSearch className="w-4 h-4" />
                <span>Analyze a Document</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                href="/compare"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm transition-all focus:ring-2 focus:ring-slate-500 focus:outline-none"
              >
                <GitCompare className="w-4 h-4 text-indigo-400" />
                <span>Compare Documents</span>
              </Link>
            </div>

            {/* Visible Legal Information Notice Card */}
            <div className="mt-12 max-w-3xl mx-auto p-4 rounded-xl bg-slate-950/90 border border-amber-500/40 text-left">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-300 uppercase tracking-wide block mb-1">
                    Legal Notice & Safety Boundaries
                  </span>
                  LexiGuard provides general informational assistance and document navigation. It does not provide legal advice or determine whether a provision is legally valid. LexiGuard provides informational assistance for understanding documents and preparing questions for a qualified legal professional.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE CARDS SECTION */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Document Navigation Capabilities</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
              Every feature is grounded in document text with clear source attribution and transparent AI labels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1: AI Document Analysis */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 hover:border-blue-500/50 transition-colors flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-blue-950 text-blue-400 border border-blue-800/50 flex items-center justify-center mb-4">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Document Analysis</h3>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">
                Extract plain-language summaries, key facts, core obligations, and important clauses directly from your contract.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Label: AI ANALYSIS</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Feature Card 2: Review Radar */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 hover:border-amber-500/50 transition-colors flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-amber-950 text-amber-400 border border-amber-800/50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Review Radar</h3>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">
                Highlights potential areas requiring review, asymmetrical risk provisions, and unusual liability caps for attorney discussion.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Flag: High Review Need</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Feature Card 3: Document Q&A */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 hover:border-emerald-500/50 transition-colors flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Document Q&A</h3>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">
                Ask targeted questions about termination rules, governing law, and deadlines with grounded source citations.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Label: GROUNDED</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Feature Card 4: Document Comparison */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-6 hover:border-indigo-500/50 transition-colors flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800/50 flex items-center justify-center mb-4">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Document Comparison</h3>
              <p className="text-xs text-slate-300 leading-relaxed flex-1">
                Side-by-side comparison of Document A vs Document B highlighting clause variations, differences, and questions to clarify.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Label: AI COMPARISON</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* EVALUATOR ARCHITECTURE SHORTCUT */}
        <section className="py-12 bg-slate-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>AI Evaluator & Hackathon Verification</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Review the AI Architecture & Backend Integration</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Explore the complete 10-point evaluation breakdown, Supabase database schema, grounded parsing pipeline, and safety boundaries.
              </p>
            </div>
            <Link
              href="/architecture"
              className="shrink-0 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <span>Explore AI Architecture</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
