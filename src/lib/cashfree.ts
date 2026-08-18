/**
 * Cashfree Payments checkout bridge (Web SDK, hosted checkout).
 *
 * The gateway's script is loaded on demand — only a customer who actually
 * reaches the payment step pays for the extra request. Payment completes on
 * Cashfree's hosted page; the browser is redirected back to `intent.returnUrl`
 * carrying `?order_id=<merchant-order-id>`, which the checkout return page
 * hands to `/payments/verify`.
 */
import type { ApiPaymentIntent } from '../types';

const SCRIPT_SRC = 'https://sdk.cashfree.com/js/v3/cashfree.js';

declare global {
  interface Window {
    Cashfree?: new (options: { mode: string }) => CashfreeInstance;
  }
}

interface CashfreeInstance {
  checkout(options: {
    paymentSessionId: string;
    returnUrl?: string;
    redirectTarget?: string;
  }): Promise<CashfreeResult>;
}

interface CashfreeResult {
  error?: { message?: string };
  redirect?: boolean;
}

let scriptPromise: Promise<boolean> | null = null;

export function loadCashfree(): Promise<boolean> {
  if (window.Cashfree) return Promise.resolve(true);
  scriptPromise ??= new Promise<boolean>(resolve => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Cashfree));
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      scriptPromise = null;
      resolve(false);
    };
    if (!existing) document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Raised when the gateway checkout could not be opened. */
export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was cancelled before it completed.');
    this.name = 'PaymentCancelledError';
  }
}

/**
 * Opens Cashfree's hosted checkout page for the order and navigates to it.
 * The promise resolves after the page is launched; the customer's return
 * redirect is handled by the checkout return page, which completes the
 * verification via `/payments/verify`.
 */
export async function openCashfreeCheckout(intent: ApiPaymentIntent): Promise<void> {
  if (!window.Cashfree || !intent.paymentSessionId) {
    throw new Error('The payment gateway is unavailable right now.');
  }

  const mode =
    intent.cashfreeEnvironment === 'production' ? 'production' : 'sandbox';
  const cashfree = new window.Cashfree({ mode });

  let result: CashfreeResult;
  try {
    result = await cashfree.checkout({
      paymentSessionId: intent.paymentSessionId,
      returnUrl: intent.returnUrl ?? undefined,
      redirectTarget: '_self',
    });
  } catch (err) {
    throw new PaymentCancelledError();
  }

  if (result?.error?.message) {
    throw new Error(result.error.message);
  }
  if (result?.redirect) {
    // The hosted page is now managing the browser; the caller must not treat
    // this as a completed payment.
    return;
  }
}