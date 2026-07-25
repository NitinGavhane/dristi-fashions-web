import React, { useState } from 'react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { AuthLayout, authInputClass, authLabelClass } from '../components/common/AuthLayout';
import { useStore } from '../context/StoreContext';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

/** Step one of the reset flow: request the code. Step two lives on /reset-password. */
export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const { forgotPassword } = useStore();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const ok = await forgotPassword(email.trim());
    setLoading(false);
    if (ok) onNavigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthLayout
      eyebrow="ACCOUNT RECOVERY"
      title="Forgot Your Password?"
      subtitle="Enter your email address and we will send you a code to set a new password."
      altAction={{ label: 'Sign In', path: '/login' }}
      onNavigate={onNavigate}
      footer={
        <p className="text-[#e0e0fb]">
          Remembered it?{' '}
          <button onClick={() => onNavigate('/login')} className="text-[#fed255] font-bold hover:underline">
            Back to Sign In
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div>
          <label className={authLabelClass} htmlFor="forgot-email">
            Email Address
          </label>
          <div className="relative">
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`${authInputClass} pl-10`}
              required
            />
            <Mail className="w-4 h-4 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          <span>{loading ? 'SENDING CODE…' : 'SEND RESET CODE'}</span>
        </button>

        <p className="text-[10px] text-[#c6c5d0] text-center leading-relaxed">
          If an account exists for that address, a reset code will arrive shortly.
        </p>
      </form>
    </AuthLayout>
  );
};
