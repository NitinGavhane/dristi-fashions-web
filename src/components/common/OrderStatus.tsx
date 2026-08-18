import React from 'react';
import type { OrderStatus } from '../../types';
import { humanizeStatus } from '../../lib/format';

/** Backend order statuses in the sequence a parcel actually moves through. */
export const ORDER_FLOW: OrderStatus[] = ['placed', 'processing', 'dispatched', 'out_for_delivery', 'delivered'];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending_payment: 'bg-[#fff4d6] text-[#755b00] border-[#fed255]',
  placed: 'bg-[#f4f2ff] text-[#0d1648] border-[#c6c5d0]',
  processing: 'bg-[#fff4d6] text-[#755b00] border-[#fed255]',
  dispatched: 'bg-[#e3f0ff] text-[#14538f] border-[#9cc7f5]',
  out_for_delivery: 'bg-[#e3f0ff] text-[#14538f] border-[#9cc7f5]',
  delivered: 'bg-[#e6f4ea] text-[#1e6b32] border-[#8bcf9f]',
  cancelled: 'bg-[#fdeaea] text-[#ba1a1a] border-[#f0a9a9]',
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; className?: string }> = ({ status, className = '' }) => (
  <span
    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border font-sans ${STATUS_STYLES[status]} ${className}`}
  >
    {humanizeStatus(status)}
  </span>
);

const PAYMENT_STYLES: Record<string, string> = {
  paid: 'bg-[#e6f4ea] text-[#1e6b32] border-[#8bcf9f]',
  pending: 'bg-[#fff4d6] text-[#755b00] border-[#fed255]',
  failed: 'bg-[#fdeaea] text-[#ba1a1a] border-[#f0a9a9]',
  refunded: 'bg-[#e3f0ff] text-[#14538f] border-[#9cc7f5]',
};

export const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border font-sans ${
      PAYMENT_STYLES[status] ?? PAYMENT_STYLES.pending
    }`}
  >
    {humanizeStatus(status)} Payment
  </span>
);
