import React from 'react';
import { Truck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../lib/format';

/**
 * Explains the delivery policy, read from `/api/v1/delivery`, so the home page
 * quotes the same policy checkout applies.
 *
 * Renders nothing only until that policy has loaded. Once it has, a store with
 * no charge configured — or with charging switched off in the Admin app, which
 * arrives here as a fee of 0 — advertises free delivery rather than going
 * quiet, because free delivery is worth saying out loud.
 */
export const OfferStrip: React.FC = () => {
  const { deliverySettings } = useStore();

  if (!deliverySettings) return null;

  const threshold = deliverySettings.freeThreshold;
  const isFree = deliverySettings.fee <= 0;

  const headline = isFree
    ? 'Free delivery on every order'
    : threshold !== null
      ? `Complimentary delivery on orders above ${formatCurrency(threshold)}`
      : `Flat ${formatCurrency(deliverySettings.fee)} delivery`;

  const detail = isFree
    ? 'No delivery charge, anywhere in India — the price you see is the price you pay.'
    : threshold !== null
      ? `Orders below ${formatCurrency(threshold)} carry a ${formatCurrency(deliverySettings.fee)} delivery charge.`
      : 'Delivery is charged at a single flat rate, shown before you pay.';

  return (
    <div className="max-w-7xl mx-auto px-4 my-6">
      <div className="bg-[#181a2d] border border-[#fed255]/40 rounded-lg p-4 text-white flex items-center gap-4 shadow-lg">
        <div className="p-2 bg-[#fed255] text-[#0d1648] rounded-md shrink-0">
          <Truck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white font-sans">{headline}</p>
          <p className="text-[11px] text-[#c6c5d0] mt-0.5 font-sans">{detail}</p>
        </div>
      </div>
    </div>
  );
};
