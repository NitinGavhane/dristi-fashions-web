import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { BackButton } from '../components/common/BackButton';
import { useStore } from '../context/StoreContext';
import { paymentApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';

interface CheckoutReturnPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

/**
 * Where Cashfree redirects the customer after the hosted checkout finishes.
 *
 * Reads `?order_id=<merchant-order-id>&ref=<order-uuid>`, tells the backend to
 * verify the payment, then sends the buyer to their order. If Cashfree hasn't
 * settled yet (status still in flight) the page re-checks after a short wait
 * before showing anything scary.
 */
export const CheckoutReturnPage: React.FC<CheckoutReturnPageProps> = ({ currentPath, onNavigate }) => {
  const { showToast, refreshOrders } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  const query = new URLSearchParams(currentPath.startsWith('/') && !currentPath.includes('://')
    ? currentPath.split('?')[1] ?? ''
    : new URL(currentPath.startsWith('://') ? `https:${currentPath}` : currentPath).search);
  const cashfreeOrderId = query.get('order_id') ?? '';
  const ref = query.get('ref') ?? '';

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const verify = async (attempt: number) => {
      if (!cashfreeOrderId || !ref) {
        setError('The payment return link is incomplete. Please open the order from your account.');
        return;
      }
      try {
        await paymentApi.verify({ orderId: ref, cashfreeOrderId });
        await refreshOrders();
        setMessage('Payment confirmed — thank you!');
        showToast('Payment Confirmed', 'Your order is confirmed and being prepared.', 'success');
        setTimeout(() => onNavigate(`/orders/${ref}`), 1200);
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode === 400 && attempt < 3) {
          // Payment still settling; give Cashfree a moment and retry.
          setTimeout(() => verify(attempt + 1), 2500);
          return;
        }
        setError(
          errorMessage(err) +
          ' If you believe you were charged, check your order — the payment may still be settling.',
        );
        await refreshOrders();
      }
    };

    verify(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <BackButton onNavigate={onNavigate} to="/" className="mb-6" />
      <div className="bg-white rounded-xl border border-[#c6c5d0]/30 p-8 text-center shadow-sm">
        {error ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#fbe9e9] flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-6 h-6 text-[#ba1a1a]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#0d1648]">We could not confirm payment</h3>
            <p className="text-xs text-[#767680] font-sans mt-2 leading-relaxed max-w-md mx-auto">{error}</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => { done.current = false; setError(null); window.location.reload(); }}
                className="btn-primary inline-flex items-center gap-2 text-[11px] px-6 py-2.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
              <button
                onClick={() => ref && onNavigate(`/orders/${ref}`)}
                className="btn-outline text-[11px] px-6 py-2.5"
              >
                View Order
              </button>
            </div>
          </>
        ) : message ? (
          <>
            <div className="w-12 h-12 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#2e7d32]" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#0d1648]">{message}</h3>
            <p className="text-xs text-[#767680] font-sans mt-2">Taking you to your order…</p>
          </>
        ) : (
          <>
            <Loader2 className="w-7 h-7 text-[#755b00] animate-spin mx-auto" />
            <p className="text-xs text-[#767680] font-sans mt-4">Confirming your payment…</p>
          </>
        )}
      </div>
    </div>
  );
};