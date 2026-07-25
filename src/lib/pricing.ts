/**
 * Client-side mirror of the backend's pricing rules.
 *
 * The order total is computed server-side at checkout; this exists so the cart
 * and checkout screens can show the same numbers *before* the order is placed.
 * It must stay in step with `app/core/gst.py` and `app/services/delivery_service.py`
 * — if the two ever disagree, the customer is quoted a price we do not charge.
 */
import type { DeliverySettings, GstBreakup } from '../types';

/** The seller is registered in West Bengal; this is what place of supply is judged against. */
export const SELLER_STATE = 'West Bengal';

export const CGST_PERCENTAGE = 9;
export const SGST_PERCENTAGE = 9;
export const IGST_PERCENTAGE = 18;

const SELLER_STATE_ALIASES = new Set(['west bengal', 'westbengal', 'wb', 'bengal']);

/**
 * True for an intra-state sale. An unknown state counts as intra-state: the
 * total tax is identical either way (CGST + SGST === IGST), only the label differs.
 */
export function isIntraState(customerState: string | null | undefined): boolean {
  const normalized = (customerState ?? '').trim().toLowerCase();
  if (!normalized) return true;
  return SELLER_STATE_ALIASES.has(normalized);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function gstBreakup(taxableAmount: number, customerState: string | null | undefined): GstBreakup {
  if (isIntraState(customerState)) {
    const cgst = round2((taxableAmount * CGST_PERCENTAGE) / 100);
    const sgst = round2((taxableAmount * SGST_PERCENTAGE) / 100);
    return { cgst, sgst, igst: 0, total: round2(cgst + sgst), intraState: true };
  }
  const igst = round2((taxableAmount * IGST_PERCENTAGE) / 100);
  return { cgst: 0, sgst: 0, igst, total: igst, intraState: false };
}

/** Free when charging is off, the fee is zero, or the subtotal clears the free-over threshold. */
export function computeDeliveryFee(subtotal: number, settings: DeliverySettings | null): number {
  if (!settings || settings.fee <= 0) return 0;
  if (settings.freeThreshold !== null && subtotal >= settings.freeThreshold) return 0;
  return round2(settings.fee);
}

export interface OrderTotals {
  subtotal: number;
  gst: GstBreakup;
  deliveryFee: number;
  grandTotal: number;
}

/** The full quote for a bag: subtotal + GST + delivery, exactly as `create_order` computes it. */
export function orderTotals(
  subtotal: number,
  customerState: string | null | undefined,
  delivery: DeliverySettings | null,
): OrderTotals {
  const rounded = round2(subtotal);
  const gst = gstBreakup(rounded, customerState);
  const deliveryFee = computeDeliveryFee(rounded, delivery);
  return {
    subtotal: rounded,
    gst,
    deliveryFee,
    grandTotal: round2(rounded + gst.total + deliveryFee),
  };
}
