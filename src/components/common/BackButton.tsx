import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onNavigate: (path: string) => void;
  /** Where the button takes the user. Defaults to the home page. */
  to?: string;
  className?: string;
}

/** Uniform "Back" affordance shown at the top of pages reached from a menu. */
export const BackButton: React.FC<BackButtonProps> = ({ onNavigate, to = '/', className = '' }) => (
  <button
    onClick={() => onNavigate(to)}
    className={`inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] ${className}`}
  >
    <ArrowLeft className="w-4 h-4" /> Back
  </button>
);
