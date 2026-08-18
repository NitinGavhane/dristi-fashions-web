import React from 'react';
import {
  ChevronRight,
  Copy,
  Gift,
  Headphones,
  Info,
  Lock,
  LogOut,
  MapPin,
  Package,
  Settings,
  Wallet,
} from 'lucide-react';
import { BackButton } from '../components/common/BackButton';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { formatCurrency, initials } from '../lib/format';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

const MENU = [
  {
    title: 'My Orders',
    desc: 'Track shipments and download GST invoices',
    icon: Package,
    path: '/orders',
  },
  {
    title: 'My Addresses',
    desc: 'Manage your saved delivery addresses',
    icon: MapPin,
    path: '/profile/addresses',
  },
  {
    title: 'Dristi Wallet',
    desc: 'View your store credit and transactions',
    icon: Wallet,
    path: '/profile/wallet',
  },
  {
    title: 'Refer & Earn',
    desc: 'Share your code and track referral rewards',
    icon: Gift,
    path: '/profile/referral',
  },
  {
    title: 'Account Settings',
    desc: 'Update your name, email and phone number',
    icon: Settings,
    path: '/profile/settings',
  },
  {
    title: 'Change Password',
    desc: 'Update your sign-in credentials',
    icon: Lock,
    path: '/profile/change-password',
  },
  {
    title: 'About Dristi',
    desc: 'Our story and what we stand for',
    icon: Info,
    path: '/profile/about',
  },
  {
    title: 'Contact Us',
    desc: 'Get in touch with our customer care team',
    icon: Headphones,
    path: '/contact',
  },
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, authLoading, walletBalance, orders, wishlist, logout, showToast } = useStore();

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} to="/" className="mb-6" />
        <Spinner label="Loading your account…" className="min-h-[50vh]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <BackButton onNavigate={onNavigate} to="/" className="mb-6" />
        <EmptyState
          title="My Account"
          message="Sign in to manage your orders, addresses and wallet."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile')}
        />
      </div>
    );
  }

  const handleCopyReferral = async () => {
    if (!user.referralCode) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      showToast('Code Copied', `Referral code ${user.referralCode} copied.`, 'success');
    } catch {
      showToast('Could Not Copy', 'Your browser blocked clipboard access.', 'error');
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <BackButton onNavigate={onNavigate} to="/" />
      {/* Header */}
      <div className="bg-[#0d1648] text-white rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-[#fed255]/30 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#fed255]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex w-full sm:w-auto items-center gap-4 sm:gap-5 z-10 min-w-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[#fed255] shadow-lg shrink-0"
            />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#181a2d] text-[#ffe08e] font-serif text-xl sm:text-2xl font-bold flex items-center justify-center border-2 border-[#fed255] shrink-0">
              {initials(user.fullName)}
            </div>
          )}

          <div className="min-w-0">
            {user.isVerified && (
              <span className="badge-new bg-[#fed255] text-[#0d1648] font-bold text-[9px] mb-1 inline-block">
                VERIFIED
              </span>
            )}
            <h1 className="font-serif text-xl sm:text-3xl font-bold text-white truncate">{user.fullName}</h1>
            {/* Email and phone on separate lines below `sm` — joined with a
                separator they were one long unbreakable string that truncated
                the phone number away entirely on a phone. */}
            <p className="text-xs text-[#e0e0fb] font-sans mt-0.5 truncate">{user.email}</p>
            {user.phone && <p className="text-xs text-[#e0e0fb] font-sans truncate">{user.phone}</p>}
          </div>
        </div>

        {user.referralCode && (
          <div className="bg-[#181a2d] border border-[#fed255]/30 p-4 rounded-xl text-center z-10 w-full sm:w-auto shrink-0">
            <p className="text-[10px] font-bold text-[#ffe08e] tracking-widest uppercase">Referral Code</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-white tracking-widest">{user.referralCode}</span>
              <button
                onClick={handleCopyReferral}
                className="p-1 text-[#fed255] hover:text-white"
                aria-label="Copy referral code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* At a glance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gold-gradient rounded-xl p-5 text-[#0d1648] shadow-lg flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#755b00]">WALLET BALANCE</p>
            <p className="font-serif text-2xl font-bold mt-0.5 break-words">{formatCurrency(walletBalance)}</p>
          </div>
          <button
            onClick={() => onNavigate('/profile/wallet')}
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#755b00] hover:underline"
          >
            View
          </button>
        </div>

        <button
          onClick={() => onNavigate('/orders')}
          className="bg-white rounded-xl p-5 border border-[#c6c5d0]/30 shadow-sm text-left hover:border-[#755b00]/40 transition-colors"
        >
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#767680]">ORDERS PLACED</p>
          <p className="font-serif text-2xl font-bold text-[#0d1648] mt-0.5">{orders.length}</p>
        </button>

        <button
          onClick={() => onNavigate('/wishlist')}
          className="bg-white rounded-xl p-5 border border-[#c6c5d0]/30 shadow-sm text-left hover:border-[#755b00]/40 transition-colors"
        >
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#767680]">SAVED PIECES</p>
          <p className="font-serif text-2xl font-bold text-[#0d1648] mt-0.5">{wishlist.length}</p>
        </button>
      </div>

      {/* Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MENU.map(item => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className="card card-hover p-5 flex flex-col justify-between h-40 bg-white text-left"
          >
            <div className="flex items-center justify-between">
              <span className="p-2.5 rounded-lg bg-[#f4f2ff]">
                <item.icon className="w-5 h-5 text-[#755b00]" />
              </span>
              <ChevronRight className="w-4 h-4 text-[#c6c5d0]" />
            </div>

            <div>
              <h3 className="font-serif text-base font-bold text-[#0d1648]">{item.title}</h3>
              <p className="text-[11px] text-[#767680] font-sans mt-0.5 line-clamp-2">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={logout}
          className="btn-outline border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white text-xs px-8 py-3 inline-flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
