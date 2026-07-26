import React, { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { CategoryChips } from '../components/home/CategoryChips';
import { GenderTabs } from '../components/home/GenderTabs';

import { BrandStrips } from '../components/home/BrandStrips';
import { OfferStrip } from '../components/home/OfferStrip';
import { PromoCards } from '../components/home/PromoCards';
import { ProductCard } from '../components/common/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/common/States';
import { useStore } from '../context/StoreContext';
import { catalogApi } from '../lib/api';
import { mapBannerToSlide, mapCategory, mapProduct, toApiGender } from '../lib/mappers';
import { useAsync } from '../lib/useAsync';
import type { Product } from '../types';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const MAX_TILES = 8;

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { selectedGender, setSelectedGender } = useStore();
  const gender = toApiGender(selectedGender);

  const home = useAsync(() => catalogApi.home(), []);
  const categories = useAsync(() => catalogApi.listCategories(), []);
  // The home endpoint carries featured/new lists too, but only with id, title
  // and price — the catalogue endpoint is what supplies stock, badges and
  // sizes, which the cards need.
  const featured = useAsync(() => catalogApi.listProducts({ featured: true, gender }), [gender]);
  const arrivals = useAsync(() => catalogApi.listProducts({ sort: 'newest', gender }), [gender]);

  const heroSlides = useMemo(
    () => (home.data?.banners ?? []).filter(b => b.section === 'hero').map(mapBannerToSlide),
    [home.data],
  );

  const promoBanners = useMemo(() => (home.data?.banners ?? []).filter(b => b.section !== 'hero'), [home.data]);

  const visibleCategories = useMemo(() => {
    const all = (categories.data ?? []).map(mapCategory);
    if (selectedGender === 'ALL') return all;
    // "Unisex" categories map to ALL, and they belong under every tab.
    return all.filter(c => c.gender === selectedGender || c.gender === 'ALL');
  }, [categories.data, selectedGender]);

  const featuredProducts = useMemo<Product[]>(
    () => (featured.data ?? []).map(mapProduct).slice(0, MAX_TILES),
    [featured.data],
  );

  const newArrivals = useMemo<Product[]>(() => {
    const all = (arrivals.data ?? []).map(mapProduct);
    // Featured pieces already have their own row above; don't repeat them.
    const featuredIds = new Set(featuredProducts.map(p => p.id));
    return all.filter(p => !featuredIds.has(p.id)).slice(0, MAX_TILES);
  }, [arrivals.data, featuredProducts]);

  const brands = useMemo(() => {
    const names = (arrivals.data ?? []).map(p => p.brand).filter((b): b is string => Boolean(b && b.trim()));
    return Array.from(new Set(names)).slice(0, 6);
  }, [arrivals.data]);

  const catalogueEmpty = !arrivals.loading && !arrivals.error && newArrivals.length === 0 && featuredProducts.length === 0;

  return (
    <div className="min-h-screen pb-16">
      {/* Same gutters as the sections below, so the hero's edges line up with
          the product grids instead of sitting 16px proud of them on desktop. */}
      <div className="px-4 sm:px-6 lg:px-8">
        <HeroCarousel slides={heroSlides} loading={home.loading} onNavigate={onNavigate} />
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <GenderTabs value={selectedGender} onChange={setSelectedGender} />
      </div>

      <CategoryChips categories={visibleCategories} loading={categories.loading} onNavigate={onNavigate} />

      <OfferStrip />

      {/* Featured */}
      {(featured.loading || featured.error || featuredProducts.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#c6c5d0]/30 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#755b00] text-xs font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4 fill-current text-[#fed255]" />
                <span>THE DRISTHI EDIT</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">Featured Creations</h2>
            </div>

            <button
              onClick={() => onNavigate('/search?featured=true')}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0d1648] hover:text-[#755b00] transition-colors"
            >
              <span>View All Featured</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {featured.loading ? (
            <ProductGridSkeleton count={4} />
          ) : featured.error ? (
            <ErrorState message={featured.error} onRetry={featured.reload} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </section>
      )}

      <PromoCards banners={promoBanners} onNavigate={onNavigate} />

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#c6c5d0]/30 gap-4">
          <div>
            <p className="text-[#755b00] text-xs font-bold uppercase tracking-widest mb-1">JUST IN</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0d1648]">New Arrivals</h2>
          </div>

          <button
            onClick={() => onNavigate('/search?sort=newest')}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0d1648] hover:text-[#755b00] transition-colors"
          >
            <span>Browse Full Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {arrivals.loading ? (
          <ProductGridSkeleton />
        ) : arrivals.error ? (
          <ErrorState message={arrivals.error} onRetry={arrivals.reload} />
        ) : catalogueEmpty ? (
          <EmptyState
            title="Nothing here just yet"
            message={
              selectedGender === 'ALL'
                ? 'The catalogue is currently empty. Please check back shortly.'
                : 'No pieces in this collection yet. Try another category.'
            }
            actionLabel={selectedGender === 'ALL' ? undefined : 'View Everything'}
            onAction={selectedGender === 'ALL' ? undefined : () => setSelectedGender('ALL')}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      <BrandStrips brands={brands} onNavigate={onNavigate} />
    </div>
  );
};
