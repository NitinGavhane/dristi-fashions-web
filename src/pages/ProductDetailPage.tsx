import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { ErrorState, ProductGridSkeleton, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { catalogApi, referralApi, reviewApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';
import { formatCurrency, formatDate } from '../lib/format';
import { PLACEHOLDER_IMAGE, mapProduct, mapReview } from '../lib/mappers';
import { CGST_PERCENTAGE, IGST_PERCENTAGE, SGST_PERCENTAGE } from '../lib/pricing';
import { useAsync } from '../lib/useAsync';
import type { Review } from '../types';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productId, onNavigate }) => {
  const { addToCart, isInWishlist, toggleWishlist, showToast, user, isAuthenticated } = useStore();

  const productState = useAsync(() => catalogApi.getProduct(productId), [productId]);
  const product = useMemo(() => (productState.data ? mapProduct(productState.data) : null), [productState.data]);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Reviews are their own endpoint, so they load independently of the product.
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
    setActiveTab('details');
  }, [productId]);

  // Preselect the only option when there is just one, so a single-size piece
  // does not force a pointless click before it can go in the bag.
  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes.length === 1 ? product.sizes[0] : null);
    setSelectedColor(product.colors.length === 1 ? product.colors[0] : null);
  }, [product]);

  useEffect(() => {
    let cancelled = false;
    setReviewsLoading(true);
    reviewApi
      .list(productId)
      .then(data => {
        if (!cancelled) setReviews(data.map(mapReview));
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const related = useAsync(
    () =>
      productState.data
        ? catalogApi.listProducts({ category: productState.data.categoryId })
        : Promise.resolve([]),
    [productState.data?.categoryId],
  );

  const relatedProducts = useMemo(
    () => (related.data ?? []).map(mapProduct).filter(p => p.id !== productId).slice(0, 4),
    [related.data, productId],
  );

  /** The variant implied by the current selection, if the product has variants. */
  const activeVariant = useMemo(() => {
    if (!product?.variants.length) return null;
    return (
      product.variants.find(
        v => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor),
      ) ?? null
    );
  }, [product, selectedSize, selectedColor]);

  // Variant stock is authoritative once one is picked; otherwise fall back to
  // the product-level total.
  const availableStock = activeVariant?.stock ?? product?.stock ?? 0;
  const unitPrice = activeVariant?.price ?? product?.price ?? 0;

  const needsSize = Boolean(product && product.sizes.length > 1 && !selectedSize);
  const needsColor = Boolean(product && product.colors.length > 1 && !selectedColor);

  const averageRating = useMemo(
    () => (reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0),
    [reviews],
  );

  const handleAddToCart = async () => {
    if (!product) return;
    if (needsSize) {
      showToast('Select a Size', 'Please choose a size before adding to your bag.', 'info');
      return;
    }
    if (needsColor) {
      showToast('Select a Colour', 'Please choose a colour before adding to your bag.', 'info');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product, { size: selectedSize, color: selectedColor, quantity });
    } finally {
      setAdding(false);
    }
  };

  /**
   * Shares the piece. A signed-in customer with a referral code gets the
   * server-built referral link, so any purchase through it is credited to them.
   */
  const handleShare = async () => {
    if (!product) return;
    let url = window.location.href;
    if (user?.referralCode) {
      try {
        const result = await referralApi.shareLink(product.id, user.referralCode);
        if (result.shareUrl) url = result.shareUrl;
      } catch {
        // Fall back to the plain product URL — a share is better than an error.
      }
    }

    const shareData = { title: product.title, text: `${product.title} at Dristhi Fashions`, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // The user dismissed the sheet, or the browser refused; copy instead.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(
        'Link Copied',
        user?.referralCode ? 'Your referral link is on the clipboard.' : 'Product link copied to clipboard.',
        'info',
      );
    } catch {
      showToast('Could Not Share', 'Copy the address from your browser bar instead.', 'error');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Sign In Required', 'Please sign in to review this piece.', 'info');
      onNavigate('/login');
      return;
    }
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const created = mapReview(await reviewApi.create(productId, reviewRating, reviewComment.trim()));
      setReviews(prev => [created, ...prev]);
      setReviewComment('');
      setReviewRating(5);
      showToast('Review Submitted', 'Thank you for sharing your thoughts.', 'success');
    } catch (err) {
      showToast('Could Not Submit Review', errorMessage(err), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (productState.loading) {
    return <Spinner label="Loading this creation…" className="min-h-[60vh]" />;
  }

  if (productState.error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Creation unavailable"
          message={productState.error ?? 'We could not find this piece. It may have been removed from the catalogue.'}
          onRetry={productState.reload}
        />
        <div className="text-center mt-6">
          <button onClick={() => onNavigate('/search')} className="btn-outline text-xs px-6 py-2.5">
            Browse the Catalogue
          </button>
        </div>
      </div>
    );
  }

  const wishlisted = isInWishlist(product.id);
  const outOfStock = availableStock <= 0;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb — category and product names are both seller-supplied and
          unbounded, so the trail wraps and each crumb truncates rather than
          running off the side of the page. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#767680] mb-6 font-sans">
        <button onClick={() => onNavigate('/')} className="shrink-0 hover:text-[#0d1648]">
          Home
        </button>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <button
          onClick={() => onNavigate(`/search?category=${product.categoryId}`)}
          className="max-w-[10rem] truncate hover:text-[#0d1648]"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-[#0d1648] font-semibold truncate max-w-[12rem] sm:max-w-xs">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 bg-white rounded-2xl p-4 sm:p-10 shadow-lg border border-[#c6c5d0]/30 mb-12">
        {/* Gallery */}
        <div className="lg:col-span-7 min-w-0 flex flex-col-reverse sm:flex-row gap-4">
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-3 scroll-rail sm:overflow-visible no-scrollbar shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === idx
                      ? 'border-[#755b00] ring-2 ring-[#fed255]'
                      : 'border-[#c6c5d0]/40 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="relative flex-1 aspect-[3/4] rounded-xl overflow-hidden bg-[#f4f2ff] shadow-inner">
            <img
              src={product.images[selectedImage] || product.images[0] || PLACEHOLDER_IMAGE}
              alt={product.title}
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
              }}
              className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
            />
            {product.discountPercentage > 0 && (
              <span className="absolute top-4 left-4 bg-[#755b00] text-[#ffe08e] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded shadow">
                {product.discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-5 min-w-0 flex flex-col">
          <p className="text-[11px] font-bold text-[#755b00] uppercase tracking-[0.2em] font-sans">{product.brand}</p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648] mt-1 leading-tight">
            {product.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
            {reviews.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 bg-[#f4f2ff] px-2.5 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-[#fed255] text-[#fed255]" />
                <span className="text-xs font-bold text-[#181a2d]">{averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-[#767680]">
                  ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </span>
            ) : (
              <span className="text-[11px] text-[#767680] font-sans">No reviews yet</span>
            )}
            <span className="text-[11px] text-[#767680] font-sans break-all">SKU: {product.sku || '—'}</span>
          </div>

          {/* Price */}
          <div className="mt-5 pb-5 border-b border-[#c6c5d0]/40">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-[#0d1648]">{formatCurrency(unitPrice)}</span>
              {product.mrp > unitPrice && (
                <>
                  <span className="text-sm text-[#767680] line-through font-sans">{formatCurrency(product.mrp)}</span>
                  <span className="text-xs font-bold text-[#2e7d32] font-sans">
                    Save {formatCurrency(product.mrp - unitPrice)}
                  </span>
                </>
              )}
            </div>
            {/* GST is added on top at checkout, so saying so here avoids a
                surprise on the payment screen. */}
            <p className="text-[11px] text-[#767680] font-sans mt-1.5">
              Exclusive of GST — {CGST_PERCENTAGE}% CGST + {SGST_PERCENTAGE}% SGST within West Bengal,{' '}
              {IGST_PERCENTAGE}% IGST elsewhere. Added at checkout.
            </p>
          </div>

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0d1648] uppercase tracking-wider font-sans">Select Size</span>
                {needsSize && <span className="text-[11px] text-[#ba1a1a] font-sans">Required</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => {
                  const variantForSize = product.variants.find(v => v.size === size);
                  const disabled = Boolean(variantForSize && variantForSize.stock <= 0);
                  return (
                    <button
                      key={size}
                      disabled={disabled}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[3rem] px-3.5 py-2 rounded-md border text-xs font-semibold font-sans transition-all ${
                        selectedSize === size
                          ? 'bg-[#0d1648] text-[#fed255] border-[#0d1648]'
                          : disabled
                            ? 'border-[#c6c5d0]/50 text-[#c6c5d0] line-through cursor-not-allowed'
                            : 'border-[#c6c5d0] text-[#0d1648] hover:border-[#755b00]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Colours */}
          {product.colors.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0d1648] uppercase tracking-wider font-sans">
                  Select Colour
                </span>
                {needsColor && <span className="text-[11px] text-[#ba1a1a] font-sans">Required</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3.5 py-2 rounded-md border text-xs font-semibold font-sans capitalize transition-all ${
                      selectedColor === color
                        ? 'bg-[#0d1648] text-[#fed255] border-[#0d1648]'
                        : 'border-[#c6c5d0] text-[#0d1648] hover:border-[#755b00]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + stock */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center border border-[#c6c5d0] rounded-md overflow-hidden">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-2.5 text-[#0d1648] hover:bg-[#f4f2ff] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-[#0d1648] font-sans">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(availableStock || 1, q + 1))}
                disabled={quantity >= availableStock}
                className="p-2.5 text-[#0d1648] hover:bg-[#f4f2ff] disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {outOfStock ? (
              <span className="text-xs font-bold text-[#ba1a1a] font-sans">Out of stock</span>
            ) : availableStock <= 5 ? (
              <span className="text-xs font-bold text-[#ba1a1a] font-sans">Only {availableStock} left</span>
            ) : (
              <span className="text-xs font-semibold text-[#2e7d32] font-sans">In stock</span>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              className="btn-primary flex-1 py-3.5 text-xs tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{outOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}</span>
            </button>

            <button
              onClick={() => void toggleWishlist(product)}
              className="btn-outline px-5 py-3.5 inline-flex items-center justify-center gap-2 text-xs"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-[#ba1a1a] text-[#ba1a1a]' : ''}`} />
              <span className="sm:hidden">{wishlisted ? 'Saved' : 'Wishlist'}</span>
            </button>

            <button
              onClick={handleShare}
              className="btn-outline px-5 py-3.5 inline-flex items-center justify-center gap-2 text-xs"
              aria-label="Share this piece"
            >
              <Share2 className="w-4 h-4" />
              <span className="sm:hidden">Share</span>
            </button>
          </div>

          {/* Policies — driven by the flags on this specific product. */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-sans">
            <div className="flex items-center gap-2 text-[#46464f]">
              <ShieldCheck className="w-4 h-4 text-[#755b00] shrink-0" />
              <span>Secure Razorpay checkout</span>
            </div>
            <div className="flex items-center gap-2 text-[#46464f]">
              <Truck className="w-4 h-4 text-[#755b00] shrink-0" />
              <span>Tracked delivery</span>
            </div>
            <div className="flex items-center gap-2 text-[#46464f]">
              <RotateCcw className="w-4 h-4 text-[#755b00] shrink-0" />
              <span>
                {product.isReturnable
                  ? 'Returnable once delivered'
                  : product.isReplaceable
                    ? 'Replacement only'
                    : 'Not returnable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#c6c5d0]/30 mb-12 overflow-hidden">
        <div className="flex border-b border-[#c6c5d0]/40">
          {(['details', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 sm:px-8 py-4 text-xs font-bold uppercase tracking-wider font-sans transition-colors ${
                activeTab === tab
                  ? 'text-[#0d1648] border-b-2 border-[#fed255] bg-[#f4f2ff]/50'
                  : 'text-[#767680] hover:text-[#0d1648]'
              }`}
            >
              {tab === 'details' ? 'Description' : `Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'details' ? (
            <div className="space-y-5">
              <p className="text-sm text-[#46464f] font-sans leading-relaxed whitespace-pre-line">
                {product.description || 'No description has been provided for this piece yet.'}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs font-sans pt-5 border-t border-[#c6c5d0]/30">
                {[
                  ['Brand', product.brand],
                  ['Collection', product.category],
                  ['SKU', product.sku || '—'],
                  ['Available sizes', product.sizes.length ? product.sizes.join(', ') : '—'],
                  ['Available colours', product.colors.length ? product.colors.join(', ') : '—'],
                  ['Returnable', product.isReturnable ? 'Yes' : 'No'],
                  ['Replaceable', product.isReplaceable ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 border-b border-[#c6c5d0]/20 pb-2">
                    <dt className="shrink-0 text-[#767680]">{label}</dt>
                    <dd className="min-w-0 text-[#0d1648] font-semibold text-right capitalize break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Write a review */}
              <form onSubmit={handleSubmitReview} className="bg-[#f4f2ff] rounded-xl p-5 border border-[#c6c5d0]/30">
                <h4 className="font-serif text-base font-bold text-[#0d1648] mb-3">Write a Review</h4>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} out of 5`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating ? 'fill-[#fed255] text-[#fed255]' : 'text-[#c6c5d0]'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                  placeholder={
                    isAuthenticated ? 'Tell others what you think of this piece…' : 'Sign in to share your thoughts…'
                  }
                  className="w-full bg-white border border-[#c6c5d0] rounded-lg p-3 text-sm text-[#181a2d] placeholder-[#767680] focus:outline-none focus:border-[#755b00]"
                />

                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="btn-primary mt-3 text-[11px] px-6 py-2.5 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Review</span>
                </button>
              </form>

              {/* Existing reviews */}
              {reviewsLoading ? (
                <Spinner label="Loading reviews…" />
              ) : reviews.length === 0 ? (
                <p className="text-sm text-[#767680] font-sans text-center py-6">
                  No reviews yet — be the first to share your thoughts.
                </p>
              ) : (
                <div className="space-y-5">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-[#c6c5d0]/30 pb-5 last:border-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0d1648] text-[#fed255] flex items-center justify-center text-xs font-bold shrink-0">
                            {review.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#0d1648] font-sans">{review.userName}</p>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < review.rating ? 'fill-[#fed255] text-[#fed255]' : 'text-[#c6c5d0]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#767680] font-sans shrink-0">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-[#46464f] font-sans mt-3 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {(related.loading || relatedProducts.length > 0) && (
        <section>
          <h2 className="font-serif text-2xl font-bold text-[#0d1648] mb-6 pb-3 border-b border-[#c6c5d0]/30">
            More from {product.category}
          </h2>
          {related.loading ? (
            <ProductGridSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
