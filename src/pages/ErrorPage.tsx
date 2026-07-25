import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorPageProps {
  onNavigate: (path: string) => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-6">
      <div className="w-24 h-24 rounded-full bg-red-50 text-[#ba1a1a] flex items-center justify-center shadow-lg border border-red-200">
        <AlertTriangle className="w-12 h-12" />
      </div>

      <div>
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#ba1a1a] uppercase block mb-1">
          ANOMALY DETECTED
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Atelier Service Interruption</h1>
        <p className="text-xs text-[#767680] font-sans mt-2 leading-relaxed">
          We encountered an unexpected error while preparing your luxury view. Please refresh or return to the main hall.
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={() => window.location.reload()}
          className="btn-outline flex-1 text-xs py-3 inline-flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh Page
        </button>
        <button
          onClick={() => onNavigate('/')}
          className="btn-primary flex-1 text-xs py-3"
        >
          Home
        </button>
      </div>
    </div>
  );
};
