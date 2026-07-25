import React from 'react';
import type { Category } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../lib/mappers';

interface CategoryChipsProps {
  categories: Category[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

/** Live categories from the backend; the seller controls the list and imagery. */
export const CategoryChips: React.FC<CategoryChipsProps> = ({ categories, loading, onNavigate }) => {
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 my-8">
        <div className="flex gap-6 overflow-hidden py-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full skeleton-shimmer" />
              <div className="w-16 h-3 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0d1648]">Curated Categories</h2>
          <p className="text-xs text-[#767680] font-sans">Explore the collections in our atelier</p>
        </div>
        <button
          onClick={() => onNavigate('/categories')}
          className="shrink-0 text-xs font-semibold text-[#755b00] hover:underline uppercase tracking-wider"
        >
          View All
        </button>
      </div>

      <div className="flex items-start gap-4 sm:gap-6 scroll-rail no-scrollbar py-2 px-1">
        {categories.map(cat => (
          <button
            key={cat.id}
            // Filtering is by category id — the backend matches on category_id,
            // not the display name.
            onClick={() => onNavigate(`/search?category=${cat.id}`)}
            className="group flex flex-col items-center shrink-0 text-center transition-transform hover:-translate-y-1 focus:outline-none w-20 sm:w-24 snap-start"
          >
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#fed255] via-[#c6c5d0] to-[#755b00] group-hover:scale-105 transition-all shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                <img
                  src={cat.imageUrl || PLACEHOLDER_IMAGE}
                  alt={cat.name}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>
            <span className="text-xs font-semibold text-[#0d1648] mt-2 group-hover:text-[#755b00] transition-colors font-sans line-clamp-2">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
