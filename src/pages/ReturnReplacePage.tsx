import React, { useRef, useState } from 'react';
import { ArrowLeft, Camera, ImagePlus, Loader2, RefreshCw, RotateCcw, X } from 'lucide-react';
import { ErrorState, Spinner } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { orderApi } from '../lib/api';
import { errorMessage } from '../lib/apiClient';
import { formatCurrency } from '../lib/format';
import { mapOrder } from '../lib/mappers';
import { useAsync } from '../lib/useAsync';

interface ReturnReplacePageProps {
  orderId: string;
  onNavigate: (path: string) => void;
}

type RequestType = 'return' | 'replace';

/** Canned reasons, with free text for anything else. */
const REASONS = [
  'The size does not fit',
  'The item arrived damaged',
  'The wrong item was delivered',
  'The item differs from the description',
  'Quality is not as expected',
  'Other',
];

export const ReturnReplacePage: React.FC<ReturnReplacePageProps> = ({ orderId, onNavigate }) => {
  const { requestReturn, requestReplace, showToast } = useStore();

  const state = useAsync(() => orderApi.get(orderId), [orderId]);
  const order = state.data ? mapOrder(state.data) : null;

  const [requestType, setRequestType] = useState<RequestType>('return');
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await orderApi.uploadReturnEvidence(file);
        uploaded.push(url);
      }
      setEvidence(prev => [...prev, ...uploaded]);
    } catch (err) {
      showToast('Upload Failed', errorMessage(err, 'Could not upload that photo. Please try again.'), 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // "Other" carries no information on its own, so the note becomes required.
    if (selectedReason === 'Other' && !details.trim()) {
      showToast('Tell Us More', 'Please describe the problem so our team can help.', 'info');
      return;
    }

    const reason = details.trim() ? `${selectedReason} — ${details.trim()}` : selectedReason;

    setSubmitting(true);
    const ok =
      requestType === 'return'
        ? await requestReturn(order.id, reason, evidence)
        : await requestReplace(order.id, reason, evidence);
    setSubmitting(false);

    if (ok) onNavigate(`/orders/${order.id}`);
  };

  if (state.loading) return <Spinner label="Loading your order…" className="min-h-[50vh]" />;

  if (state.error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Order not found"
          message={state.error ?? 'We could not find this order in your history.'}
          onRetry={state.reload}
        />
      </div>
    );
  }

  // The backend only accepts these requests against a delivered order, so the
  // form is never shown for one that has not arrived yet.
  if (order.status !== 'delivered') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <ErrorState
          title="Not eligible yet"
          message="Returns and replacements can only be requested once the order has been delivered."
        />
        <div className="text-center">
          <button onClick={() => onNavigate(`/orders/${order.id}`)} className="btn-outline text-xs px-6 py-2.5">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (order.returnStatus) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#c6c5d0]/30">
          <h1 className="font-serif text-2xl font-bold text-[#0d1648]">Request Already Submitted</h1>
          <p className="text-xs text-[#767680] font-sans mt-2">
            A {order.returnStatus === 'replace_requested' ? 'replacement' : 'return'} request is already open for this
            order. Our team will contact you shortly.
          </p>
          <button
            onClick={() => onNavigate(`/orders/${order.id}`)}
            className="btn-primary text-xs px-6 py-2.5 mt-5"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => onNavigate(`/orders/${order.id}`)}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0d1648] hover:text-[#755b00] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#c6c5d0]/30 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0d1648]">Return or Replace</h1>
          <p className="text-xs text-[#767680] font-sans mt-1">
            This request covers the whole of order {order.orderNumber}.
          </p>
        </div>

        {/* Items in scope */}
        <div className="bg-[#f4f2ff] rounded-lg p-4 border border-[#c6c5d0]/30">
          <p className="text-[10px] font-bold text-[#755b00] uppercase tracking-wider mb-2">Items in this order</p>
          <ul className="space-y-1.5">
            {order.items.map(item => (
              <li key={item.id} className="flex justify-between gap-3 text-xs font-sans">
                <span className="min-w-0 text-[#0d1648] line-clamp-1">
                  {item.title} × {item.quantity}
                </span>
                <span className="text-[#46464f] shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Type */}
        <div>
          <span className="block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-2">
            What would you like to do?
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                { value: 'return', label: 'Return', hint: 'Send it back for a refund', icon: RotateCcw },
                { value: 'replace', label: 'Replace', hint: 'Swap it for the same piece', icon: RefreshCw },
              ] as const
            ).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRequestType(option.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  requestType === option.value
                    ? 'border-[#755b00] ring-1 ring-[#fed255] bg-[#fed255]/5'
                    : 'border-[#c6c5d0]/50 hover:border-[#755b00]'
                }`}
              >
                <option.icon className="w-4 h-4 text-[#755b00] mb-1.5" />
                <p className="text-sm font-semibold text-[#0d1648] font-sans">{option.label}</p>
                <p className="text-[11px] text-[#767680] font-sans mt-0.5">{option.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label
            htmlFor="return-reason"
            className="block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-2"
          >
            Reason
          </label>
          <select
            id="return-reason"
            value={selectedReason}
            onChange={e => setSelectedReason(e.target.value)}
            className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-2.5 text-sm text-[#181a2d] focus:outline-none focus:border-[#755b00]"
          >
            {REASONS.map(reason => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="return-details"
            className="block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-2"
          >
            Additional Details {selectedReason === 'Other' ? '(required)' : '(optional)'}
          </label>
          <textarea
            id="return-details"
            rows={4}
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Anything that will help us resolve this quickly…"
            className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg p-3.5 text-sm text-[#181a2d] placeholder-[#767680] focus:outline-none focus:border-[#755b00]"
          />
        </div>

        {/* Evidence photos */}
        <div>
          <span className="block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-2">
            Photos (optional)
          </span>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />

          {evidence.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {evidence.map((url, i) => (
                <div key={`${url}-${i}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#c6c5d0]/50 group">
                  <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setEvidence(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#c6c5d0] py-3 text-xs text-[#46464f] font-sans hover:border-[#755b00] hover:text-[#755b00] transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            <span>{uploading ? 'Uploading…' : 'Add a photo of the item'}</span>
          </button>
          <p className="text-[11px] text-[#767680] font-sans mt-1.5">
            <Camera className="inline w-3 h-3 mr-1" />
            Clear photos of the issue help our team approve your request faster.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3.5 text-xs tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{submitting ? 'SUBMITTING…' : `SUBMIT ${requestType.toUpperCase()} REQUEST`}</span>
        </button>
      </form>
    </div>
  );
};
