import Link from 'next/link';
import { ShieldCheck, Info } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-auto">
      {/* Mandatory Legal Disclaimer Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start space-x-3 text-slate-300 text-xs sm:text-sm">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-amber-300">LEGAL NOTICE:</strong> LexiGuard provides general informational assistance and document navigation. It does not provide legal advice or determine whether a provision is legally valid. Always consult a qualified legal professional for legal binding decisions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span className="font-bold text-white text-base">LexiGuard AI</span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              AI-powered legal document navigator designed for grounded document understanding, clause extraction, two-document comparison, and actionable checklists.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Quick Navigation</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/documents" className="hover:text-blue-400 transition-colors">Documents & Upload</Link></li>
              <li><Link href="/analyze" className="hover:text-blue-400 transition-colors">Document Analysis</Link></li>
              <li><Link href="/compare" className="hover:text-blue-400 transition-colors">Compare Documents</Link></li>
              <li><Link href="/ask" className="hover:text-blue-400 transition-colors">Ask Document Q&A</Link></li>
              <li><Link href="/architecture" className="hover:text-blue-400 transition-colors">AI Architecture & Guardrails</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Backend & Engine</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                <span>Backend: <strong>Supabase</strong> (Database & Storage)</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                <span>AI Engine: <strong>Gemini / GenAI</strong></span>
              </p>
              <p className="text-[11px] text-slate-500 mt-2">
                LexiGuard does not make claims of contract validity or enforceability.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LexiGuard Legal Tech. Built for hackathon evaluation.</p>
          <p className="text-slate-400">Grounding Source Attribution & Legal Safety Boundaries</p>
        </div>
      </div>
    </footer>
  );
}
