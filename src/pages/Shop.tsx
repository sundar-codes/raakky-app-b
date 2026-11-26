import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, X, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { ProductCard } from '../components/products/ProductCard';
import { CategoryFilter, UNIFIED_MENU_FILTERS } from '../components/products/CategoryFilter';
import { ProductSkeleton } from '../components/loaders/ProductSkeleton';
import { api } from '../services/api';
import { Category, Product } from '../types';

export const Shop: React.FC = () => {
  const { t, isTamil } = useLanguage();
  const { isPaused, pauseReason } = useShop();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load shop products:', err);
        setError('Failed to load live product catalogue. Please check connection.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Keep search params in sync
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat !== null && cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (!categoryId) {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryId);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val.trim()) {
      newParams.set('search', val.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchParams(new URLSearchParams());
  };

  // Filter & Sort Logic with Single Unified Filter Menu
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Unified filter matching
        if (selectedCategory) {
          switch (selectedCategory) {
            case 'curry-cut':
              if (
                p.id !== 'prod-curry-pieces' &&
                p.id !== 'prod-biryani-cut' &&
                p.id !== 'prod-with-bone' &&
                !(p.searchAliases || []).some((a) => a.toLowerCase().includes('curry'))
              ) {
                return false;
              }
              break;
            case 'boneless':
              if (
                p.categoryId !== 'cat-boneless' &&
                p.id !== 'prod-breast' &&
                p.id !== 'prod-boneless-mixed' &&
                p.id !== 'prod-keema'
              ) {
                return false;
              }
              break;
            case 'leg-pieces':
              if (
                p.id !== 'prod-leg' &&
                p.id !== 'prod-thigh' &&
                !(p.searchAliases || []).some((a) => a.toLowerCase().includes('leg') || a.toLowerCase().includes('drumstick'))
              ) {
                return false;
              }
              break;
            case '65-fry':
              if (
                p.id !== 'prod-chicken-65-fry' &&
                !(p.searchAliases || []).some((a) => a.toLowerCase().includes('65'))
              ) {
                return false;
              }
              break;
            case 'chukka':
              if (!(p.searchAliases || []).some((a) => a.toLowerCase().includes('chukka') || a.toLowerCase().includes('sukka'))) {
                return false;
              }
              break;
            case 'wings':
              if (
                p.id !== 'prod-wings' &&
                p.id !== 'prod-lollipop' &&
                !(p.searchAliases || []).some((a) => a.toLowerCase().includes('wing') || a.toLowerCase().includes('lollipop'))
              ) {
                return false;
              }
              break;
            case 'cat-curry-chukka':
              if (p.categoryId !== 'cat-curry-chukka') return false;
              break;
            case 'cat-bone-in':
              if (p.categoryId !== 'cat-bone-in') return false;
              break;
            case 'cat-fry-cuts':
              if (p.categoryId !== 'cat-fry-cuts') return false;
              break;
            case 'cat-liver-feet':
              if (p.categoryId !== 'cat-liver-feet') return false;
              break;
            default:
              if (p.categoryId !== selectedCategory) return false;
              break;
          }
        }
        // In stock filter
        const variants = Array.isArray(p.variants) ? p.variants : [];
        if (onlyInStock && (!p.isAvailable || !variants.some((v) => v.isAvailable))) {
          return false;
        }
        // Search filter (name, description, and search aliases)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchEn =
            (p.nameEn || '').toLowerCase().includes(q) ||
            (p.descriptionEn || '').toLowerCase().includes(q);
          const matchTa =
            (p.nameTa || '').toLowerCase().includes(q) ||
            (p.descriptionTa || '').toLowerCase().includes(q);
          const matchAliases = (p.searchAliases || []).some((alias) => alias.toLowerCase().includes(q));

          if (!matchEn && !matchTa && !matchAliases) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const getMinPrice = (prod: Product) => {
          const vs = Array.isArray(prod.variants) ? prod.variants : [];
          return vs.length > 0 ? Math.min(...vs.map((v) => v.price)) : 0;
        };
        if (sortBy === 'price-asc') return getMinPrice(a) - getMinPrice(b);
        if (sortBy === 'price-desc') return getMinPrice(b) - getMinPrice(a);
        if (sortBy === 'name') {
          const nameA = isTamil ? a.nameTa : a.nameEn;
          const nameB = isTamil ? b.nameTa : b.nameEn;
          return nameA.localeCompare(nameB);
        }
        // 'featured'
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return 0;
      });
  }, [products, selectedCategory, onlyInStock, searchQuery, sortBy, isTamil]);

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-4 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-raakky-orange/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-raakky-orange">
              <Sparkles className="h-3.5 w-3.5" />
              {isTamil ? 'புத்தம் புதிய பிராய்லர் சிக்கன்' : 'Fresh Daily Broiler Cuts'}
            </div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {t('nav.shop')}
            </h1>
            <p className="mt-1 text-sm text-stone-600 sm:text-base">
              {isTamil
                ? 'உங்கள் இல்லத்துக்கான புத்தம் புதிய பிராய்லர் சிக்கன் கறி வெட்டுகள். ஆர்டர் செய்த பின்னரே புதிதாக நறுக்கப்படுகிறது.'
                : '100% fresh broiler chicken cuts portioned and dressed on-order at our Press Colony counter.'}
            </p>
          </div>

          {/* Results Count */}
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            {filteredProducts.length} {isTamil ? 'பொருட்கள்' : 'items'}
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="mb-6 space-y-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('common.search')}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder-stone-400 transition-all focus:border-raakky-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-raakky-red/20"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="shop-sort" className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
                <SlidersHorizontal className="h-4 w-4 text-raakky-red" />
                <span className="hidden sm:inline">{isTamil ? 'வரிசைப்படுத்து:' : 'Sort by:'}</span>
              </label>
              <select
                id="shop-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-neutral-900 shadow-sm transition-all focus:border-raakky-red focus:outline-none focus:ring-2 focus:ring-raakky-red/20"
              >
                <option value="featured">{isTamil ? 'அதிக விருப்பம்' : 'Popular / Featured'}</option>
                <option value="price-asc">{isTamil ? 'விலை: குறைந்தது முதல்' : 'Price: Low to High'}</option>
                <option value="price-desc">{isTamil ? 'விலை: அதிகமானது முதல்' : 'Price: High to Low'}</option>
                <option value="name">{isTamil ? 'பெயர்' : 'Name'}</option>
              </select>
            </div>

            {/* In-Stock Filter Toggle */}
            <label className="flex cursor-pointer select-none items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-100">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-raakky-red focus:ring-raakky-red"
              />
              <span>{t('catalog.inStockOnly')}</span>
            </label>
          </div>

          {/* Active Filter Chips */}
          {(searchQuery || selectedCategory || onlyInStock) && (
            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
              <span className="text-xs font-semibold text-stone-500">
                {isTamil ? 'தேர்வு செய்தவை:' : 'Active filters:'}
              </span>

              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-raakky-red/10 px-2.5 py-1 text-xs font-bold text-raakky-red">
                  <span>
                    {isTamil
                      ? UNIFIED_MENU_FILTERS.find((f) => f.id === selectedCategory)?.nameTa || selectedCategory
                      : UNIFIED_MENU_FILTERS.find((f) => f.id === selectedCategory)?.nameEn || selectedCategory}
                  </span>
                  <button onClick={() => handleCategoryChange('')} aria-label="Remove category filter">
                    <X className="h-3 w-3 hover:text-red-800" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-stone-200 px-2.5 py-1 text-xs font-medium text-stone-800">
                  <span>"{searchQuery}"</span>
                  <button onClick={() => handleSearchChange('')} aria-label="Clear search query">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <span>{t('catalog.inStockOnly')}</span>
                  <button onClick={() => setOnlyInStock(false)} aria-label="Clear in stock filter">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={clearFilters}
                className="text-xs font-bold text-raakky-red hover:underline ml-auto"
              >
                {t('common.clear')} {t('common.viewAll')}
              </button>
            </div>
          )}
        </div>

        {/* Single Unified Filter Menu */}
        <div className="mb-6">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-stone-200/80 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-neutral-900">
              {t('catalog.noProductsFound')}
            </h3>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              {t('catalog.tryDifferentSearch')}
            </p>
            <button
              onClick={clearFilters}
              className="mt-6 rounded-2xl bg-raakky-red px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-raakky-red-dark"
            >
              {t('catalog.allCuts')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
