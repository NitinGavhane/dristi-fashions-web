import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Mail, MessageSquare, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { contactApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

const SUBJECTS = [
  'Order enquiry',
  'Delivery or tracking',
  'Return or replacement',
  'Product question',
  'Payment or invoice',
  'Something else',
];

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { user, showToast } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  // Signed-in customers should not retype what we already know.
  useEffect(() => {
    if (!user) return;
    setName(prev => prev || user.fullName);
    setEmail(prev => prev || user.email);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setSending(true);
    try {
      const ack = await contactApi.send({
        fullName: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });
      setSubmitted(true);
      showToast('Message Sent', ack.message || 'Thank you — we have received your message.', 'success');
    } catch (err) {
      showToast('Could Not Send Message', errorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribing(true);
    try {
      const ack = await contactApi.subscribe(newsletterEmail.trim());
      showToast('Subscribed', ack.message || 'You are on the list. Welcome!', 'success');
      setNewsletterEmail('');
    } catch (err) {
      showToast('Could Not Subscribe', errorMessage(err), 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const inputClass =
    'w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-2.5 text-sm text-[#181a2d] placeholder-[#767680] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]';
  const labelClass = 'block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-1.5';

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#755b00] uppercase">
          CUSTOMER CARE
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#0d1648]">We Would Love to Hear from You</h1>
        <p className="text-xs text-[#767680] font-sans max-w-xl mx-auto leading-relaxed">
          Questions about an order, a piece, or a return — send us a message and our team will get back to you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-10 shadow-xl border border-[#c6c5d0]/30 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#0d1648]">Send Us a Message</h2>

          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-[#2e7d32] mx-auto" />
              <h3 className="font-serif text-xl font-bold text-[#0d1648]">Message received</h3>
              <p className="text-xs text-[#767680] font-sans max-w-sm mx-auto leading-relaxed">
                Thank you, {name}. Our team will reply to {email} as soon as possible.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="btn-outline text-xs px-6 py-2.5"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="contact-name">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="contact-email">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-subject">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className={inputClass}
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className={inputClass}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{sending ? 'SENDING…' : 'SEND MESSAGE'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Side */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0d1648] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#fed255]/30 space-y-4">
            <h3 className="font-serif text-xl font-bold">Stay in the Loop</h3>
            <p className="text-xs text-[#e0e0fb] font-sans leading-relaxed">
              Subscribe for new arrivals and collection news. Unsubscribe any time.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0d1648]/80 border border-[#c6c5d0]/30 rounded-lg px-4 py-3 pl-10 text-sm text-white placeholder-[#767680] focus:outline-none focus:border-[#fed255]"
                  required
                />
                <Mail className="w-4 h-4 text-[#ffe08e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={subscribing}
                className="btn-primary w-full py-3 text-[11px] font-bold tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {subscribing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{subscribing ? 'SUBSCRIBING…' : 'SUBSCRIBE'}</span>
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#c6c5d0]/30 space-y-3">
            <MessageSquare className="w-5 h-5 text-[#755b00]" />
            <h3 className="font-serif text-lg font-bold text-[#0d1648]">Already Placed an Order?</h3>
            <p className="text-xs text-[#767680] font-sans leading-relaxed">
              Tracking, invoices and return requests all live in your orders — often faster than writing to us.
            </p>
            <button onClick={() => onNavigate('/orders')} className="btn-outline text-[11px] px-5 py-2.5">
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
