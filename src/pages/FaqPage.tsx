import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, Mail, Phone, User } from 'lucide-react';

interface FaqPageProps {
  onNavigate: (path: string) => void;
}

interface FaqCategory {
  heading: string;
  items: { q: string; a: string }[];
}

const CATEGORIES: FaqCategory[] = [
  {
    heading: '1. Orders & Tracking',
    items: [
      {
        q: 'How do I place an order on Drishti Fashions?',
        a: 'Simply browse our collection, select your preferred size and colour, click "Add to Cart," and proceed to checkout. Enter your shipping address and choose your preferred payment method to complete your purchase.',
      },
      {
        q: 'Can I modify or cancel my order?',
        a: 'You can cancel your order within 24 hours of placing it by going to the "My Orders" section in your account or by contacting our customer support team. Once dispatched, orders cannot be modified or cancelled.',
      },
      {
        q: 'How can I track my order?',
        a: 'Once your order is shipped from our warehouse, tracking details become active within 24 hours. You can view the live status of your package anytime by visiting the "My Orders" section in the app or website.',
      },
      {
        q: 'Why has my order been split into multiple shipments?',
        a: 'If you ordered multiple items, they may be shipped from different partner warehouses or fulfilment centres to get them to you as quickly as possible. You will receive tracking details for each individual shipment.',
      },
    ],
  },
  {
    heading: '2. Shipping & Delivery',
    items: [
      {
        q: 'How much are the shipping charges?',
        a: 'We charge a transparent Convenience Fee which includes a flat platform fee of ₹29, and a packaging/delivery fee based on your order value: ₹25 for orders up to ₹499, ₹15 for orders between ₹500 and ₹999, and FREE delivery for all orders above ₹1000 (and above ₹149 for our Drishti Platinum Members).',
      },
      {
        q: 'How long does delivery take?',
        a: 'Domestic Orders: Typically delivered within 5–7 days. International Orders: Typically delivered within 10–15 days. Note: Delivery timelines are estimates and may occasionally vary due to unforeseen logistics delays.',
      },
    ],
  },
  {
    heading: '3. Payments & Discounts',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept a wide range of secure payment options through our Payment Gateway Channel (Razorpay, PayU, or Cashfree), including Credit Cards and Debit Cards (Visa, MasterCard, Maestro, RuPay), Net Banking across all major banks, UPI apps (Google Pay, PhonePe, Paytm, etc.), popular digital wallets and e-Gift cards, and Cash on Delivery (COD).',
      },
      {
        q: 'How do I apply a discount or promo code?',
        a: 'During the checkout process, you will see a box labelled "Apply Promo Code" or "Discount Coupon." Enter your code there and click apply to see the discounted total instantly before making your payment.',
      },
      {
        q: 'Is it safe to use my credit/debit card on your platform?',
        a: 'Yes, absolutely. All online transactions are processed through encrypted, secure payment gateways (such as Razorpay and PayU). Drishti Fashions never stores your complete card details or CVV.',
      },
    ],
  },
  {
    heading: '4. Returns, Exchanges & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'Most domestic items are eligible for return or replacement within 5 days of delivery, provided they are unused, unwashed, and have all original tags intact. Made-to-order items and international orders are not eligible for returns.',
      },
      {
        q: 'My garment does not fit. Can I exchange it?',
        a: 'Yes! If the size does not fit, you can request a size exchange through the "My Orders" section within 5 days of receiving the item. If your requested size is out of stock, we will offer you a standard return option.',
      },
      {
        q: 'When will I receive my refund?',
        a: 'For Cancellations: Refunds are processed within 3 business days. For Returns: Refunds are initiated as soon as our courier partner successfully picks up the item from your location. Prepaid refunds reflect in your original payment source, while COD refunds are transferred to your provided bank account or UPI ID.',
      },
    ],
  },
];

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-8">
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="text-center space-y-3 pb-4">
        <div className="flex justify-center mb-2">
          <HelpCircle className="w-10 h-10 text-[#755b00]" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#0d1648]">Frequently Asked Questions</h1>
        <p className="text-xs text-[#767680] font-sans max-w-2xl mx-auto leading-relaxed">
          Welcome to the Drishti Fashions Help Desk! We have put together answers to the most common questions our
          shoppers ask. If you cannot find what you are looking for, feel free to reach out to our customer support
          team.
        </p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map(cat => (
          <div key={cat.heading}>
            <h2 className="font-serif text-xl font-bold text-[#0d1648] mb-3">{cat.heading}</h2>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const key = `${cat.heading}-${i}`;
                const isOpen = !!open[key];
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-[#c6c5d0]/30 shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                    >
                      <span className="text-sm font-bold text-[#0d1648] font-sans">{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#755b00] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-[#46464f] font-sans leading-relaxed">{item.a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#f4f2ff] rounded-2xl border border-[#c6c5d0]/40 p-6 sm:p-8 space-y-4 text-xs font-sans text-[#46464f]">
        <h3 className="font-serif text-lg font-bold text-[#0d1648]">Still Need Help?</h3>
        <p>If your question isn't answered here, our support team is happy to assist you:</p>
        <div className="space-y-2 text-[#181a2d]">
          <p className="flex items-start gap-2">
            <User className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
            <span>
              <strong>Name:</strong> Mr. Prakash{' '}
              <span className="text-[#767680]">— Designation:</span> Operations Head
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Mail className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
            <span>
              <strong>Email:</strong>{' '}
              <a href="mailto:info@drishtifashions.com" className="text-[#755b00] hover:underline">
                info@drishtifashions.com
              </a>
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Phone className="w-4 h-4 shrink-0 text-[#755b00] mt-0.5" />
            <span>
              <strong>Phone:</strong> +91 6290486090 (Monday to Saturday, 10:00 AM to 7:00 PM)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};