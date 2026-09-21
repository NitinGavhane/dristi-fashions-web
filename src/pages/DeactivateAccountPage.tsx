import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, PauseCircle } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';

interface DeactivateAccountPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Deactivation — the reversible door out.
 *
 * Nothing is erased here, and the page's main job is to make that obvious so
 * that someone who only wants a break does not reach for deletion instead.
 * The confirmation code is requested as soon as the page opens, which is why
 * the field simply asks for the code that was received.
 */
const EFFECTS = [
  'You are logged out of your Dristi Fashions account.',
  'Your profile is no longer visible on the store.',
  'Your reviews and ratings stay, but your name is shown as ‘Unavailable’.',
  'Your wishlist is no longer accessible and is shown as ‘Unavailable’.',
  'You are unsubscribed from receiving promotional emails from us.',
  'Your account data is retained, and is restored if you choose to reactivate your account.',
];

export const DeactivateAccountPage: React.FC<DeactivateAccountPageProps> = ({ onNavigate }) => {
  const { user, authLoading, isAuthenticated, sendDeactivationOtp, deactivateAccount } = useStore();

  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // React 18 StrictMode mounts effects twice in development; without this the
  // shopper would be emailed two codes and only the second one would work.
  const requestedRef = useRef(false);

  const requestOtp = async () => {
    setSending(true);
    const ok = await sendDeactivationOtp();
    setSending(false);
    if (ok) setSent(true);
  };

  useEffect(() => {
    if (!isAuthenticated || requestedRef.current) return;
    requestedRef.current = true;
    void requestOtp();
    // Fires once per signed-in visit; requestOtp closes over stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || submitting) return;
    setSubmitting(true);
    const ok = await deactivateAccount(otp);
    setSubmitting(false);
    if (ok) onNavigate('/');
  };

  if (authLoading) return <Spinner label="Loading your account…" className="min-h-[50vh]" />;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          title="Deactivate Account"
          message="Sign in to manage your account."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/deactivate')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile/settings')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#c6c5d0]/30 space-y-6">
        <div className="flex items-start gap-3">
          <span className="p-2.5 rounded-lg bg-[#f4f2ff] shrink-0">
            <PauseCircle className="w-5 h-5 text-[#755b00]" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#0d1648]">
              Are you sure you want to leave?
            </h1>
            <p className="text-xs text-[#767680] font-sans mt-1">
              Deactivating is not deleting. Everything is kept and comes back when you sign in.
            </p>
          </div>
        </div>

        <section className="bg-[#f4f2ff] rounded-xl p-5">
          <h2 className="text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-3">
            When you deactivate your account
          </h2>
          <ul className="space-y-2">
            {EFFECTS.map(effect => (
              <li key={effect} className="flex gap-2 text-[13px] text-[#46464f] font-sans leading-relaxed">
                <span className="text-[#755b00] shrink-0">—</span>
                <span>{effect}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[#c6c5d0]/60 p-5">
          <h2 className="text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-2">
            How do I reactivate my account?
          </h2>
          <p className="text-[13px] text-[#46464f] font-sans leading-relaxed">
            Reactivation is easy. Simply sign in with the registered email address and password you
            used before deactivating. Your account data is fully restored, default settings are
            applied, and you are subscribed to receive promotional emails again.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name the destination explicitly. This used to list the email
              and the phone number side by side, which read as though the code
              might arrive by SMS — it only ever goes to the email address. */}
          <div className="rounded-xl bg-[#f4f2ff] px-4 py-3 text-sm font-sans text-[#46464f]">
            We have sent a 6-digit code to your registered email address,{' '}
            <span className="font-semibold text-[#0d1648]">{user.email}</span>.
          </div>

          <div>
            <label
              className="block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-1.5"
              htmlFor="deactivate-otp"
            >
              Enter received OTP
            </label>
            <input
              id="deactivate-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-3 text-center text-xl font-bold tracking-[0.5em] text-[#181a2d] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]"
              placeholder="••••••"
              required
            />
            <button
              type="button"
              onClick={() => void requestOtp()}
              disabled={sending}
              className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#755b00] hover:underline disabled:opacity-50"
            >
              {sending ? 'Sending code…' : sent ? 'Resend code' : 'Send code'}
            </button>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full py-3.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold tracking-widest inline-flex items-center justify-center gap-2 shadow-lg hover:bg-[#93000a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>CONFIRM DEACTIVATION</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/profile')}
              className="btn-outline w-full py-3.5 text-xs font-bold tracking-widest"
            >
              NO, LET ME STAY!
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
