import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-6">
      <div className="w-24 h-24 rounded-full bg-[#f4f2ff] text-[#0d1648] flex items-center justify-center shadow-lg border border-[#c6c5d0]">
        <Compass className="w-12 h-12 text-[#755b00] animate-spin-slow" />
      </div>

      <div>
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#755b00] uppercase block mb-1">
          404 • PAGE UNCHARTED
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Atelier Room Not Found</h1>
        <p className="text-xs text-[#767680] font-sans mt-2 leading-relaxed">
          The sanctuary or creation you are seeking may have been moved or archived in our private vaults.
        </p>
      </div>

      <button
        onClick={() => onNavigate('/')}
        className="btn-primary text-xs px-8 py-3.5 inline-flex items-center gap-2 shadow-xl"
      >
        <span>Return to Home</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
