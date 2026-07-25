import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '../components/common/States';
import { catalogApi, type ProductQuery } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { mapCategory, mapProduct } from '../lib/mappers';
import { useAsync } from '../lib/useAsync';
import type { GenderCategory } from '../types';

interface SearchPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'newest', label: 'New Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const PRICE_CAPS = [
  { value: 0, label: 'All Prices' },
  { value: 1000, label: `Under ${formatCurrency(1000)}` },
  { value: 2500, label: `Under ${formatCurrency(2500)}` },
  { value: 5000, label: `Under ${formatCurrency(5000)}` },
  { value: 10000, label: `Under ${formatCurrency(10000)}` },
];

const GENDERS: { value: GenderCategory; label: string }[] = [
  { value: 'ALL', label: 'All Genders' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'MEN', label: 'Men' },
  { value: 'KIDS', label: 'Kids' },
];

/** Debounces the search box so typing does not fire a request per keystroke. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const SearchPage: React.FC<SearchPageProps> = ({ currentPath, onNavigate }) => {
  const params = useMemo(() => {
    const queryString = currentPath.includes('?') ? currentPath.slice(currentPath.indexOf('?')) : '';
    return new URLSearchParams(queryString);
  }, [currentPath]);

  const [searchQuery, setSearchQuery] = useState(params.get('search') ?? '');
  const [categoryId, setCategoryId] = useState(params.get('category') ?? 'ALL');
  const [gender, setGender] = useState<GenderCategory>((params.get('gender')?.toUpperCase() as GenderCategory) || 'ALL');
  const [sort, setSort] = useState(params.get('sort') ?? 'newest');
  const [featuredOnly, setFeaturedOnly] = useState(params.get('featured') === 'true');
  const [maxPrice, setMaxPrice] = useState(0);

  // Re-sync when navigation changes the URL (a category chip, a header search).
  useEffect(() => {
    setSearchQuery(params.get('search') ?? '');
    setCategoryId(params.get('category') ?? 'ALL');
    setGender((params.get('gender')?.toUpperCase() as GenderCategory) || 'ALL');
    setSort(params.get('sort') ?? 'newest');
    setFeaturedOnly(params.get('featured') === 'true');
  }, [params]);

  const debouncedSearch = useDebounced(searchQuery);

  const categories = useAsync(() => catalogApi.listCategories(), []);

  // Filtering, sorting and search all happen server-side — the browser never
  // has to hold the whole catalogue to answer a query.
  const query: ProductQuery = useMemo(
    () => ({
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(categoryId !== 'ALL' ? { category: categoryId } : {}),
      ...(gender !== 'ALL' ? { gender: gender.toLowerCase() } : {}),
      ...(featuredOnly ? { featured: true } : {}),
      sort: sort as ProductQuery['sort'],
    }),
    [debouncedSearch, categoryId, gender, featuredOnly, sort],
  );

  const products = useAsync(() => catalogApi.listProducts(query), [JSON.stringify(query)]);

  const categoryOptions = useMemo(() => {
    const all = (categories.data ?? []).map(mapCategory);
    if (gender === 'ALL') return all;
    return all.filter(c => c.gender === gender || c.gender === 'ALL');
  }, [categories.data, gender]);

  // The backend has no price filter, so this narrows the returned page locally.
  const results = useMemo(() => {
    const mapped = (products.data ?? []).map(mapProduct);
    return maxPrice > 0 ? mapped.filter(p => p.price <= maxPrice) : mapped;
  }, [products.data, maxPrice]);

  const hasFilters = Boolean(searchQuery || categoryId !== 'ALL' || gender !== 'ALL' || featuredOnly || maxPrice > 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryId('ALL');
    setGender('ALL');
    setSort('newest');
    setFeaturedOnly(false);
    setMaxPrice(0);
    onNavigate('/search');
  };

  // A native <select> is intrinsically as wide as its longest option, and the
  // category names come from the seller — so it is capped and truncated rather
  // than allowed to push the filter row out of the card.
  const selectClass =
    'bg-[#f4f2ff] border border-[#c6c5d0] rounded-full px-3 py-1.5 text-xs text-[#0d1648] font-semibold focus:outline-none focus:border-[#755b00] max-w-full sm:max-w-[14rem] truncate';

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-8 border border-[#c6c5d0]/30">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by name, brand or collection…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#f4f2ff] border border-[#c6c5d0] rounded-full py-3.5 pl-11 sm:pl-12 pr-11 text-sm text-[#181a2d] placeholder-[#767680] focus:outline-none focus:border-[#755b00] focus:ring-1 focus:ring-[#fed255]"
          />
          {/* Centred rather than offset by a fixed `top`, so the icons stay put
              when the field grows to 16px on mobile. */}
          <Search className="w-5 h-5 text-[#767680] absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#767680] hover:text-[#181a2d]"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mt-4 pt-4 border-t border-[#c6c5d0]/30 text-xs">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-bold text-[#0d1648] uppercase tracking-wider text-[10px]">Filter By:</span>

            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={selectClass}>
              <option value="ALL">All Categories</option>
              {categoryOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={gender}
              onChange={e => {
                setGender(e.target.value as GenderCategory);
                // A category belongs to one gender; keeping it selected would
                // guarantee zero results.
                setCategoryId('ALL');
              }}
              className={selectClass}
            >
              {GENDERS.map(g => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>

            <select value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className={selectClass}>
              {PRICE_CAPS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFeaturedOnly(v => !v)}
              aria-pressed={featuredOnly}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                featuredOnly
                  ? 'bg-[#0d1648] text-[#fed255] border-[#0d1648]'
                  : 'bg-[#f4f2ff] text-[#0d1648] border-[#c6c5d0] hover:border-[#755b00]'
              }`}
            >
              Featured Only
            </button>

            {hasFilters && (
              <button
                onClick={clearAllFilters}
                className="text-[#ba1a1a] font-bold text-xs hover:underline flex items-center gap-1 sm:ml-2"
              >
                <X className="w-3.5 h-3.5 shrink-0" /> Clear All
              </button>
            )}
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-bold text-[#0d1648] uppercase tracking-wider text-[10px] flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#755b00]" /> Sort By:
            </span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="min-w-0 max-w-full truncate bg-[#0d1648] text-[#ffe08e] font-bold rounded-md px-3 py-1.5 text-xs focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!products.loading && !products.error && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-sans font-semibold text-[#0d1648]">
            Found <span className="text-[#755b00] font-bold">{results.length}</span>{' '}
            {results.length === 1 ? 'creation' : 'creations'}
          </p>
        </div>
      )}

      {products.loading ? (
        <ProductGridSkeleton />
      ) : products.error ? (
        <ErrorState message={products.error} onRetry={products.reload} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {results.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Search className="w-10 h-10" />}
          title="No creations found"
          message="Nothing matches your current search or filters. Try widening them."
          actionLabel={hasFilters ? 'Clear Filters & View Catalogue' : undefined}
          onAction={hasFilters ? clearAllFilters : undefined}
        />
      )}
    </div>
  );
};
