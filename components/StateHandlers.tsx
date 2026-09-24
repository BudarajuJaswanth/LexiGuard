import React from 'react';
import { AlertCircle, RefreshCw, Inbox, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export function LoadingState({ message = 'Querying Supabase database...', subtext = 'Fetching legal document records' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <h3 className="text-sm font-semibold text-slate-900">{message}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtext}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error?: string | Error | null;
  onRetry?: () => void;
  actionText?: string;
}

export function ErrorState({
  title = 'Failed to load data from Supabase',
  error,
  onRetry,
  actionText = 'Retry Request'
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unexpected network error occurred while communicating with Supabase.';

  return (
    <div className="p-6 bg-red-50/80 rounded-xl border border-red-200 text-red-900 my-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-900">{title}</h3>
          <p className="text-xs text-red-700 mt-1 font-mono bg-red-100/60 p-2 rounded border border-red-200/60 break-all">
            {errorMessage}
          </p>

          <div className="mt-4 flex items-center space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-semibold hover:bg-red-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{actionText}</span>
              </button>
            )}
            <span className="text-[11px] text-red-600 font-medium">
              Verified error handling state
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-600 mt-1 max-w-md leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
