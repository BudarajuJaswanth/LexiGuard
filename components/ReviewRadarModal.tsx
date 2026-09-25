'use client';

import React, { useEffect } from 'react';
import { X, FileText, AlertTriangle, Sparkles, HelpCircle, BookOpen } from 'lucide-react';
import { ReviewRadarItem } from '@/types';
import { Badge } from '@/components/Badge';

interface ReviewRadarModalProps {
  item: ReviewRadarItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewRadarModal({ item, isOpen, onClose }: ReviewRadarModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  // Determine category badge styling
  const getCategoryBadge = (category: string) => {
    const catUpper = (category || '').toUpperCase();
    if (catUpper === 'HIGHER ATTENTION' || catUpper === 'CRITICAL' || catUpper === 'HIGH') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-red-950 text-red-300 border border-red-800 rounded-md flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>HIGHER ATTENTION</span>
        </span>
      );
    }
    if (catUpper === 'INFORMATIONAL' || catUpper === 'INFO' || catUpper === 'LOW') {
      return (
        <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 rounded-md flex items-center space-x-1.5">
          <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>INFORMATIONAL</span>
        </span>
      );
    }
    // Default to WORTH REVIEWING
    return (
      <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded-md flex items-center space-x-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>WORTH REVIEWING</span>
      </span>
    );
  };

  const titleText = item.title || item.category || 'Provision Analysis';
  const sectionText = item.source_section || 'Document Provision';
  const pageText = item.page_number ? `Page ${item.page_number}` : null;
  const originalClauseText = item.original_clause || item.description || 'No direct clause quote available.';
  const explanationText = item.explanation || item.description || 'Plain language explanation not provided.';
  const reasonText = item.reason || item.impact || 'May warrant clarification or review with legal counsel.';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="radar-modal-title"
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl transform transition-all text-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              {getCategoryBadge(item.category)}
              <Badge type="GENERATED_BY_GEMINI" />
            </div>
            <h2 id="radar-modal-title" className="text-lg font-bold text-white tracking-tight">
              {titleText}
            </h2>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-300">{sectionText}</span>
              </span>
              {pageText && (
                <>
                  <span>•</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">{pageText}</span>
                </>
              )}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Close detail view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

          {/* 1. Original Clause Excerpt */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Original Clause Text</span>
            </label>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed italic border-l-4 border-l-blue-500">
              "{originalClauseText}"
            </div>
          </div>

          {/* 2. Plain-Language Explanation */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>Plain-Language Explanation</span>
            </label>
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
              {explanationText}
            </div>
          </div>

          {/* 3. Why It May Matter */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Why It May Matter</span>
            </label>
            <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-800/60 text-xs text-amber-200 leading-relaxed font-medium">
              {reasonText}
            </div>
          </div>

          {/* AI Transparency & Disclaimer */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-[11px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI-generated document analysis</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500">Generated by Gemini</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-2">
              LexiGuard provides general informational assistance and document navigation. It does not provide legal advice or determine whether any provision is legally valid.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
