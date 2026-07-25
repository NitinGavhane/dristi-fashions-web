import React, { useMemo } from 'react';
import { ArrowLeft, Award, Copy, Gift, MousePointerClick, Share2, Users } from 'lucide-react';
import { EmptyState, ErrorState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { referralApi } from '../lib/api';
import { formatCurrency, formatDate, humanizeStatus } from '../lib/format';
import { useAsync } from '../lib/useAsync';

interface ReferralPageProps {
  onNavigate: (path: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-[#e6f4ea] text-[#1e6b32]',
  pending: 'bg-[#fff4d6] text-[#755b00]',
  rejected: 'bg-[#fdeaea] text-[#ba1a1a]',
};

export const ReferralPage: React.FC<ReferralPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, authLoading, showToast } = useStore();

  const stats = useAsync(() => referralApi.stats(), []);
  const history = useAsync(() => referralApi.history(), []);

  // The backend supplies the storefront origin, so the invite link is correct
  // regardless of where this app happens to be served from.
  const inviteLink = useMemo(() => {
    if (!stats.data?.referralCode) return '';
    const base = stats.data.shareBaseUrl?.replace(/\/$/, '') || window.location.origin;
    return `${base}/register?ref=${stats.data.referralCode}`;
  }, [stats.data]);

  const copy = async (text: string, title: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(title, message, 'success');
    } catch {
      showToast('Could Not Copy', 'Your browser blocked clipboard access.', 'error');
    }
  };

  const handleShare = async () => {
    if (!inviteLink || !stats.data) return;
    const shareData = {
      title: 'Dristhi Fashions',
      text: `Shop Dristhi Fashions with my code ${stats.data.referralCode}.`,
      url: inviteLink,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* dismissed — fall through to copying */
      }
    }
    await copy(inviteLink, 'Invite Link Copied', 'Share this link with your friends.');
  };

  if (authLoading) return <Spinner label="Loading…" className="min-h-[50vh]" />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Gift className="w-12 h-12" />}
          title="Referral Programme"
          message="Sign in to get your referral code and track your earnings."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/referral')}
        />
      </div>
    );
  }

  if (stats.loading) return <Spinner label="Loading your referral stats…" className="min-h-[50vh]" />;

  if (stats.error || !stats.data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState message={stats.error ?? 'Referral details are unavailable.'} onRetry={stats.reload} />
      </div>
    );
  }

  const data = stats.data;
  const entries = history.data ?? [];

  const summaryCards = [
    { icon: Users, label: 'Successful Referrals', value: String(data.successfulReferrals) },
    { icon: Award, label: 'Total Earned', value: formatCurrency(data.totalEarnings) },
    { icon: Gift, label: 'Awaiting Approval', value: formatCurrency(data.pendingEarnings) },
    { icon: MousePointerClick, label: 'Link Clicks', value: String(data.totalClicks) },
  ];

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Account
      </button>

      <div className="border-b border-[#c6c5d0]/30 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Refer & Earn</h1>
        <p className="text-xs text-[#767680] font-sans mt-1">
          {data.programmeEnabled
            ? `Earn ${data.commissionPercentage}% commission when someone shops using your code.`
            : 'The referral programme is currently paused.'}
        </p>
      </div>

      {/* Code + link */}
      <div className="navy-gradient rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-5">
        <div>
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#ffe08e] block mb-2">
            YOUR REFERRAL CODE
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {/* `break-all`: the code is server-generated and has no spaces to
                wrap at, so without it a long one runs out of the card. */}
            <span className="font-mono text-xl sm:text-3xl font-bold text-[#fed255] tracking-widest break-all">
              {data.referralCode || '—'}
            </span>
            {data.referralCode && (
              <button
                onClick={() => copy(data.referralCode!, 'Code Copied', `Referral code ${data.referralCode} copied.`)}
                className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-[#ffe08e] transition-colors"
                aria-label="Copy referral code"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {inviteLink && (
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#ffe08e] block mb-2">
              INVITE LINK
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={inviteLink}
                onFocus={e => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-[#0d1648]/70 border border-[#fed255]/30 rounded-lg px-3.5 py-2.5 text-xs text-[#e0e0fb] font-mono focus:outline-none focus:border-[#fed255]"
              />
              <button
                onClick={handleShare}
                className="btn-primary shrink-0 px-5 py-2.5 text-[11px] inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>Share</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <div key={card.label} className="min-w-0 bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4">
            <card.icon className="w-5 h-5 text-[#755b00] mb-2" />
            <p className="font-serif text-lg sm:text-xl font-bold text-[#0d1648] break-words">{card.value}</p>
            <p className="text-[10px] text-[#767680] font-sans uppercase tracking-wider mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
        <h2 className="font-serif text-lg font-bold text-[#0d1648] mb-4">Referral Activity</h2>

        {history.loading ? (
          <Spinner label="Loading activity…" />
        ) : entries.length === 0 ? (
          <EmptyState
            title="No referrals yet"
            message="Share your code — rewards appear here once a friend's order is approved."
            actionLabel="Share Your Link"
            onAction={handleShare}
          />
        ) : (
          <div className="divide-y divide-[#c6c5d0]/30">
            {entries.map(entry => (
              <div key={entry.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0d1648] font-sans line-clamp-1">
                    {entry.referredUserName || entry.referredUserEmail || 'A new customer'}
                  </p>
                  <p className="text-[11px] text-[#767680] font-sans">
                    {[entry.productName, formatDate(entry.createdAt)].filter(Boolean).join(' · ')}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#0d1648] font-sans">{formatCurrency(entry.rewardAmount)}</p>
                  <span
                    className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      STATUS_STYLES[entry.status] ?? STATUS_STYLES.pending
                    }`}
                  >
                    {humanizeStatus(entry.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-[11px] text-[#767680] font-sans text-center leading-relaxed">
        Rewards are reviewed by our team before they are credited to your wallet.
      </p>
    </div>
  );
};
