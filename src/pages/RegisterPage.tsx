import React, { useEffect, useState } from 'react';
import { Loader2, Lock, Mail, Phone, Tag, User } from 'lucide-react';
import { AuthLayout, authInputClass, authLabelClass } from '../components/common/AuthLayout';
import { useStore } from '../context/StoreContext';

interface RegisterPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const MIN_PASSWORD_LENGTH = 8;

export const RegisterPage: React.FC<RegisterPageProps> = ({ currentPath, onNavigate }) => {
  const { register } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A referral link lands as /register?ref=CODE, but a friend may also arrive
  // via a shared product link (/product/<id>?ref=CODE) and only reach this page
  // later — the code is stashed in localStorage then, so prefill from either.
  useEffect(() => {
    const query = currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : window.location.search;
    let ref = new URLSearchParams(query).get('ref');
    if (!ref) {
      try {
        ref = localStorage.getItem('dristi_referral');
      } catch {
        ref = null;
      }
    }
    if (ref) setReferralCode(ref.toUpperCase());
  }, [currentPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the terms of service to continue.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setError(null);
    setLoading(true);
    const ok = await register({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
    });
    setLoading(false);

    // Registration only creates the account — the emailed code has to be
    // confirmed before the customer can sign in.
    if (ok) onNavigate(`/otp-verification?email=${encodeURIComponent(email.trim())}`);
  };

  const field = (
    id: string,
    label: string,
    icon: React.ReactNode,
    input: React.ReactNode,
  ) => (
    <div>
      <label className={authLabelClass} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        {input}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffe08e] pointer-events-none">{icon}</span>
      </div>
    </div>
  );

  return (
    <AuthLayout
      eyebrow="CREATE ACCOUNT"
      title="Join Dristi Fashions"
      subtitle="Create an account to track orders, save a wishlist and earn referral rewards."
      altAction={{ label: 'Sign In', path: '/login' }}
      onNavigate={onNavigate}
      footer={
        <p className="text-[#e0e0fb]">
          Already have an account?{' '}
          <button onClick={() => onNavigate('/login')} className="text-[#fed255] font-bold hover:underline">
            Sign In
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-sans">
        {field(
          'reg-name',
          'Full Name',
          <User className="w-4 h-4" />,
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            className={`${authInputClass} pl-10`}
            required
          />,
        )}

        {field(
          'reg-email',
          'Email Address',
          <Mail className="w-4 h-4" />,
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${authInputClass} pl-10`}
            required
          />,
        )}

        {field(
          'reg-phone',
          'Phone Number',
          <Phone className="w-4 h-4" />,
          <input
            id="reg-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="98765 43210"
            className={`${authInputClass} pl-10`}
            required
          />,
        )}

        {field(
          'reg-password',
          'Password',
          <Lock className="w-4 h-4" />,
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            className={`${authInputClass} pl-10`}
            required
          />,
        )}

        {field(
          'reg-referral',
          'Referral Code (Optional)',
          <Tag className="w-4 h-4" />,
          <input
            id="reg-referral"
            type="text"
            value={referralCode}
            onChange={e => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Friend's code"
            className={`${authInputClass} pl-10 uppercase font-mono`}
          />,
        )}

        <label className="flex items-start gap-2 text-[11px] text-[#e0e0fb] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="accent-[#fed255] mt-0.5"
          />
          <span>I agree to the Dristi Fashions Terms of Service and Privacy Policy</span>
        </label>

        {error && <p className="text-[11px] text-[#ff9d9d]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-xs font-bold tracking-widest flex items-center justify-center gap-2 shadow-xl mt-4 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}</span>
        </button>

        <p className="text-[10px] text-[#c6c5d0] text-center leading-relaxed">
          We will email a 6-digit code to verify your address.
        </p>
      </form>
    </AuthLayout>
  );
};
