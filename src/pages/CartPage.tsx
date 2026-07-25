import React from 'react';
import { ArrowRight, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../lib/format';
import { PLACEHOLDER_IMAGE } from '../lib/mappers';
import { CGST_PERCENTAGE, IGST_PERCENTAGE } from '../lib/pricing';

interface CartPageProps {
  onNavigate: (path: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    cart,
    cartLoading,
    cartCount,
    cartSubtotal,
    updateQuantity,
    removeFromCart,
    addresses,
    deliverySettings,
    quoteFor,
    isAuthenticated,
  } = useStore();

  // Before an address is chosen the estimate uses the default one, falling back
  // to the seller's own state — the same assumption the backend makes.
  const defaultAddress = addresses.find(a => a.isDefault) ?? addresses[0] ?? null;
  const totals = quoteFor(defaultAddress?.state ?? null);

  const amountToFreeDelivery =
    deliverySettings?.freeThreshold != null && totals.deliveryFee > 0
      ? deliverySettings.freeThreshold - cartSubtotal
      : 0;

  if (cartLoading && cart.length === 0) {
    return <Spinner label="Loading your bag…" className="min-h-[50vh]" />;
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="Your bag is empty"
          message="Discover our latest arrivals and add a piece you love."
          actionLabel="Browse the Catalogue"
          onAction={() => onNavigate('/search')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Shopping Bag</h1>
        <p className="text-xs text-[#767680] font-sans mt-1">
          {cartCount} {cartCount === 1 ? 'item' : 'items'} in your bag
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lines */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-3 sm:p-4 flex gap-3 sm:gap-4 items-start"
            >
              {/* A 96px thumbnail left only ~180px for the title, stepper,
                  line total and bin on a 360px screen — the controls ran past
                  the card edge. It shrinks with the viewport instead. */}
              <button
                onClick={() => onNavigate(`/product/${item.productId}`)}
                className="w-20 h-26 sm:w-24 sm:h-32 rounded-lg overflow-hidden bg-[#f4f2ff] shrink-0"
                aria-label={`View ${item.title}`}
              >
                <img
                  src={item.image || PLACEHOLDER_IMAGE}
                  alt={item.title}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                  className="w-full h-full object-cover"
                />
              </button>

              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <button
                    onClick={() => onNavigate(`/product/${item.productId}`)}
                    className="font-serif text-sm sm:text-base font-semibold text-[#0d1648] hover:text-[#755b00] text-left line-clamp-2"
                  >
                    {item.title}
                  </button>

                  {(item.selectedSize || item.selectedColor) && (
                    <p className="text-[11px] text-[#767680] font-sans mt-1">
                      {[item.selectedSize && `Size: ${item.selectedSize}`, item.selectedColor && `Colour: ${item.selectedColor}`]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </p>
                  )}

                  <p className="font-serif font-bold text-[#0d1648] mt-2">{formatCurrency(item.price)}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mt-3">
                  <div className="flex shrink-0 items-center border border-[#c6c5d0] rounded-md overflow-hidden">
                    <button
                      onClick={() => void updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 text-[#0d1648] hover:bg-[#f4f2ff]"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 sm:w-9 text-center text-sm font-bold text-[#0d1648] font-sans">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => void updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-[#0d1648] hover:bg-[#f4f2ff]"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <span className="text-sm font-bold text-[#0d1648] font-sans whitespace-nowrap">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => void removeFromCart(item.id)}
                      className="p-2 -mr-1 text-[#767680] hover:text-[#ba1a1a] transition-colors"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => onNavigate('/search')}
            className="text-xs font-semibold text-[#755b00] hover:underline uppercase tracking-wider"
          >
            ← Continue shopping
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-4">
          {/*
            Offset by the header's measured height rather than a hard-coded
            `top-28`. The header grows and shrinks with the promo bar and the
            category row, and at its tallest it was overlapping the top of this
            panel once the page scrolled.
          */}
          <div className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-md p-4 sm:p-6 lg:sticky lg:top-[calc(var(--header-height,7.5rem)+1rem)]">
            <h2 className="font-serif text-lg font-bold text-[#0d1648] pb-4 border-b border-[#c6c5d0]/40">
              Order Summary
            </h2>

            <dl className="space-y-3 py-4 text-xs font-sans">
              <div className="flex justify-between">
                <dt className="text-[#46464f]">Subtotal ({cartCount} items)</dt>
                <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.subtotal)}</dd>
              </div>

              {/* The split shown here follows the default address; checkout
                  recalculates it once a delivery address is chosen. */}
              {totals.gst.intraState ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-[#46464f]">CGST ({CGST_PERCENTAGE}%)</dt>
                    <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.gst.cgst)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#46464f]">SGST ({CGST_PERCENTAGE}%)</dt>
                    <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.gst.sgst)}</dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <dt className="text-[#46464f]">IGST ({IGST_PERCENTAGE}%)</dt>
                  <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.gst.igst)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-[#46464f]">Delivery</dt>
                <dd className={`font-semibold ${totals.deliveryFee === 0 ? 'text-[#2e7d32]' : 'text-[#0d1648]'}`}>
                  {totals.deliveryFee === 0 ? 'Free' : formatCurrency(totals.deliveryFee)}
                </dd>
              </div>
            </dl>

            {amountToFreeDelivery > 0 && (
              <p className="text-[11px] text-[#755b00] font-sans bg-[#fed255]/15 rounded-md px-3 py-2 mb-4">
                Add {formatCurrency(amountToFreeDelivery)} more for complimentary delivery.
              </p>
            )}

            <div className="flex justify-between items-baseline pt-4 border-t border-[#c6c5d0]/40">
              <span className="font-serif font-bold text-[#0d1648]">Total</span>
              <span className="font-serif text-2xl font-bold text-[#0d1648]">{formatCurrency(totals.grandTotal)}</span>
            </div>

            <button
              onClick={() => onNavigate(isAuthenticated ? '/checkout' : '/login?next=/checkout')}
              className="btn-primary w-full mt-5 py-3.5 text-xs tracking-widest inline-flex items-center justify-center gap-2"
            >
              <span>{isAuthenticated ? 'PROCEED TO CHECKOUT' : 'SIGN IN TO CHECKOUT'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#767680] font-sans">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#755b00]" /> Secure checkout
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#755b00]" /> GST invoice
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
