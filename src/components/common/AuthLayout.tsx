import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DristhiLogo } from './DristhiLogo';

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Label + destination for the top-right link (e.g. "Sign In"). */
  altAction?: { label: string; path: string };
  onNavigate: (path: string) => void;
}

/** Shared chrome for every signed-out screen, so they stay visually identical. */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  altAction,
  onNavigate,
}) => (
  <div className="min-h-screen bg-[#0d1648] text-white flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#fed255]/10 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#755b00]/20 rounded-full blur-3xl pointer-events-none" />

    <div className="flex items-center justify-between gap-3 max-w-md w-full mx-auto z-10">
      <button
        onClick={() => onNavigate('/')}
        className="min-w-0 focus:outline-none"
        aria-label="Dristhi Fashions home"
      >
        <DristhiLogo size="sm" variant="horizontal" compactOnMobile />
      </button>
      <button
        onClick={() => onNavigate(altAction?.path ?? '/')}
        className="shrink-0 text-xs text-[#e0e0fb] hover:text-white underline font-sans"
      >
        {altAction?.label ?? 'Return to Shop'}
      </button>
    </div>

    <div className="max-w-md w-full mx-auto my-auto py-8 z-10">
      <div className="bg-[#181a2d]/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-[#fed255]/30 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="badge-new bg-[#fed255] text-[#0d1648] font-bold text-[9px] uppercase tracking-wider">
            {eyebrow}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          <p className="text-xs text-[#e0e0fb] font-sans leading-relaxed">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="pt-4 border-t border-[#ffe08e]/20 text-center text-xs">{footer}</div>}
      </div>
    </div>

    <div className="text-center text-[10px] text-[#e0e0fb] font-sans flex items-center justify-center gap-2 z-10">
      <ShieldCheck className="w-4 h-4 text-[#fed255]" />
      <span>Encrypted connection — your details stay private</span>
    </div>
  </div>
);

export const authInputClass =
  'w-full bg-[#0d1648]/80 border border-[#c6c5d0]/30 rounded-lg px-4 py-3 text-white placeholder-[#767680] focus:outline-none focus:border-[#fed255]';

export const authLabelClass = 'font-bold text-[#ffe08e] uppercase tracking-wider block mb-1 text-[11px]';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

/**
 * Six single-character boxes backed by one string. Typing advances, backspace
 * on an empty box steps back, and a pasted code fills the whole row.
 */
export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6, autoFocus = true }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length }, (_, i) => value[i] ?? ''));

  useEffect(() => {
    setDigits(Array.from({ length }, (_, i) => value[i] ?? ''));
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string[]) => {
    setDigits(next);
    onChange(next.join(''));
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      commit(next);
      return;
    }
    // Handles both a single keystroke and a pasted full code.
    const next = [...digits];
    for (let i = 0; i < cleaned.length && index + i < length; i++) {
      next[index + i] = cleaned[i];
    }
    commit(next);
    refs.current[Math.min(index + cleaned.length, length - 1)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    /*
     * Six fixed 44px boxes plus their gaps came to ~304px, wider than the
     * ~280px the auth card leaves on a 360px phone — the last box was cut off
     * by the card edge. The boxes now divide the row between them and take
     * their height from their own width, so the code fits any screen down to
     * 320px and still looks square.
     */
    <div className="flex w-full justify-between gap-1.5 sm:gap-2">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={el => {
            refs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          aria-label={`Digit ${idx + 1}`}
          className="min-w-0 flex-1 aspect-square max-w-[3rem] p-0 text-center text-lg font-bold bg-[#0d1648] border border-[#fed255] rounded-lg text-white focus:outline-none focus:ring-2 ring-[#fed255]"
        />
      ))}
    </div>
  );
};
