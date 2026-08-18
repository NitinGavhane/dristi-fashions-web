import React, { useEffect, useState } from 'react';
import { ChevronRight, Loader2, Package, X } from 'lucide-react';
import { BackButton } from '../components/common/BackButton';
import { EmptyState, Spinner } from '../components/common/States';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/OrderStatus';
import { useStore } from '../context/StoreContext';
import { orderApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';
import { formatCurrency, formatDate } from '../lib/format';

interface OrdersPageProps {
  onNavigate: (path: string) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, authLoading, orders, ordersLoading, refreshOrders, showToast } = useStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Statuses change on the admin side, so re-fetch whenever this page opens.
  useEffect(() => {
    if (isAuthenticated) void refreshOrders();
  }, [isAuthenticated, refreshOrders]);

  /** Cancels a not-yet-dispatched order; paid orders are auto-refunded. */
  const handleCancel = async (e: React.MouseEvent, orderId: string, orderNumber: string, paid: boolean) => {
    e.stopPropagation();
    const ok = window.confirm(
      paid
        ? `Cancel order ${orderNumber}? A refund will be initiated to your original payment method.`
        : `Cancel order ${orderNumber}?`,
    );
    if (!ok) return;
    setCancellingId(orderId);
    try {
      const result = await orderApi.cancel(orderId);
      showToast('Order Cancelled', result.message, 'info');
      await refreshOrders();
    } catch (err) {
      showToast('Cancel Failed', errorMessage(err), 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} to="/profile" className="mb-6" />
        <Spinner label="Loading your orders…" className="min-h-[50vh]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <BackButton onNavigate={onNavigate} to="/profile" className="mb-6" />
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="My Orders"
          message="Sign in to track your shipments and view your purchase history."
          actionLabel="Sign In"
          onAction={() => onNavigate('/login?next=/orders')}
        />
      </div>
    );
  }

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <BackButton onNavigate={onNavigate} to="/profile" className="mb-6" />
        <Spinner label="Loading your orders…" className="min-h-[50vh]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-4 py-16">
        <BackButton onNavigate={onNavigate} to="/profile" className="mb-6" />
        <EmptyState
          icon={<Package className="w-12 h-12" />}
          title="No orders yet"
          message="Your order history will appear here once you place your first order."
          actionLabel="Browse the Catalogue"
          onAction={() => onNavigate('/search')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <BackButton onNavigate={onNavigate} to="/profile" />
      <div className="border-b border-[#c6c5d0]/30 pb-4">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">
          My Orders <span className="text-[#755b00]">({orders.length})</span>
        </h1>
        <p className="text-xs text-[#767680] font-sans mt-1">Track your shipments and download GST invoices.</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const canCancel = ['pending_payment', 'placed', 'processing'].includes(order.status);
          return (
            <div
              key={order.id}
              onClick={() => onNavigate(`/orders/${order.id}`)}
              className="w-full text-left bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm hover:shadow-md hover:border-[#755b00]/40 transition-all p-5 cursor-pointer"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-serif text-base font-bold text-[#0d1648] break-all">{order.orderNumber}</p>
                  <p className="text-[11px] text-[#767680] font-sans mt-0.5">
                    Placed {formatDate(order.createdAt)} · {order.items.length}{' '}
                    {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#c6c5d0]/30 flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#46464f] font-sans line-clamp-1">
                    {order.items.map(i => `${i.title} × ${i.quantity}`).join(', ')}
                  </p>
                  {order.returnStatus && (
                    <p className="text-[11px] text-[#755b00] font-sans mt-1 font-semibold">
                      {order.returnStatus === 'replace_requested' ? 'Replacement requested' : 'Return requested'}
                    </p>
                  )}
                  {order.status === 'pending_payment' && (
                    <p className="text-[11px] text-[#755b00] font-sans mt-1">
                      Awaiting payment — cancels automatically after 30 minutes if unpaid.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {canCancel && (
                    <button
                      onClick={e => handleCancel(e, order.id, order.orderNumber, order.paymentStatus === 'paid')}
                      disabled={cancellingId === order.id}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ba1a1a] border border-[#f0a9a9] rounded-full px-3 py-1.5 hover:bg-[#fdeaea] disabled:opacity-60 font-sans"
                    >
                      {cancellingId === order.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Cancel
                    </button>
                  )}
                  <span className="font-serif text-lg font-bold text-[#0d1648]">{formatCurrency(order.totalAmount)}</span>
                  <ChevronRight className="w-4 h-4 text-[#755b00]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
