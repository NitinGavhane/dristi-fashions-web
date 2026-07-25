import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { Address, AddressInput, AddressType } from '../../types';
import { SELLER_STATE } from '../../lib/pricing';

/**
 * Indian states and union territories. The chosen state decides whether the
 * order is taxed CGST+SGST or IGST, so it is a fixed list rather than free text
 * — a typo would silently change the tax split.
 */
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const TYPES: AddressType[] = ['Home', 'Work', 'Other'];

interface AddressFormProps {
  /** Supply to edit; omit to create. */
  initial?: Address | null;
  defaultName?: string;
  defaultPhone?: string;
  /** Forced on when this is the customer's first address. */
  forceDefault?: boolean;
  submitLabel?: string;
  onSubmit: (data: AddressInput) => Promise<boolean> | Promise<void> | void;
  onCancel: () => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initial = null,
  defaultName = '',
  defaultPhone = '',
  forceDefault = false,
  submitLabel = 'Save Address',
  onSubmit,
  onCancel,
}) => {
  const [fullName, setFullName] = useState(initial?.fullName ?? defaultName);
  const [phone, setPhone] = useState(initial?.phone ?? defaultPhone);
  const [street, setStreet] = useState(initial?.street ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? SELLER_STATE);
  const [pincode, setPincode] = useState(initial?.pincode ?? '');
  const [type, setType] = useState<AddressType>(initial?.type ?? 'Home');
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? forceDefault);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !pincode.trim()) {
      setError('Please complete every field before saving.');
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Enter a valid 6-digit PIN code.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state,
        country: 'IN',
        pincode: pincode.trim(),
        type,
        isDefault: isDefault || forceDefault,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-lg px-3.5 py-2.5 text-sm text-[#181a2d] placeholder-[#767680] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]';
  const labelClass = 'block text-[11px] font-bold text-[#0d1648] uppercase tracking-wider font-sans mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label className={labelClass} htmlFor="addr-name">
            Full Name
          </label>
          <input id="addr-name" className={inputClass} value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div className="min-w-0">
          <label className={labelClass} htmlFor="addr-phone">
            Phone
          </label>
          <input
            id="addr-phone"
            className={inputClass}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            inputMode="tel"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="addr-street">
          Street Address
        </label>
        <input
          id="addr-street"
          className={inputClass}
          value={street}
          onChange={e => setStreet(e.target.value)}
          placeholder="House / flat, building, area"
        />
      </div>

      {/*
        `min-w-0` on every cell is load-bearing here. A grid track sizes to its
        content by default, and the state <select> is as wide as its longest
        option — "Dadra and Nagar Haveli and Daman and Diu" — which stretched
        the whole row past the form and out of the card.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="min-w-0">
          <label className={labelClass} htmlFor="addr-city">
            City
          </label>
          <input id="addr-city" className={inputClass} value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <div className="min-w-0">
          <label className={labelClass} htmlFor="addr-state">
            State
          </label>
          <select
            id="addr-state"
            className={`${inputClass} truncate`}
            value={state}
            onChange={e => setState(e.target.value)}
          >
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label className={labelClass} htmlFor="addr-pincode">
            PIN Code
          </label>
          <input
            id="addr-pincode"
            className={inputClass}
            value={pincode}
            onChange={e => setPincode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Address Type</span>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-4 py-2 rounded-md border text-xs font-semibold transition-all ${
                type === t
                  ? 'bg-[#0d1648] text-[#fed255] border-[#0d1648]'
                  : 'border-[#c6c5d0] text-[#0d1648] hover:border-[#755b00]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#46464f] font-sans cursor-pointer">
        <input
          type="checkbox"
          checked={isDefault || forceDefault}
          disabled={forceDefault}
          onChange={e => setIsDefault(e.target.checked)}
          className="w-4 h-4 accent-[#0d1648]"
        />
        <span>{forceDefault ? 'This will be your default delivery address' : 'Set as default delivery address'}</span>
      </label>

      {error && <p className="text-xs text-[#ba1a1a] font-sans">{error}</p>}

      {/* "Save & Use This Address" is long enough that the two buttons no
          longer fit side by side on a phone — they stack instead of clipping. */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-6 py-3 sm:py-2.5 text-xs inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />}
          <span>{submitLabel}</span>
        </button>
        <button type="button" onClick={onCancel} className="btn-outline px-6 py-3 sm:py-2.5 text-xs">
          Cancel
        </button>
      </div>
    </form>
  );
};
