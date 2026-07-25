import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthLayout, OtpInput, authInputClass, authLabelClass } from '../components/common/AuthLayout';
import { useStore } from '../context/StoreContext';

interface ResetPasswordPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const MIN_PASSWORD_LENGTH = 8;

/** Step two of the reset flow: email + emailed code + the new password. */
export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ currentPath, onNavigate }) => {
  const { resetPassword, forgotPassword } = useStore();

  const initialEmail =
    new URLSearchParams(currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '').get('email') ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Both passwords must match.');
      return;
    }
    setError(null);
    setLoading(true);
    const ok = await resetPassword(email.trim(), otp, password);
    setLoading(false);
    if (ok) onNavigate('/login');
  };

  return (
    <AuthLayout
      eyebrow="SET A NEW PASSWORD"
      title="Reset Password"
      subtitle={email ? `Enter the code sent to ${email} and choose a new password.` : 'Enter your reset code and choose a new password.'}
      altAction={{ label: 'Sign In', path: '/login' }}
      onNavigate={onNavigate}
      footer={
        <button
          onClick={() => void forgotPassword(email.trim())}
          disabled={!email.trim()}
          className="text-[#ffe08e] hover:underline disabled:opacity-50"
        >
          Send a new code
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        {!initialEmail && (
          <div>
            <label className={authLabelClass} htmlFor="reset-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="reset-email"
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

        <div>
          <span className={authLabelClass}>Verification Code</span>
          <OtpInput value={otp} onChange={setOtp} autoFocus={Boolean(initialEmail)} />
        </div>

        <div>
          <label className={authLabelClass} htmlFor="reset-password">
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              className={`${authInputClass} pl-10 pr-10`}
              required
            />
            <Lock className="w-4 h-4 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e0e0fb] hover:text-white"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={authLabelClass} htmlFor="reset-confirm">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="reset-confirm"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className={`${authInputClass} pl-10`}
              required
            />
            <Lock className="w-4 h-4 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {error && <p className="text-[11px] text-[#ff9d9d]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{loading ? 'UPDATING…' : 'UPDATE PASSWORD'}</span>
        </button>
      </form>
    </AuthLayout>
  );
};
