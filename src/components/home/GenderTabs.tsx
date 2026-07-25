import React from 'react';
import type { GenderCategory } from '../../types';

const TABS: { value: GenderCategory; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'MEN', label: 'Men' },
  { value: 'KIDS', label: 'Kids' },
];

interface GenderTabsProps {
  value: GenderCategory;
  onChange: (gender: GenderCategory) => void;
  className?: string;
}

/**
 * Maps onto the backend's `gender` filter on products and categories.
 *
 * Four pills at the desktop padding come to roughly 450px, so on a 360px
 * screen the pill row used to run off the side of the page. The tabs now share
 * the available width evenly below `sm` and only take their generous fixed
 * padding once there is room for it.
 */
export const GenderTabs: React.FC<GenderTabsProps> = ({ value, onChange, className = '' }) => (
  <div
    className={`flex w-full max-w-md sm:w-fit items-center justify-center gap-1 p-1 rounded-full bg-[#f4f2ff] border border-[#c6c5d0]/40 mx-auto ${className}`}
  >
    {TABS.map(tab => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        aria-pressed={value === tab.value}
        className={`flex-1 sm:flex-none min-w-0 px-2 sm:px-7 py-2 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider sm:tracking-widest font-sans transition-all ${
          value === tab.value
            ? 'bg-[#0d1648] text-[#fed255] shadow-md'
            : 'text-[#46464f] hover:text-[#0d1648] hover:bg-white'
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
