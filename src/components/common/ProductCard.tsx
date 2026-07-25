import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/format';
import { PLACEHOLDER_IMAGE } from '../../lib/mappers';
import { Heart, Loader2, ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onNavigate: (path: string) => void;
}

/** Below this many units left we nudge the customer rather than stay silent. */
const LOW_STOCK_THRESHOLD = 5;

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { isInWishlist, toggleWishlist, addToCart } = useStore();
  const [adding, setAdding] = useState(false);
  const wishlisted = isInWishlist(product.id);

  const needsChoice = product.sizes.length > 1 || product.colors.length > 1;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // With more than one size or colour there is no safe default to pick on the
    // customer's behalf — send them to the product page to choose.
    if (needsChoice) {
      onNavigate(`/product/${product.id}`);
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, { size: product.sizes[0] ?? null, color: product.colors[0] ?? null, quantity: 1 });
    } finally {
      setAdding(false);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onNavigate(`/product/${product.id}`)}
      className="card card-hover group cursor-pointer flex flex-col h-full bg-white relative"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4f2ff]">
        <img
          src={product.images[0] || PLACEHOLDER_IMAGE}
          alt={product.title}
          onError={e => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />

        {/* Badges — width-capped so a stacked badge can never slide under the
            wishlist button in the opposite corner on a two-up mobile grid. */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col items-start gap-1.5 z-10 max-w-[calc(100%-3.25rem)]">
          {product.isNew && <span className="badge-new shadow-sm">NEW ARRIVAL</span>}
          {product.isFeatured && <span className="badge-limited shadow-sm">FEATURED</span>}
          {product.discountPercentage > 0 && (
            <span className="bg-[#755b00] text-[#ffe08e] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              {product.discountPercentage}% OFF
            </span>
          )}
          {product.inStock && product.stock <= LOW_STOCK_THRESHOLD && (
            <span className="bg-[#ba1a1a] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
              ONLY {product.stock} LEFT
            </span>
          )}
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-[#0d1648]/55 flex items-center justify-center z-10">
            <span className="bg-white/95 text-[#0d1648] text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded">
              Sold Out
            </span>
          </div>
        )}

        <button
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#181a2d] hover:bg-white hover:text-[#ba1a1a] shadow-md transition-all"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#ba1a1a] text-[#ba1a1a]' : ''}`} />
        </button>

        {/* `hover-reveal` keeps the reveal-on-hover behaviour for a mouse but
            pins the bar open on a touch screen — otherwise quick-add is simply
            unreachable on a phone, which is where most of these taps happen. */}
        {product.inStock && (
          <div className="hover-reveal absolute bottom-0 inset-x-0 p-2 sm:p-3 bg-gradient-to-t from-[#0d1648]/90 via-[#0d1648]/60 to-transparent flex items-center justify-center z-20">
            <button
              onClick={handleQuickAdd}
              disabled={adding}
              className="btn-primary w-full py-2.5 px-2 text-[10px] sm:text-[11px] tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg disabled:opacity-70"
            >
              {adding ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate">{needsChoice ? 'SELECT OPTIONS' : 'QUICK ADD TO BAG'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#755b00] uppercase tracking-widest font-sans truncate">
            {product.brand}
          </p>

          <h3 className="font-serif text-sm font-semibold text-[#0d1648] line-clamp-2 mt-1 group-hover:text-[#755b00] transition-colors leading-snug">
            {product.title}
          </h3>

          {/* Ratings only appear once a piece has actually been reviewed. */}
          {product.reviewCount > 0 ? (
            <div className="flex items-center gap-1.5 mt-2">
              <Star className="w-3.5 h-3.5 fill-[#fed255] text-[#fed255]" />
              <span className="text-xs font-bold text-[#181a2d] font-sans">{product.rating.toFixed(1)}</span>
              <span className="text-[10px] text-[#767680] font-sans">({product.reviewCount})</span>
            </div>
          ) : (
            <p className="text-[10px] text-[#767680] font-sans mt-2 truncate">{product.category}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-[#c6c5d0]/30 flex items-baseline gap-2">
          <span className="font-serif font-bold text-base text-[#0d1648]">{formatCurrency(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-[#767680] line-through font-sans">{formatCurrency(product.mrp)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
