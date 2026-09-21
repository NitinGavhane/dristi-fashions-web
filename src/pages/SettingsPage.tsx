import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Mail, PauseCircle, Phone, Save, Trash2, User } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, authLoading, isAuthenticated, updateProfile } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // The profile arrives asynchronously, so seed the form once it does.
  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
  }, [user]);

  const dirty =
    Boolean(user) && (fullName !== user!.fullName || email !== user!.email || phone !== user!.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    await updateProfile({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim() });
    setSaving(false);
  };

  if (authLoading) return <Spinner label="Loading your settings…" className="min-h-[50vh]" />;

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <EmptyState
          title="Account Settings"
          message="Sign in to update your profile details."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/profile/settings')}
        />
      </div>
    );
  }

  const inputClass =
    'w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-2.5 pl-9 text-sm text-[#181a2d] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]';
  const labelClass = 'block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-1.5';

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#c6c5d0]/30 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0d1648]">Account Settings</h1>
          <p className="text-xs text-[#767680] font-sans mt-1">Update your name and contact details.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="settings-name">
              Full Name
            </label>
            <div className="relative">
              <input
                id="settings-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={inputClass}
                required
              />
              <User className="w-4 h-4 text-[#767680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="settings-email">
              Email Address
            </label>
            <div className="relative">
              <input
                id="settings-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                required
              />
              <Mail className="w-4 h-4 text-[#767680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="settings-phone">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="settings-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputClass}
              />
              <Phone className="w-4 h-4 text-[#767680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'SAVING…' : dirty ? 'SAVE CHANGES' : 'NO CHANGES TO SAVE'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Kept in its own card, below the form, so neither route is ever a
          mis-click away from saving a name. Deactivate is listed first: it is
          what most people who get this far actually want. */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#ba1a1a]/20 space-y-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#0d1648]">Account Control</h2>
          <p className="text-xs text-[#767680] font-sans mt-1">
            Take a break, or close your account for good.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/profile/deactivate')}
          className="w-full flex items-center gap-3 rounded-xl border border-[#c6c5d0]/60 p-4 text-left hover:border-[#755b00]/40 transition-colors"
        >
          <span className="p-2 rounded-lg bg-[#f4f2ff] shrink-0">
            <PauseCircle className="w-4 h-4 text-[#755b00]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#0d1648] font-sans">Deactivate Account</span>
            <span className="block text-[11px] text-[#767680] font-sans mt-0.5">
              Nothing is deleted — sign in again to restore everything
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#c6c5d0] shrink-0" />
        </button>

        <button
          onClick={() => onNavigate('/profile/delete')}
          className="w-full flex items-center gap-3 rounded-xl border border-[#ba1a1a]/30 p-4 text-left hover:border-[#ba1a1a]/60 transition-colors"
        >
          <span className="p-2 rounded-lg bg-[#ffdad6] shrink-0">
            <Trash2 className="w-4 h-4 text-[#ba1a1a]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#ba1a1a] font-sans">Delete Account</span>
            <span className="block text-[11px] text-[#767680] font-sans mt-0.5">
              Permanently delete your account and data — this cannot be undone
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-[#c6c5d0] shrink-0" />
        </button>
      </div>
    </div>
  );
};
