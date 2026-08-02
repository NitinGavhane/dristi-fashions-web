import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Clock,
  CreditCard,
  Download,
  Loader2,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { ErrorState, Spinner } from '../components/common/States';
import { ORDER_FLOW, OrderStatusBadge, PaymentStatusBadge } from '../components/common/OrderStatus';
import { useStore } from '../context/StoreContext';
import { orderApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';
import { formatCurrency, formatDate, humanizeStatus } from '../lib/format';
import { mapOrder } from '../lib/mappers';
import { CGST_PERCENTAGE, IGST_PERCENTAGE, SGST_PERCENTAGE } from '../lib/pricing';
import { useAsync } from '../lib/useAsync';

interface OrderDetailPageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({ orderId, onNavigate }) => {
  const { isAuthenticated, authLoading, showToast } = useStore();
  const [downloading, setDownloading] = useState(false);

  const state = useAsync(() => orderApi.get(orderId), [orderId]);
  const order = state.data ? mapOrder(state.data) : null;

  // Redirecting is a side effect, so it waits for commit rather than running
  // mid-render.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) onNavigate('/login?next=/orders');
  }, [authLoading, isAuthenticated, onNavigate]);

  /**
   * Pulls the GST invoice PDF (an authenticated request, so it cannot just be a
   * plain link) and hands it to the browser as a download.
   */
  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const blob = await orderApi.invoicePdf(order.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast('Invoice Unavailable', errorMessage(err, 'The invoice is issued once payment is confirmed.'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading || state.loading) return <Spinner label="Loading your order…" className="min-h-[50vh]" />;

  if (!isAuthenticated) return null;

  if (state.error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Order not found"
          message={state.error ?? 'We could not find this order in your history.'}
          onRetry={state.reload}
        />
        <div className="text-center mt-6">
          <button onClick={() => onNavigate('/orders')} className="btn-outline text-xs px-6 py-2.5">
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const cancelled = order.status === 'cancelled';
  const currentStep = ORDER_FLOW.indexOf(order.status);
  const canRequestReturn = order.status === 'delivered' && !order.returnStatus;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#c6c5d0]/30 pb-4">
        <div>
          <button
            onClick={() => onNavigate('/orders')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </button>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648] break-all">{order.orderNumber}</h1>
          <p className="text-xs text-[#767680] font-sans mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Progress */}
      <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
        <h2 className="font-serif text-lg font-bold text-[#0d1648] mb-6">Order Progress</h2>

        {cancelled ? (
          <p className="text-sm text-[#ba1a1a] font-sans">This order was cancelled.</p>
        ) : (
          <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
            {ORDER_FLOW.map((step, idx) => {
              const done = idx <= currentStep;
              return (
                <li key={step} className="flex min-w-0 sm:flex-col sm:flex-1 items-center gap-3 sm:gap-2 sm:text-center">
                  <div className="flex items-center w-full sm:justify-center">
                    {/* Connector to the previous step, hidden on the first. */}
                    {idx > 0 && (
                      <span
                        className={`hidden sm:block h-0.5 flex-1 ${idx <= currentStep ? 'bg-[#755b00]' : 'bg-[#c6c5d0]'}`}
                      />
                    )}
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                        done ? 'bg-[#0d1648] border-[#0d1648] text-[#fed255]' : 'bg-white border-[#c6c5d0] text-[#c6c5d0]'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </span>
                    {idx < ORDER_FLOW.length - 1 && (
                      <span
                        className={`hidden sm:block h-0.5 flex-1 ${idx < currentStep ? 'bg-[#755b00]' : 'bg-[#c6c5d0]'}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-sans ${done ? 'font-bold text-[#0d1648]' : 'text-[#767680]'}`}
                  >
                    {humanizeStatus(step)}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        {order.estimatedDelivery && !cancelled && order.status !== 'delivered' && (
          <p className="text-xs text-[#46464f] font-sans mt-6 pt-4 border-t border-[#c6c5d0]/30">
            Estimated delivery by <strong className="text-[#0d1648]">{formatDate(order.estimatedDelivery)}</strong>
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Items */}
        <section className="lg:col-span-7 bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-[#0d1648] mb-4">
            Items ({order.items.length})
          </h2>
          <div className="divide-y divide-[#c6c5d0]/30">
            {order.items.map(item => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <button
                    onClick={() => onNavigate(`/product/${item.productId}`)}
                    className="text-sm font-semibold text-[#0d1648] hover:text-[#755b00] font-sans text-left line-clamp-2"
                  >
                    {item.title}
                  </button>
                  <p className="text-[11px] text-[#767680] font-sans mt-0.5">
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-[#0d1648] font-sans shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Payment summary */}
        <section className="lg:col-span-5 bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-[#0d1648] inline-flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#755b00]" /> Payment Summary
          </h2>

          <dl className="space-y-2.5 text-xs font-sans">
            <div className="flex justify-between">
              <dt className="text-[#46464f]">Subtotal</dt>
              <dd className="font-semibold text-[#0d1648]">{formatCurrency(order.subtotal)}</dd>
            </div>

            {/* The split stored on the order — locked in at checkout. */}
            {order.igstAmount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-[#46464f]">IGST ({IGST_PERCENTAGE}%)</dt>
                <dd className="font-semibold text-[#0d1648]">{formatCurrency(order.igstAmount)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <dt className="text-[#46464f]">CGST ({CGST_PERCENTAGE}%)</dt>
                  <dd className="font-semibold text-[#0d1648]">{formatCurrency(order.cgstAmount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#46464f]">SGST ({SGST_PERCENTAGE}%)</dt>
                  <dd className="font-semibold text-[#0d1648]">{formatCurrency(order.sgstAmount)}</dd>
                </div>
              </>
            )}

            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#46464f]">Discount</dt>
                <dd className="font-semibold text-[#2e7d32]">−{formatCurrency(order.discount)}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-[#46464f]">Delivery</dt>
              <dd className={`font-semibold ${order.deliveryFee === 0 ? 'text-[#2e7d32]' : 'text-[#0d1648]'}`}>
                {order.deliveryFee === 0 ? 'Free' : formatCurrency(order.deliveryFee)}
              </dd>
            </div>

            <div className="flex justify-between pt-3 mt-1 border-t border-[#c6c5d0]/40">
              <dt className="font-serif font-bold text-[#0d1648]">Total Paid</dt>
              <dd className="font-serif text-lg font-bold text-[#0d1648]">{formatCurrency(order.totalAmount)}</dd>
            </div>
          </dl>

          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="btn-outline w-full mt-5 py-2.5 text-[11px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Download GST Invoice</span>
          </button>
        </section>
      </div>

      {/* Shipping */}
      <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
        <h2 className="font-serif text-lg font-bold text-[#0d1648] inline-flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-[#755b00]" /> Delivery Address
        </h2>
        <p className="text-sm text-[#46464f] font-sans leading-relaxed">
          {order.shippingAddress || 'No address recorded for this order.'}
        </p>
      </section>

      {/* Returns */}
      {(canRequestReturn || order.returnStatus) && (
        <section className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm p-4 sm:p-6">
          <h2 className="font-serif text-lg font-bold text-[#0d1648] inline-flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4 text-[#755b00]" /> Returns & Replacements
          </h2>

          {order.returnStatus ? (
            <div className="text-sm font-sans space-y-1">
              <p className="text-[#0d1648] font-semibold">
                {order.returnStatus === 'replace_requested' ? 'Replacement requested' : 'Return requested'} —{' '}
                <span className="font-normal text-[#46464f]">{humanizeStatus(order.returnStatus)}</span>
              </p>
              {order.returnReason && <p className="text-xs text-[#767680]">Reason: {order.returnReason}</p>}
              {order.returnStatus === 'approved' && (
                <p className="text-xs text-[#1e6b32]">
                  Approved — keep an eye on your phone/email for the pickup OTP and share it with our pickup partner.
                </p>
              )}
              {order.returnStatus === 'rejected' && (
                <p className="text-xs text-[#ba1a1a]">
                  {order.returnAdminNote
                    ? `Not approved: ${order.returnAdminNote}`
                    : 'This request could not be approved. Our team will reach out with details.'}
                </p>
              )}
              {order.returnStatus === 'picked_up' && (
                <p className="text-xs text-[#1e6b32]">The item has been picked up. Your refund/replacement is on its way.</p>
              )}
              {order.returnEvidence.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {order.returnEvidence.map((url, i) => (
                    <img key={`${url}-${i}`} src={url} alt={`Return evidence ${i + 1}`} className="w-16 h-16 rounded-lg object-cover border border-[#c6c5d0]/40" />
                  ))}
                </div>
              )}
              {(order.returnStatus === 'requested' || order.returnStatus === 'replace_requested') && (
                <p className="text-xs text-[#767680]">Our team is reviewing your request and will be in touch.</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs text-[#46464f] font-sans mb-4">
                Delivered orders can be returned or replaced. Tell us what went wrong and our team will take it from
                there.
              </p>
              <button
                onClick={() => onNavigate(`/orders/${order.id}/return-replace`)}
                className="btn-primary text-[11px] px-6 py-2.5"
              >
                Request Return or Replacement
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
};
