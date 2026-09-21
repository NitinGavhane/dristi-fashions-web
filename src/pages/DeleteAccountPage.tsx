import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Info, Loader2, Trash2 } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import type { ApiDeletionEligibility } from '../types';

interface DeleteAccountPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Deletion — the permanent door out.
 *
 * Deliberately slower than deactivation: the account has to be clear of
 * unfinished business, all three acknowledgements have to be ticked, and a
 * code emailed to the registered address has to be typed back in. Anyone who
 * only wants a pause is pointed at the deactivation page first.
 */
const CONDITIONS = [
  'There are no pending orders, cancellations, returns, refunds or other requests. If there are, please raise your deletion request once they are completed.',
  'You have exhausted, or do not intend to use, your Dristi Wallet balance and any referral rewards. Once your account is deleted you will not be able to access them.',
  'You will not be able to access order history, your profile, wishlist, saved addresses, previous orders and invoices, or use any of the products and services we offer, immediately on deletion. You will have to create a new account to shop with us again.',
  'We may refuse deletion of your account if you have a legal dispute, or a grievance related to pending payments, orders, shipments or deliveries.',
  'We may retain certain data for legitimate reasons — security, fraud prevention and regulatory compliance, including tax invoices we are required by law to keep.',
  'After your account is deleted, signing in with the same phone number or email address creates a fresh new account. Your old account data will not be accessible in it.',
  'Please uninstall our app after your account is deleted to stop receiving notifications. Notifications are an app-level setting, so uninstalling the app is required to stop all of them.',
];

const ACKNOWLEDGEMENTS = [
  { key: 'acceptedTerms', label: 'I have read and agreed to the Terms and Conditions.' },
  {
    key: 'acknowledgedBalanceForfeit',
    label:
      'I acknowledge that I do not have any Dristi Wallet balance or referral rewards in my account, or I am willing to forfeit any such balance available in my account.',
  },
  {
    key: 'acknowledgedNoReturns',
    label:
      'I acknowledge that I will not be able to return or replace, or seek any service regarding, any past order or transaction.',
  },
] as const;

type AckKey = (typeof ACKNOWLEDGEMENTS)[number]['key'];

export const DeleteAccountPage: React.FC<DeleteAccountPageProps> = ({ onNavigate }) => {
  const { user, authLoading, isAuthenticated, deletionEligibility, sendDeletionOtp, deleteAccount } =
    useStore();

  const [eligibility, setEligibility] = useState<ApiDeletionEligibility | null>(null);
  const [checking, setChecking] = useState(true);

  const [acks, setAcks] = useState<Record<AckKey, boolean>>({
    acceptedTerms: false,
    acknowledgedBalanceForfeit: false,
    acknowledgedNoReturns: false,
  });
  const [reason, setReason] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await deletionEligibility();
      if (cancelled) return;
      setEligibility(result);
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, deletionEligibility]);

  const allAcknowledged = ACKNOWLEDGEMENTS.every(a => acks[a.key]);
  const canDelete = eligibility?.canDelete ?? false;
  const blockers = eligibility?.blockers ?? [];

  const handleRequestOtp = async () => {
    setBusy(true);
    const ok = await sendDeletionOtp();
    setBusy(false);
    if (ok) setOtpSent(true);
  };

  const handleDelete = async () => {
    if (otp.length !== 6) return;
    const confirmed = window.confirm(
      'Deleting your account is permanent. It cannot be restored under any circumstances, ' +
        'and your order history will no longer be accessible.\n\nDelete the account?',
    );
    if (!confirmed) return;

    setBusy(true);
    const ok = await deleteAccount({
      otp,
      reason: reason.trim(),
      acceptedTerms: acks.acceptedTerms,
      acknowledgedBalanceForfeit: acks.acknowledgedBalanceForfeit,
      acknowledgedNoReturns: acks.acknowledgedNoReturns,
    });
    setBusy(false);
    if (ok) onNavigate('/');
  };

  if (authLoading || checking) return <Spinner label="Checking your account…" className="min-h-[50vh]" />;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          title="Delete Account"
          message="Sign in to manage your account."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/delete')}
        />
      </div>
    );
  }

  const sectionLabel = 'text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans';

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
          <span className="p-2.5 rounded-lg bg-[#ffdad6] shrink-0">
            <Trash2 className="w-5 h-5 text-[#ba1a1a]" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#0d1648]">We are sorry to see you go!</h1>
            <p className="text-[13px] text-[#46464f] font-sans mt-1 leading-relaxed">
              Once you choose to delete your account, it will no longer be available to you and you
              will not be able to activate, restore or use it again.
            </p>
          </div>
        </div>

        {/* The gentler option, offered before any of the irreversible machinery. */}
        <section className="rounded-xl border border-[#c6c5d0]/60 bg-[#f4f2ff] p-5">
          <h2 className={`${sectionLabel} mb-2`}>Not sure? Deactivate instead</h2>
          <p className="text-[13px] text-[#46464f] font-sans leading-relaxed">
            Deactivating logs you out, hides your profile, makes your wishlist unreachable and
            unsubscribes you from promotional emails — but nothing is erased. Sign in again any time
            and everything comes back.
          </p>
          <button
            onClick={() => onNavigate('/profile/deactivate')}
            className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#755b00] hover:underline"
          >
            Deactivate my account instead
          </button>
        </section>

        {blockers.length > 0 && (
          <section className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] p-5">
            <h2 className="flex items-center gap-2 text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider font-sans mb-2">
              <Info className="w-4 h-4" /> Your account cannot be deleted yet
            </h2>
            <ul className="space-y-1.5">
              {blockers.map(blocker => (
                <li key={blocker.code} className="text-[13px] text-[#46464f] font-sans leading-relaxed">
                  {blocker.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className={`${sectionLabel} mb-3`}>Please read and understand the following</h2>
          <ul className="space-y-2.5">
            {CONDITIONS.map(condition => (
              <li
                key={condition}
                className="flex gap-2 text-[13px] text-[#46464f] font-sans leading-relaxed"
              >
                <span className="text-[#755b00] shrink-0">—</span>
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6] p-5">
          <h2 className="flex items-center gap-2 text-[11px] font-bold text-[#ba1a1a] uppercase tracking-wider font-sans mb-2">
            <AlertTriangle className="w-4 h-4" /> Deleting your account is permanent
          </h2>
          <p className="text-[13px] text-[#46464f] font-sans leading-relaxed">
            Once your account is deleted you will lose your Dristi Fashions data, including your
            order history. It will no longer be accessible and cannot be restored under any
            circumstances.
          </p>
        </section>

        <section className="space-y-3">
          {ACKNOWLEDGEMENTS.map(ack => (
            <label key={ack.key} className="flex gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acks[ack.key]}
                onChange={e => setAcks(prev => ({ ...prev, [ack.key]: e.target.checked }))}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#0d1648]"
              />
              <span className="text-[13px] text-[#46464f] font-sans leading-relaxed">{ack.label}</span>
            </label>
          ))}
        </section>

        <div>
          <label className={`${sectionLabel} block mb-1.5`} htmlFor="delete-reason">
            Please tell us why you’re leaving us
          </label>
          <textarea
            id="delete-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Your reason (optional, but it helps us improve)"
            className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-2.5 text-sm text-[#181a2d] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]"
          />
        </div>

        {otpSent && (
          <div>
            <label className={`${sectionLabel} block mb-1.5`} htmlFor="delete-otp">
              Enter received OTP
            </label>
            <input
              id="delete-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-3 text-center text-xl font-bold tracking-[0.5em] text-[#181a2d] focus:outline-none focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]/40"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => void handleRequestOtp()}
              disabled={busy}
              className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#755b00] hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        )}

        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => void (otpSent ? handleDelete() : handleRequestOtp())}
            disabled={busy || !canDelete || !allAcknowledged || (otpSent && otp.length !== 6)}
            className="w-full py-3.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold tracking-widest inline-flex items-center justify-center gap-2 shadow-lg hover:bg-[#93000a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{otpSent ? 'DELETE ACCOUNT' : 'CONTINUE'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/profile')}
            className="btn-outline w-full py-3.5 text-xs font-bold tracking-widest"
          >
            NO, LET ME STAY!
          </button>
        </div>
      </div>
    </div>
  );
};
