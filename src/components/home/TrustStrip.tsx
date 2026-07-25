import React from 'react';
import { FileText, Lock, RefreshCw, Truck } from 'lucide-react';

/**
 * Claims here are deliberately limited to what the platform genuinely does:
 * Razorpay-backed payments, GST invoices, tracked delivery, and returns on the
 * pieces flagged returnable — never a blanket promise the store cannot keep.
 */
const ITEMS = [
  {
    icon: <Lock className="w-6 h-6 text-[#755b00]" />,
    title: 'SECURE PAYMENTS',
    subtitle: 'UPI, cards and net banking via Razorpay',
  },
  {
    icon: <FileText className="w-6 h-6 text-[#755b00]" />,
    title: 'GST INVOICE',
    subtitle: 'Downloadable tax invoice with every paid order',
  },
  {
    icon: <Truck className="w-6 h-6 text-[#755b00]" />,
    title: 'TRACKED DELIVERY',
    subtitle: 'Status updates from dispatch to doorstep',
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-[#755b00]" />,
    title: 'EASY RETURNS',
    subtitle: 'Return or replace eligible pieces once delivered',
  },
];

export const TrustStrip: React.FC = () => (
  <div className="bg-[#f4f2ff] border-y border-[#c6c5d0]/40 py-6 sm:py-8 my-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/*
        One column on a phone. Two columns leaves each cell around 150px, and
        the icon plus a line like "Downloadable tax invoice with every paid
        order" needs far more than that — it used to break into a ragged stack
        that collided with the row beneath.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {ITEMS.map(item => (
          <div
            key={item.title}
            className="flex items-center gap-3 sm:gap-4 p-3 rounded-lg bg-white/60 shadow-sm border border-[#c6c5d0]/30"
          >
            <div className="p-2 sm:p-2.5 rounded-full bg-[#fed255]/20 shrink-0">{item.icon}</div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#0d1648] uppercase tracking-wider font-sans">{item.title}</h4>
              <p className="text-[11px] text-[#46464f] mt-0.5 font-sans leading-tight">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
