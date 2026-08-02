import React, { useEffect } from 'react';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate } from '../lib/format';

interface WalletPageProps {
  onNavigate: (path: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, authLoading, walletBalance, walletTransactions, refreshWallet } = useStore();

  useEffect(() => {
    if (isAuthenticated) void refreshWallet();
  }, [isAuthenticated, refreshWallet]);

  if (authLoading) return <Spinner label="Loading your wallet…" className="min-h-[50vh]" />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          icon={<Wallet className="w-12 h-12" />}
          title="Dristi Wallet"
          message="Sign in to view your store credit and referral earnings."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/wallet')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Account
      </button>

      <div className="border-b border-[#c6c5d0]/30 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Dristi Wallet</h1>
        <p className="text-xs text-[#767680] font-sans mt-1">
          Your store credit balance and every transaction behind it.
        </p>
      </div>

      <div className="gold-gradient rounded-2xl p-6 sm:p-8 text-[#0d1648] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="min-w-0 text-center sm:text-left">
          <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#755b00] block mb-1">
            AVAILABLE BALANCE
          </span>
          {/* A five-figure balance at `text-5xl` is wider than a 320px screen,
              so the figure steps up with the viewport instead. */}
          <h2 className="font-serif text-3xl sm:text-5xl font-bold break-words">{formatCurrency(walletBalance)}</h2>
          {/* Redemption is arranged by the team — the checkout does not deduct
              from the wallet, so promising that here would be untrue. */}
          <p className="text-xs mt-2 font-sans opacity-90 max-w-sm leading-relaxed">
            Credit earned from approved referral rewards. Contact our team to apply it to an order.
          </p>
        </div>

        <div className="p-4 bg-[#0d1648] text-[#ffe08e] rounded-xl text-center shrink-0 border border-[#fed255]/40 shadow-md">
          <Wallet className="w-8 h-8 text-[#fed255] mx-auto mb-1" />
          <span className="text-xs font-bold font-serif block">Store Credit</span>
          <span className="text-[10px] text-[#c6c5d0] block">{walletTransactions.length} transactions</span>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
        <h2 className="font-serif text-lg font-bold text-[#0d1648] mb-4">Transaction History</h2>

        {walletTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            message="Referral rewards and store credit will show up here once they are approved."
            actionLabel="View Referral Programme"
            onAction={() => onNavigate('/profile/referral')}
          />
        ) : (
          <div className="divide-y divide-[#c6c5d0]/30">
            {walletTransactions.map(tx => {
              const credit = tx.type === 'credit';
              return (
                <div key={tx.id} className="py-3.5 flex items-center gap-4">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      credit ? 'bg-[#e6f4ea] text-[#1e6b32]' : 'bg-[#fdeaea] text-[#ba1a1a]'
                    }`}
                  >
                    {credit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0d1648] font-sans line-clamp-1">{tx.description}</p>
                    <p className="text-[11px] text-[#767680] font-sans">{formatDate(tx.createdAt)}</p>
                  </div>

                  <span
                    className={`text-sm font-bold font-sans shrink-0 ${credit ? 'text-[#1e6b32]' : 'text-[#ba1a1a]'}`}
                  >
                    {credit ? '+' : '−'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
