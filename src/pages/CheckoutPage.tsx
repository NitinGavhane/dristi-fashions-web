import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, CreditCard, Loader2, Lock, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { AddressForm } from '../components/common/AddressForm';
import { EmptyState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { paymentApi } from '../lib/api';
import { ApiError, errorMessage } from '../lib/apiClient';
import { formatCurrency } from '../lib/format';
import { PLACEHOLDER_IMAGE, mapPaymentMethod } from '../lib/mappers';
import { CGST_PERCENTAGE, IGST_PERCENTAGE, SELLER_STATE, SGST_PERCENTAGE } from '../lib/pricing';
import { PaymentCancelledError, loadRazorpay, openRazorpayCheckout } from '../lib/razorpay';
import { useAsync } from '../lib/useAsync';
import type { Address } from '../types';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

type Stage = 'idle' | 'placing' | 'paying' | 'verifying';

const STAGE_LABEL: Record<Stage, string> = {
  idle: 'PLACE ORDER',
  placing: 'PLACING YOUR ORDER…',
  paying: 'AWAITING PAYMENT…',
  verifying: 'CONFIRMING PAYMENT…',
};

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    authLoading,
    cart,
    cartCount,
    addresses,
    addressesLoading,
    addAddress,
    quoteFor,
    placeOrder,
    showToast,
    refreshOrders,
  } = useStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) onNavigate('/login?next=/checkout');
  }, [authLoading, isAuthenticated, onNavigate]);

  // Default to the address the customer marked default.
  useEffect(() => {
    if (selectedAddressId || addresses.length === 0) return;
    setSelectedAddressId((addresses.find(a => a.isDefault) ?? addresses[0]).id);
  }, [addresses, selectedAddressId]);

  const selectedAddress = useMemo<Address | null>(
    () => addresses.find(a => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  // Which methods are offered depends on the delivery country.
  const methods = useAsync(
    () => paymentApi.listMethods(selectedAddress?.country || 'IN'),
    [selectedAddress?.country],
  );

  const paymentMethods = useMemo(() => (methods.data ?? []).map(mapPaymentMethod), [methods.data]);

  useEffect(() => {
    if (!selectedMethod && paymentMethods.length) setSelectedMethod(paymentMethods[0].code);
  }, [paymentMethods, selectedMethod]);

  const totals = quoteFor(selectedAddress?.state ?? null);
  const busy = stage !== 'idle';

  /**
   * Places the order, then takes payment for it.
   *
   * The order is created first and deliberately survives a failed or abandoned
   * payment — it sits as `pending` so the customer can retry from the order
   * page rather than rebuilding their bag.
   */
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast('Delivery Address Required', 'Choose where this order should be delivered.', 'info');
      return;
    }
    if (!user) return;

    setStage('placing');
    const order = await placeOrder(selectedAddress);
    if (!order) {
      setStage('idle');
      return;
    }

    try {
      setStage('paying');
      const intent = await paymentApi.create(order.id, selectedMethod ?? undefined);

      const ready = await loadRazorpay();
      if (!ready) throw new Error('The payment gateway could not be loaded.');

      const result = await openRazorpayCheckout(
        intent,
        { name: user.fullName, email: user.email, contact: user.phone },
        order.orderNumber,
      );

      setStage('verifying');
      await paymentApi.verify({ orderId: order.id, ...result });

      await refreshOrders();
      showToast('Payment Confirmed', `Order ${order.orderNumber} is confirmed. Thank you!`, 'success');
      onNavigate(`/orders/${order.id}`);
    } catch (err) {
      // The order exists either way; only the wording changes.
      if (err instanceof PaymentCancelledError) {
        showToast(
          'Payment Not Completed',
          `Order ${order.orderNumber} is saved as pending — you can pay for it from your orders.`,
          'info',
        );
      } else if (err instanceof ApiError && err.statusCode === 503) {
        showToast(
          'Payment Unavailable',
          `Order ${order.orderNumber} was placed. Online payment is not available right now — our team will contact you.`,
          'info',
        );
      } else {
        showToast('Payment Failed', errorMessage(err), 'error');
      }
      await refreshOrders();
      onNavigate(`/orders/${order.id}`);
    } finally {
      setStage('idle');
    }
  };

  if (authLoading) return <Spinner label="Loading checkout…" className="min-h-[50vh]" />;
  if (!isAuthenticated) return null;

  if (cart.length === 0 && !busy) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          title="Your bag is empty"
          message="Add something you love before checking out."
          actionLabel="Browse the Catalogue"
          onAction={() => onNavigate('/search')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => onNavigate('/cart')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bag
      </button>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648] mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Delivery address */}
          <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-[#0d1648] inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#755b00]" /> Delivery Address
              </h2>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-xs font-semibold text-[#755b00] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {showAddressForm ? (
              <AddressForm
                defaultName={user?.fullName}
                defaultPhone={user?.phone}
                forceDefault={addresses.length === 0}
                submitLabel="Save & Use This Address"
                onCancel={() => setShowAddressForm(false)}
                onSubmit={async data => {
                  const ok = await addAddress(data);
                  if (ok) setShowAddressForm(false);
                }}
              />
            ) : addressesLoading ? (
              <Spinner label="Loading your addresses…" />
            ) : addresses.length === 0 ? (
              <EmptyState
                title="No saved addresses"
                message="Add a delivery address to continue with your order."
                actionLabel="Add Address"
                onAction={() => setShowAddressForm(true)}
              />
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full text-left rounded-lg border p-4 transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-[#755b00] ring-1 ring-[#fed255] bg-[#fed255]/5'
                        : 'border-[#c6c5d0]/50 hover:border-[#755b00]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#755b00] uppercase tracking-wider">
                            {addr.type}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold bg-[#0d1648] text-[#fed255] px-2 py-0.5 rounded-full uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#0d1648] font-sans mt-1">{addr.fullName}</p>
                        <p className="text-xs text-[#46464f] font-sans mt-0.5 leading-relaxed">
                          {addr.street}, {addr.city}, {addr.state} {addr.pincode}
                        </p>
                        <p className="text-xs text-[#767680] font-sans mt-0.5">{addr.phone}</p>
                      </div>
                      {selectedAddressId === addr.id && (
                        <span className="w-5 h-5 rounded-full bg-[#0d1648] text-[#fed255] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Payment method */}
          <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
            <h2 className="font-serif text-lg font-bold text-[#0d1648] inline-flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#755b00]" /> Payment Method
            </h2>

            {methods.loading ? (
              <Spinner label="Loading payment options…" />
            ) : paymentMethods.length === 0 ? (
              <p className="text-xs text-[#767680] font-sans">
                No payment methods are configured for this destination. You can still place the order and our team will
                arrange payment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.code)}
                    className={`text-left rounded-lg border p-4 transition-all ${
                      selectedMethod === method.code
                        ? 'border-[#755b00] ring-1 ring-[#fed255] bg-[#fed255]/5'
                        : 'border-[#c6c5d0]/50 hover:border-[#755b00]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0d1648] font-sans">{method.name}</span>
                      {selectedMethod === method.code && (
                        <span className="w-5 h-5 rounded-full bg-[#0d1648] text-[#fed255] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {method.description && (
                      <p className="text-[11px] text-[#767680] font-sans mt-1">{method.description}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#767680] font-sans mt-4 leading-relaxed">
              You can switch method inside the secure payment window. Your card details never reach our servers.
            </p>
          </section>
        </div>

        {/* Summary */}
        <div className="lg:col-span-5">
          {/* Pinned below the header's measured height — see CartPage. */}
          <div className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-md p-4 sm:p-6 lg:sticky lg:top-[calc(var(--header-height,7.5rem)+1rem)]">
            <h2 className="font-serif text-lg font-bold text-[#0d1648] pb-4 border-b border-[#c6c5d0]/40">
              Order Summary
            </h2>

            <div className="py-4 space-y-3 max-h-64 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image || PLACEHOLDER_IMAGE}
                    alt={item.title}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                    className="w-12 h-14 rounded object-cover bg-[#f4f2ff] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#0d1648] font-sans line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-[#767680] font-sans">
                      {[item.selectedSize, item.selectedColor].filter(Boolean).join(' · ')}
                      {item.selectedSize || item.selectedColor ? ' · ' : ''}Qty {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#0d1648] font-sans shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <dl className="space-y-3 py-4 border-t border-[#c6c5d0]/40 text-xs font-sans">
              <div className="flex justify-between">
                <dt className="text-[#46464f]">Subtotal ({cartCount} items)</dt>
                <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.subtotal)}</dd>
              </div>

              {totals.gst.intraState ? (
                <>
                  <div className="flex justify-between">
                    <dt className="text-[#46464f]">CGST ({CGST_PERCENTAGE}%)</dt>
                    <dd className="font-semibold text-[#0d1648]">{formatCurrency(totals.gst.cgst)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#46464f]">SGST ({SGST_PERCENTAGE}%)</dt>
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

            {/* Say which rule applied, so the tax line is never a mystery. */}
            <p className="text-[10px] text-[#767680] font-sans -mt-2 mb-3">
              {selectedAddress
                ? totals.gst.intraState
                  ? `Intra-state supply (${SELLER_STATE}) — CGST + SGST apply.`
                  : `Inter-state supply to ${selectedAddress.state} — IGST applies.`
                : `Estimated at ${SELLER_STATE} rates until you choose a delivery address.`}
            </p>

            <div className="flex justify-between items-baseline pt-4 border-t border-[#c6c5d0]/40">
              <span className="font-serif font-bold text-[#0d1648]">Total Payable</span>
              <span className="font-serif text-2xl font-bold text-[#0d1648]">{formatCurrency(totals.grandTotal)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={busy || !selectedAddress}
              className="btn-primary w-full mt-5 py-3.5 text-xs tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{STAGE_LABEL[stage]}</span>
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#767680] font-sans">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#755b00]" /> Encrypted payment
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-[#755b00]" /> GST invoice issued
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
