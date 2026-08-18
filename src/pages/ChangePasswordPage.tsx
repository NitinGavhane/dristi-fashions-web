import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface ChangePasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({ onNavigate }) => {
  const { changePassword, showToast } = useStore();

  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // The leading lock/key icons are a hint for an empty field — they disappear
  // while the user is typing so they never overlap the entered text.
  const [oldFocused, setOldFocused] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const showOldIcon = !oldFocused && !oldPass;
  const showNewIcon = !newFocused && !newPass;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      showToast('Password Too Short', 'New password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('Passwords Do Not Match', 'New password and confirmation must match.', 'error');
      return;
    }

    const ok = await changePassword(oldPass, newPass);
    if (ok) {
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      onNavigate('/profile');
    }
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#c6c5d0]/30 space-y-6">
        <div className="border-b border-[#c6c5d0]/30 pb-4">
          <h1 className="font-serif text-2xl font-bold text-[#0d1648]">Security Credentials</h1>
          <p className="text-xs text-[#767680] font-sans mt-1">Choose a new password for your Dristi Fashions account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-bold text-[#0d1648] uppercase tracking-wider block mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                onFocus={() => setOldFocused(true)}
                onBlur={() => setOldFocused(false)}
                className={`input-field w-full pr-10 ${showOldIcon ? 'pl-9' : ''}`}
                required
              />
              {showOldIcon && (
                <Lock className="w-4 h-4 text-[#767680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767680]"
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#0d1648] uppercase tracking-wider block mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                onFocus={() => setNewFocused(true)}
                onBlur={() => setNewFocused(false)}
                className={`input-field w-full pr-10 ${showNewIcon ? 'pl-9' : ''}`}
                required
              />
              {showNewIcon && (
                <KeyRound className="w-4 h-4 text-[#767680] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767680]"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="font-bold text-[#0d1648] uppercase tracking-wider block mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest shadow-lg"
            >
              UPDATE PASSWORD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
