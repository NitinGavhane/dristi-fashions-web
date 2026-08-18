import React from 'react';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../lib/format';
import { PLACEHOLDER_IMAGE } from '../lib/mappers';

interface WishlistPageProps {
  onNavigate: (path: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, authLoading, wishlist, toggleWishlist } = useStore();

  if (authLoading) return <Spinner label="Loading your wishlist…" className="min-h-[50vh]" />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <button
          onClick={() => onNavigate('/profile')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="My Wishlist"
          message="Sign in to see the pieces you have saved across your devices."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/wishlist')}
        />
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <button
          onClick={() => onNavigate('/profile')}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <EmptyState
          icon={<Heart className="w-12 h-12" />}
          title="Your wishlist is empty"
          message="Tap the heart on any piece to save it here for later."
          actionLabel="Browse the Catalogue"
          onAction={() => onNavigate('/search')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => onNavigate('/profile')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="border-b border-[#c6c5d0]/30 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">
          My Wishlist <span className="text-[#755b00]">({wishlist.length})</span>
        </h1>
        <p className="text-xs text-[#767680] font-sans mt-1">The pieces you have saved for later.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {wishlist.map(item => (
          <div key={item.id} className="card card-hover bg-white flex flex-col h-full group relative">
            <button
              onClick={() => onNavigate(`/product/${item.productId}`)}
              className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4f2ff]"
              aria-label={`View ${item.title}`}
            >
              <img
                src={item.image || PLACEHOLDER_IMAGE}
                alt={item.title}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            </button>

            {/* The wishlist endpoint returns no variant data, so removal is the
                only action here — choosing a size happens on the product page. */}
            <button
              onClick={() => void toggleWishlist({ id: item.productId, title: item.title })}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/85 backdrop-blur-md text-[#ba1a1a] hover:bg-white shadow-md transition-all"
              aria-label={`Remove ${item.title} from wishlist`}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="p-4 flex flex-col flex-1 justify-between">
              <button
                onClick={() => onNavigate(`/product/${item.productId}`)}
                className="font-serif text-sm font-semibold text-[#0d1648] hover:text-[#755b00] text-left line-clamp-2 leading-snug"
              >
                {item.title}
              </button>

              <div className="mt-3 pt-3 border-t border-[#c6c5d0]/30 flex items-center justify-between gap-2">
                <span className="font-serif font-bold text-base text-[#0d1648]">{formatCurrency(item.price)}</span>
                <button
                  onClick={() => onNavigate(`/product/${item.productId}`)}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#755b00] hover:underline"
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
