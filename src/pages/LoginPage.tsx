import React, { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { AuthLayout, OtpInput, authInputClass, authLabelClass } from '../components/common/AuthLayout';
import { useStore } from '../context/StoreContext';

interface LoginPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

type Mode = 'password' | 'otp';

const RESEND_COOLDOWN = 30;

export const LoginPage: React.FC<LoginPageProps> = ({ currentPath, onNavigate }) => {
  const { login, sendLoginOtp, loginWithOtp } = useStore();

  // Where to land after signing in — set by "sign in to checkout" links.
  const next = new URLSearchParams(currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '').get(
    'next',
  );

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const goAfterLogin = () => onNavigate(next || '/profile');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) goAfterLogin();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const ok = await sendLoginOtp(email.trim());
    setLoading(false);
    if (ok) setOtpSent(true);
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    const ok = await loginWithOtp(email.trim(), otp);
    setLoading(false);
    if (ok) goAfterLogin();
  };

  return (
    <AuthLayout
      eyebrow="MEMBER ACCESS"
      title="Welcome Back"
      subtitle={
        mode === 'password'
          ? 'Sign in to view your orders, wishlist and wallet.'
          : otpSent
            ? `Enter the 6-digit code we sent to ${email}.`
            : 'We will email you a one-time code to sign in with.'
      }
      altAction={{ label: 'Return to Shop', path: '/' }}
      onNavigate={onNavigate}
      footer={
        <p className="text-[#e0e0fb]">
          New to Dristhi Fashions?{' '}
          <button onClick={() => onNavigate('/register')} className="text-[#fed255] font-bold hover:underline">
            Create an Account
          </button>
        </p>
      }
    >
      {/* Mode switch */}
      <div className="flex gap-1 p-1 rounded-full bg-[#0d1648]/60 border border-[#fed255]/20">
        {(['password', 'otp'] as const).map(m => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setOtpSent(false);
              setOtp('');
            }}
            className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === m ? 'bg-[#fed255] text-[#0d1648]' : 'text-[#e0e0fb] hover:text-white'
            }`}
          >
            {m === 'password' ? 'Password' : 'Email OTP'}
          </button>
        ))}
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className={authLabelClass} htmlFor="login-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="login-email"
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

          <div>
            <label className={authLabelClass} htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${authInputClass} pl-10 pr-10`}
                required
              />
              <Lock className="w-4 h-4 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e0e0fb] hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end text-[11px]">
            <button
              type="button"
              onClick={() => onNavigate('/forgot-password')}
              className="text-[#ffe08e] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl mt-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{loading ? 'SIGNING IN…' : 'SIGN IN'}</span>
          </button>
        </form>
      ) : !otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4 text-xs font-sans">
          <div>
            <label className={authLabelClass} htmlFor="otp-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="otp-email"
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
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'SENDING CODE…' : 'SEND ONE-TIME CODE'}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="space-y-5 text-xs font-sans">
          <OtpInput value={otp} onChange={setOtp} />

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? 'VERIFYING…' : 'VERIFY & SIGN IN'}</span>
          </button>

          <div className="flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setCooldown(0);
              }}
              className="text-[#e0e0fb] hover:text-white underline"
            >
              Change email
            </button>
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={() => {
                void sendLoginOtp(email.trim());
                setCooldown(RESEND_COOLDOWN);
              }}
              className="text-[#ffe08e] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
