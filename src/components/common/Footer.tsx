import React, { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { contactApi } from '../../lib/api';
import { errorMessage } from '../../lib/apiClient';
import { DristiLogo } from './DristiLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  /** Real subscription — the address is stored by the backend for the seller. */
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const ack = await contactApi.subscribe(email.trim());
      showToast('Subscribed', ack.message || 'You are on the list. Welcome!', 'success');
      setEmail('');
    } catch (err) {
      showToast('Could Not Subscribe', errorMessage(err), 'error');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#0d1648] text-[#f4f2ff] pt-12 sm:pt-16 pb-12 border-t border-[#fed255]/20">
      {/* Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="bg-[#181a2d] border border-[#fed255]/30 rounded-xl p-6 sm:p-8 lg:p-12 text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#fed255]/10 rounded-full blur-2xl pointer-events-none" />

          <p className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#fed255] uppercase mb-2">
            STAY IN THE LOOP
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-3">Subscribe to Dristi Fashions</h3>
          <p className="text-xs text-[#c6c5d0] max-w-xl mx-auto mb-6 leading-relaxed font-sans">
            Be the first to hear about new arrivals and collection launches. Unsubscribe any time.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <input
                type="email"
                placeholder="Enter your email address…"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                aria-label="Email address"
                className="w-full bg-[#0d1648] border border-[#767680] rounded-md px-4 py-3 pr-10 text-xs text-white placeholder-[#767680] focus:outline-none focus:border-[#fed255] focus:ring-1 focus:ring-[#fed255]"
              />
              <Mail className="w-4 h-4 text-[#767680] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={subscribing}
              className="btn-primary text-xs px-6 py-3 shrink-0 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {subscribing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{subscribing ? 'Subscribing…' : 'Subscribe'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Two columns from `sm` — a single stacked column made the link list
            unusably long on a phone, and the four groups fit two-up easily. */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-8 sm:gap-10 pb-12 border-b border-[#767680]/30 text-xs">
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <button onClick={() => onNavigate('/')} className="flex min-w-0 max-w-full flex-col items-start text-left">
              {/* `md` rather than `lg`: at `lg` the wordmark is ~280px wide,
                  which is the entire content width of a 320px screen. */}
              <DristiLogo size="md" variant="horizontal" />
            </button>
            <p className="text-[#c6c5d0] text-xs leading-relaxed max-w-sm">
              Dristi Fashions brings timeless elegance, ethnic heritage, and modern silhouettes tailored to reflect
              your unique personality.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-serif text-sm font-semibold text-[#fed255]">Shop</p>
            <ul className="space-y-2 text-[#c6c5d0]">
              <li>
                <button onClick={() => onNavigate('/categories')} className="hover:text-white transition-colors">
                  All Collections
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/search?sort=newest')} className="hover:text-white transition-colors">
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/search?featured=true')}
                  className="hover:text-white transition-colors"
                >
                  Featured Pieces
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/blog')} className="hover:text-white transition-colors">
                  The Journal
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-serif text-sm font-semibold text-[#fed255]">Customer Care</p>
            <ul className="space-y-2 text-[#c6c5d0]">
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/orders')} className="hover:text-white transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/orders')} className="hover:text-white transition-colors">
                  Returns & Replacements
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/profile/addresses')}
                  className="hover:text-white transition-colors"
                >
                  Delivery Addresses
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="font-serif text-sm font-semibold text-[#fed255]">Account</p>
            <ul className="space-y-2 text-[#c6c5d0]">
              <li>
                <button onClick={() => onNavigate('/profile')} className="hover:text-white transition-colors">
                  My Account
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/wishlist')} className="hover:text-white transition-colors">
                  My Wishlist
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/profile/wallet')} className="hover:text-white transition-colors">
                  Dristi Wallet
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/profile/referral')} className="hover:text-white transition-colors">
                  Refer & Earn
                </button>
              </li>
            </ul>
          </div>
        </div>



        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#767680]">
          <p>© {new Date().getFullYear()} Dristi Fashions. Fashion That Reflects Your Personality.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('/profile/about')} className="hover:text-white">
              About Us
            </button>
            <button onClick={() => onNavigate('/contact')} className="hover:text-white">
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
