import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { ApiBanner } from '../../types';

interface PromoCardsProps {
  banners: ApiBanner[];
  onNavigate: (path: string) => void;
}

/**
 * Promotional tiles built from the non-hero banners the seller uploads in the
 * admin app. With none configured the section disappears rather than inventing
 * campaigns the store is not running.
 */
export const PromoCards: React.FC<PromoCardsProps> = ({ banners, onNavigate }) => {
  if (!banners.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      <div className={`grid grid-cols-1 gap-6 ${banners.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {banners.map(banner => (
          <div
            key={banner.id}
            className="relative rounded-xl overflow-hidden h-60 sm:h-72 shadow-xl group bg-[#0d1648]"
          >
            <img
              src={banner.imageUrl}
              alt={banner.title ?? 'Featured collection'}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1648]/90 via-[#0d1648]/60 to-transparent" />

            {/* Seller-authored copy of unknown length inside a fixed-height
                tile: clamped and gap-separated so a long subtitle pushes into
                the button instead of straight through it. */}
            <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between gap-3 text-white">
              <div className="min-h-0">
                {banner.title && (
                  <h3 className="font-serif text-xl sm:text-3xl font-bold drop-shadow-md line-clamp-2">
                    {banner.title}
                  </h3>
                )}
                {banner.subtitle && (
                  <p className="text-xs text-[#e0e0fb] mt-2 max-w-xs font-sans leading-relaxed line-clamp-3">
                    {banner.subtitle}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <button
                  onClick={() => onNavigate(banner.linkUrl || '/search')}
                  className="btn-primary text-[11px] sm:text-xs px-4 sm:px-5 py-2.5 inline-flex items-center gap-2 text-left"
                >
                  <span>{banner.linkText || 'Shop the Edit'}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
