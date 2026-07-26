import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Heart, Menu, Search, ShoppingBag, Truck, User as UserIcon, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { catalogApi } from '../../lib/api';
import { formatCurrency, initials } from '../../lib/format';
import { mapCategory } from '../../lib/mappers';
import { useAsync } from '../../lib/useAsync';
import { DristhiLogo } from './DristhiLogo';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

/** How many categories fit in the desktop nav bar before it gets crowded. */
const NAV_CATEGORY_LIMIT = 6;

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const { user, cartCount, wishlist, walletBalance, logout, deliverySettings } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const categoriesState = useAsync(() => catalogApi.listCategories(), []);
  const categories = useMemo(
    () => (categoriesState.data ?? []).map(mapCategory).slice(0, NAV_CATEGORY_LIMIT),
    [categoriesState.data],
  );

  // Close the transient menus whenever navigation happens.
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [currentPath]);

  /**
   * Publishes the header's real height as `--header-height`.
   *
   * It is not a constant: the promo bar, the category row and the mobile search
   * field each appear conditionally and at different breakpoints. Anything that
   * pins itself below the header (the sticky cart and checkout summaries) reads
   * this variable, so it can never end up underneath.
   */
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const publish = () => {
      document.documentElement.style.setProperty('--header-height', `${node.offsetHeight}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);
    window.addEventListener('orientationchange', publish);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', publish);
    };
    // The observer already covers every reason the height can change (promo bar
    // appearing, categories loading, breakpoint switches), so this runs once.
  }, []);

  /**
   * Dismisses the account dropdown on an outside tap or Escape.
   *
   * Hovering off it is not something a touch device can do, so without this the
   * menu stays open over the page until the customer navigates away.
   */
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserDropdownOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  /**
   * Freezes the page behind the mobile drawer. Without it the body keeps
   * scrolling under the overlay, so closing the drawer leaves the customer
   * somewhere they never meant to be.
   */
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Only announce a delivery policy when there is an actual charge to explain.
  // With no fee configured the bar stays hidden rather than promising free
  // delivery on the store's behalf.
  const promoMessage =
    !deliverySettings || deliverySettings.fee <= 0
      ? null
      : deliverySettings.freeThreshold !== null
        ? `Complimentary delivery on orders above ${formatCurrency(deliverySettings.freeThreshold)}`
        : `Flat ${formatCurrency(deliverySettings.fee)} delivery, anywhere in India`;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-[#0d1648]/95 text-white backdrop-blur-md border-b border-[#fed255]/30 transition-all shadow-md"
    >
      {promoMessage && (
        <div className="bg-[#080d2d] text-[#ffe08e] text-[10px] sm:text-[11px] font-semibold tracking-wider py-1.5 px-3 sm:px-4 text-center flex items-center justify-center gap-2 uppercase border-b border-[#fed255]/20">
          <Truck className="w-3.5 h-3.5 text-[#fed255] shrink-0" />
          <span className="min-w-0">{promoMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2 sm:gap-4">
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="p-2 -ml-2 text-[#ffe08e] hover:text-white transition-colors"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/*
            Below `sm` only the emblem is shown. The full lockup is wider than
            the space left between the menu button and the basket icons on a
            360px screen, so keeping it there pushed the wordmark straight into
            the action buttons.
          */}
          <div className="flex min-w-0 flex-1 justify-start lg:flex-none lg:justify-start">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex min-w-0 max-w-full items-center focus:outline-none"
              aria-label="Dristhi Fashions home"
            >
              {/* The show/hide lives on these wrappers rather than on the logo
                  itself — the component already sets its own `display`, and two
                  competing display utilities on one element resolve by
                  stylesheet order rather than by intent. */}
              <span className="block sm:hidden">
                <DristhiLogo size="sm" variant="emblem-only" />
              </span>
              <span className="hidden sm:block">
                <DristhiLogo size="md" variant="horizontal" compactOnMobile />
              </span>
            </button>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="search"
                placeholder="Search sarees, kurtas, footwear…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search products"
                className="w-full bg-[#181a2d] border border-[#fed255]/40 rounded-full py-2 pl-10 pr-10 text-xs text-white placeholder-[#a0a0c0] focus:outline-none focus:border-[#fed255] focus:ring-1 focus:ring-[#fed255] transition-all"
              />
              <Search className="w-4 h-4 text-[#ffe08e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-3">
            <button
              onClick={() => onNavigate('/wishlist')}
              className="p-2 sm:p-2.5 text-[#ffe08e] hover:text-white relative transition-colors rounded-full hover:bg-white/10"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-[#ff4d4d] text-[#ff4d4d]' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#ff4d4d] text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('/cart')}
              className="p-2 sm:p-2.5 text-[#ffe08e] hover:text-white relative transition-colors rounded-full hover:bg-white/10"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-[#fed255] text-[#0d1648] text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="relative" ref={userMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setUserDropdownOpen(v => !v)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors border border-transparent hover:border-[#fed255]/40"
                    aria-label="Account menu"
                    aria-expanded={userDropdownOpen}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-[#fed255]"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-[#fed255] text-[#0d1648] flex items-center justify-center font-bold text-xs">
                        {initials(user.fullName)}
                      </span>
                    )}
                  </button>

                  {userDropdownOpen && (
                    // `max-w-[calc(100vw-1.5rem)]` keeps the panel inside the
                    // viewport on a narrow phone, where a fixed 14rem anchored
                    // to the right edge would otherwise hang off the screen.
                    <div
                      className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-[#181a2d] text-white rounded-lg shadow-2xl border border-[#fed255]/40 py-2 z-50"
                      role="menu"
                    >
                      <div className="px-4 py-2 border-b border-[#fed255]/20">
                        <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                        <p className="text-[11px] text-[#c6c5d0] truncate">{user.email}</p>
                      </div>

                      {[
                        { label: 'My Account', path: '/profile' },
                        { label: 'My Orders', path: '/orders' },
                        { label: 'My Wishlist', path: '/wishlist' },
                      ].map(item => (
                        <button
                          key={item.path}
                          onClick={() => onNavigate(item.path)}
                          className="w-full text-left px-4 py-2 text-xs text-[#e0e0fb] hover:bg-[#fed255]/10 flex items-center justify-between"
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#ffe08e]" />
                        </button>
                      ))}

                      <button
                        onClick={() => onNavigate('/profile/wallet')}
                        className="w-full text-left px-4 py-2 text-xs text-[#e0e0fb] hover:bg-[#fed255]/10 flex items-center justify-between"
                      >
                        <span>Dristhi Wallet</span>
                        <span className="text-[10px] font-bold text-[#fed255]">{formatCurrency(walletBalance)}</span>
                      </button>

                      <div className="border-t border-[#fed255]/20 my-1" />

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-[#ff6b6b] hover:bg-red-500/10 font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => onNavigate('/login')}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#fed255] hover:text-white border border-[#fed255]/50 px-3.5 py-1.5 rounded-full hover:border-[#fed255] transition-all"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category nav — the seller's real categories. Wraps rather than
            overflowing: the names are seller-supplied, so six long ones can
            exceed the bar at exactly 1024px. */}
        {categories.length > 0 && (
          <div className="hidden lg:flex flex-wrap items-center justify-center gap-x-6 xl:gap-x-8 gap-y-1 py-2.5 border-t border-[#fed255]/20 text-xs font-sans text-[#e0e0fb]">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onNavigate(`/search?category=${cat.id}`)}
                className="hover:text-[#fed255] transition-colors py-1 whitespace-nowrap"
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={() => onNavigate('/blog')}
              className="text-[#fed255] font-semibold hover:underline whitespace-nowrap"
            >
              The Journal
            </button>
          </div>
        )}
      </div>

      {/* Mobile search */}
      <div className="px-3 py-2.5 bg-[#080d2d] border-t border-[#fed255]/20 lg:hidden">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="search"
            placeholder="Search Dristhi Fashions…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search products"
            className="w-full bg-[#181a2d] border border-[#fed255]/30 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-[#a0a0c0] focus:outline-none focus:border-[#fed255]"
          />
          <Search className="w-3.5 h-3.5 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex">
          {/* `max-w-[20rem]` rather than `max-w-sm` so the dismiss area beside
              the drawer stays tappable even on a 320px screen. */}
          <div className="w-[85%] max-w-[20rem] bg-[#0d1648] text-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain border-r border-[#fed255]/30">
            <div>
              <div className="p-4 sm:p-6 bg-[#080d2d] border-b border-[#fed255]/30 flex items-center justify-between gap-3">
                <DristhiLogo size="sm" variant="horizontal" compactOnMobile className="min-w-0" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 shrink-0 text-[#ffe08e] hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {user ? (
                <div className="p-4 bg-[#181a2d] border-b border-[#fed255]/20 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-[#fed255] text-[#0d1648] font-bold flex items-center justify-center shrink-0">
                    {initials(user.fullName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                    <p className="text-[10px] text-[#c6c5d0] truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#181a2d] border-b border-[#fed255]/20 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-white">Welcome to Dristhi Fashions</p>
                  <button onClick={() => onNavigate('/login')} className="btn-primary text-[10px] px-3 py-1.5 shrink-0">
                    Sign In
                  </button>
                </div>
              )}

              <div className="p-4 space-y-1">
                {categories.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-[#ffe08e] uppercase tracking-wider px-3 mb-2">
                      Shop Categories
                    </p>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => onNavigate(`/search?category=${cat.id}`)}
                        className="w-full text-left px-3 py-2.5 text-xs font-medium text-[#e0e0fb] hover:bg-[#181a2d] hover:text-[#fed255] rounded flex items-center justify-between"
                      >
                        <span>{cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#ffe08e]" />
                      </button>
                    ))}
                    <div className="my-3 border-t border-[#fed255]/20" />
                  </>
                )}

                <p className="text-[10px] font-bold text-[#ffe08e] uppercase tracking-wider px-3 mb-2">
                  Quick Navigation
                </p>
                {[
                  { label: 'All Collections', path: '/categories' },
                  { label: 'My Orders', path: '/orders' },
                  { label: `My Wishlist (${wishlist.length})`, path: '/wishlist' },
                  { label: `Dristhi Wallet (${formatCurrency(walletBalance)})`, path: '/profile/wallet' },
                  { label: 'The Journal', path: '/blog' },
                  { label: 'Contact Us', path: '/contact' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => onNavigate(item.path)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[#e0e0fb] hover:bg-[#181a2d] hover:text-[#fed255] rounded"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="p-4 border-t border-[#fed255]/20">
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 text-xs font-semibold text-[#ff6b6b] hover:bg-red-500/10 rounded"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
          <button
            className="flex-1"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
        </div>
      )}
    </header>
  );
};
