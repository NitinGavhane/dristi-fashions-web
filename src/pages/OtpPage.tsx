import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { AuthLayout, OtpInput, authInputClass, authLabelClass } from '../components/common/AuthLayout';
import { useStore } from '../context/StoreContext';

interface OtpPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Confirms the code emailed after registration. The address is normally carried
 * over from the sign-up form; if it is missing the customer can type it in.
 */
export const OtpPage: React.FC<OtpPageProps> = ({ currentPath, onNavigate }) => {
  const { verifyOtp, resendOtp, isAuthenticated } = useStore();

  const initialEmail =
    new URLSearchParams(currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '').get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || otp.length < 6) return;
    setLoading(true);
    const ok = await verifyOtp(email.trim(), otp);
    setLoading(false);
    if (!ok) return;
    // verifyOtp signs the customer in when the backend returns tokens; if it
    // did not, they still need to log in.
    onNavigate(isAuthenticated ? '/profile' : '/login');
  };

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) return;
    const ok = await resendOtp(email.trim());
    if (ok) setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <AuthLayout
      eyebrow="EMAIL VERIFICATION"
      title="Verify Your Email"
      subtitle={
        email ? `Enter the 6-digit code we sent to ${email}.` : 'Enter your email address and the code we sent you.'
      }
      altAction={{ label: 'Sign In', path: '/login' }}
      onNavigate={onNavigate}
      footer={
        <p className="text-[#e0e0fb]">
          Wrong address?{' '}
          <button onClick={() => onNavigate('/register')} className="text-[#fed255] font-bold hover:underline">
            Sign up again
          </button>
        </p>
      }
    >
      <form onSubmit={handleVerify} className="space-y-5 text-xs font-sans">
        {!initialEmail && (
          <div>
            <label className={authLabelClass} htmlFor="verify-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="verify-email"
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
        )}

        <OtpInput value={otp} onChange={setOtp} />

        <button
          type="submit"
          disabled={loading || otp.length < 6 || !email.trim()}
          className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{loading ? 'VERIFYING…' : 'VERIFY EMAIL'}</span>
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || !email.trim()}
          className="text-[#ffe08e] hover:underline text-center w-full text-[11px] disabled:opacity-50 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
        </button>
      </form>
    </AuthLayout>
  );
};
