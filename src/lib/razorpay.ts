/**
 * Razorpay Checkout bridge.
 *
 * The gateway's script is loaded on demand — only a customer who actually
 * reaches the payment step pays for the extra request.
 */
import type { ApiPaymentIntent } from '../types';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export interface RazorpaySuccess {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise<boolean>(resolve => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      scriptPromise = null;
      resolve(false);
    };
    if (!existing) document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Raised when the customer closes the gateway sheet without paying. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was cancelled before it completed.');
    this.name = 'PaymentCancelledError';
  }
}

export interface CheckoutCustomer {
  name: string;
  email: string;
  contact: string;
}

/**
 * Opens the gateway sheet and resolves once the customer has paid. The returned
 * ids still have to go to `/payments/verify` — the signature is what proves the
 * payment is genuine, and only the backend can check it.
 */
export function openRazorpayCheckout(
  intent: ApiPaymentIntent,
  customer: CheckoutCustomer,
  orderNumber: string,
): Promise<RazorpaySuccess> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay || !intent.razorpayKeyId || !intent.razorpayOrderId) {
      reject(new Error('The payment gateway is unavailable right now.'));
      return;
    }

    let settled = false;

    const checkout = new window.Razorpay({
      key: intent.razorpayKeyId,
      order_id: intent.razorpayOrderId,
      amount: intent.amountPaise ?? Math.round(intent.amount * 100),
      currency: intent.currency ?? 'INR',
      name: 'Dristhi Fashions',
      description: `Order ${orderNumber}`,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
      },
      theme: { color: '#0d1648' },
      // The buyer's earlier choice is a hint; the gateway sheet lets them
      // switch, and the backend records whatever they actually used.
      ...(intent.paymentMethod ? { method: { [intent.paymentMethod]: true } } : {}),
      handler: (response: RazorpayHandlerResponse) => {
        settled = true;
        resolve({
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          // `handler` fires before dismiss on success, so this only means a
          // cancellation when nothing has settled yet.
          if (!settled) reject(new PaymentCancelledError());
        },
      },
    });

    checkout.on('payment.failed', response => {
      settled = true;
      reject(new Error(response.error?.description || 'The payment could not be completed.'));
    });

    checkout.open();
  });
}
