import React from 'react';

interface BrandStripsProps {
  /** Distinct brand names taken from the live catalogue. */
  brands: string[];
  onNavigate: (path: string) => void;
}

/**
 * Shortcut into the labels the store actually stocks — the names come from the
 * products themselves, so this can never advertise a brand we do not carry.
 */
export const BrandStrips: React.FC<BrandStripsProps> = ({ brands, onNavigate }) => {
  if (!brands.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      <div className="gold-gradient rounded-xl p-5 sm:p-6 text-[#0d1648] shadow-md flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
        <div className="min-w-0 text-center md:text-left">
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#755b00]">SHOP BY LABEL</p>
          <h3 className="font-serif text-xl sm:text-2xl font-bold">Brands in Our Atelier</h3>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-center md:justify-end gap-x-5 sm:gap-x-7 gap-y-2">
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => onNavigate(`/search?search=${encodeURIComponent(brand)}`)}
              className="group focus:outline-none"
            >
              <span className="font-serif font-bold text-sm sm:text-base tracking-tight block group-hover:underline">
                {brand}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
