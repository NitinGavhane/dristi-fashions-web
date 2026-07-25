import React, { useMemo } from 'react';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { EmptyState, ErrorState } from '../components/common/States';
import { GenderTabs } from '../components/home/GenderTabs';
import { useStore } from '../context/StoreContext';
import { catalogApi } from '../lib/api';
import { PLACEHOLDER_IMAGE, mapCategory } from '../lib/mappers';
import { useAsync } from '../lib/useAsync';

interface CategoriesPageProps {
  onNavigate: (path: string) => void;
}

const GENDER_LABEL: Record<string, string> = {
  MEN: 'Menswear',
  WOMEN: 'Womenswear',
  KIDS: 'Kidswear',
  ALL: 'Unisex',
};

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ onNavigate }) => {
  const { selectedGender, setSelectedGender } = useStore();
  const categories = useAsync(() => catalogApi.listCategories(), []);

  const visible = useMemo(() => {
    const all = (categories.data ?? []).map(mapCategory);
    if (selectedGender === 'ALL') return all;
    return all.filter(c => c.gender === selectedGender || c.gender === 'ALL');
  }, [categories.data, selectedGender]);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="text-[10px] font-sans font-bold tracking-[0.3em] text-[#755b00] uppercase">
          THE DRISTHI COLLECTIONS
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#0d1648]">Explore by Category</h1>
        <p className="text-xs text-[#767680] font-sans leading-relaxed">
          Every collection in our atelier, straight from the catalogue.
        </p>
      </div>

      <GenderTabs value={selectedGender} onChange={setSelectedGender} />

      {categories.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl skeleton-shimmer" />
          ))}
        </div>
      ) : categories.error ? (
        <ErrorState message={categories.error} onRetry={categories.reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="w-10 h-10" />}
          title="No collections here yet"
          message="There are no categories in this department at the moment."
          actionLabel={selectedGender === 'ALL' ? 'Browse the Catalogue' : 'View All Departments'}
          onAction={() => (selectedGender === 'ALL' ? onNavigate('/search') : setSelectedGender('ALL'))}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visible.map(cat => (
            <button
              key={cat.id}
              // The products endpoint filters on category id, so that is what
              // the link carries.
              onClick={() => onNavigate(`/search?category=${cat.id}`)}
              className="group relative rounded-2xl overflow-hidden shadow-lg h-80 text-left border border-[#c6c5d0]/30 transition-transform duration-500 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#fed255]"
            >
              <img
                src={cat.imageUrl || PLACEHOLDER_IMAGE}
                alt={cat.name}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                }}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1648]/90 via-[#0d1648]/30 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="text-[10px] font-bold text-[#fed255] uppercase tracking-widest mb-1">
                  {GENDER_LABEL[cat.gender] ?? 'Collection'}
                </span>
                <h3 className="font-serif text-2xl font-bold">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-[#e0e0fb] font-sans mt-1 line-clamp-2">{cat.description}</p>
                )}

                <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#fed255] group-hover:underline">
                  <span>Browse Collection</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
