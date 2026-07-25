import React from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

/** Placeholder grid shown while a product listing loads. */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg overflow-hidden border border-[#c6c5d0]/30 bg-white">
        <div className="aspect-[3/4] skeleton-shimmer" />
        <div className="p-4 space-y-2">
          <div className="h-2.5 w-1/3 rounded skeleton-shimmer" />
          <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
          <div className="h-3.5 w-1/2 rounded skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

export const Spinner: React.FC<{ label?: string; className?: string }> = ({ label, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}>
    <Loader2 className="w-7 h-7 text-[#755b00] animate-spin" />
    {label && <p className="text-xs font-sans text-[#767680]">{label}</p>}
  </div>
);

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

/** Shown when a fetch fails, always with a way back rather than a dead end. */
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, title = 'Something went wrong' }) => (
  <div className="text-center py-14 px-6 bg-white rounded-xl border border-[#ba1a1a]/20">
    <div className="w-12 h-12 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-6 h-6 text-[#ba1a1a]" />
    </div>
    <h3 className="font-serif text-lg font-bold text-[#0d1648]">{title}</h3>
    <p className="text-xs text-[#767680] font-sans mt-2 max-w-md mx-auto leading-relaxed">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2 text-[11px] px-6 py-2.5 mt-5">
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    )}
  </div>
);

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionLabel, onAction }) => (
  <div className="text-center py-16 px-6 bg-[#f4f2ff] rounded-xl border border-[#c6c5d0]/30">
    {icon && <div className="flex justify-center mb-4 text-[#755b00]">{icon}</div>}
    <h3 className="font-serif text-lg font-bold text-[#0d1648]">{title}</h3>
    <p className="text-xs text-[#767680] font-sans mt-2 max-w-md mx-auto leading-relaxed">{message}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn-primary text-[11px] px-6 py-2.5 mt-5">
        {actionLabel}
      </button>
    )}
  </div>
);
