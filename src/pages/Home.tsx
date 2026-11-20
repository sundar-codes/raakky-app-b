import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  ExternalLink,
  Search,
  Store,
  Truck,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { Category, Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/products/ProductCard';
import { ProductSkeleton } from '../components/loaders/ProductSkeleton';
import { CategoryFilter, UNIFIED_MENU_FILTERS } from '../components/products/CategoryFilter';
import { PromoBannerCarousel } from '../components/home/PromoBannerCarousel';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t, isTamil } = useLanguage();
  const { isPaused, pauseReason, shopStatusState } = useShop();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fulfilmentMode, setFulfilmentMode] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (e) {
        console.error('Failed to load ordering data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Dynamic filter supporting the Single Unified Menu
  const displayedProducts = useMemo(() => {
    let list = products;

    // 1. Single Unified Menu Filter
    if (selectedCategory && selectedCategory !== '') {
      switch (selectedCategory) {
        case 'curry-cut':
          list = list.filter(
            p =>
              p.id === 'prod-curry-pieces' ||
              p.id === 'prod-biryani-cut' ||
              p.id === 'prod-with-bone' ||
              p.searchAliases.some(a => a.toLowerCase().includes('curry'))
          );
          break;
        case 'boneless':
          list = list.filter(
            p =>
              p.categoryId === 'cat-boneless' ||
              p.id === 'prod-breast' ||
              p.id === 'prod-boneless-mixed' ||
              p.id === 'prod-keema'
          );
          break;
        case 'leg-pieces':
          list = list.filter(
            p =>
              p.id === 'prod-leg' ||
              p.id === 'prod-thigh' ||
              p.searchAliases.some(a => a.toLowerCase().includes('leg') || a.toLowerCase().includes('drumstick'))
          );
          break;
        case '65-fry':
          list = list.filter(
            p =>
              p.id === 'prod-chicken-65-fry' ||
              p.searchAliases.some(a => a.toLowerCase().includes('65'))
          );
          break;
        case 'chukka':
          list = list.filter(
            p =>
              p.searchAliases.some(a => a.toLowerCase().includes('chukka') || a.toLowerCase().includes('sukka'))
          );
          break;
        case 'wings':
          list = list.filter(
            p =>
              p.id === 'prod-wings' ||
              p.id === 'prod-lollipop' ||
              p.searchAliases.some(a => a.toLowerCase().includes('wing') || a.toLowerCase().includes('lollipop'))
          );
          break;
        case 'cat-curry-chukka':
          list = list.filter(p => p.categoryId === 'cat-curry-chukka');
          break;
        case 'cat-bone-in':
          list = list.filter(p => p.categoryId === 'cat-bone-in');
          break;
        case 'cat-fry-cuts':
          list = list.filter(p => p.categoryId === 'cat-fry-cuts');
          break;
        case 'cat-liver-feet':
          list = list.filter(p => p.categoryId === 'cat-liver-feet');
          break;
        default:
          list = list.filter(p => p.categoryId === selectedCategory);
          break;
      }
    }

    // 2. Live Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const matchName =
          p.nameEn.toLowerCase().includes(q) ||
          p.nameTa.toLowerCase().includes(q) ||
          p.shortDescEn.toLowerCase().includes(q) ||
          p.shortDescTa.toLowerCase().includes(q);
        const matchAlias = p.searchAliases.some(a => a.toLowerCase().includes(q));
        return matchName || matchAlias;
      });
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const activeFilterLabel = useMemo(() => {
    if (!selectedCategory) return isTamil ? 'அனைத்து சிக்கன் வெட்டுகள்' : 'Fresh Daily Counter Cuts';
    const found = UNIFIED_MENU_FILTERS.find(f => f.id === selectedCategory);
    return isTamil ? (found?.nameTa || t('catalog.allCuts')) : (found?.nameEn || t('catalog.allCuts'));
  }, [selectedCategory, isTamil, t]);

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-2">
      {/* 1. TOP APP CONTEXT BAR (FULFILMENT MODE & STATUS) */}
      <section className="bg-white border-b border-stone-200/80 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Delivery / Pickup quick toggle */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex rounded-2xl bg-stone-100 p-1 border border-stone-200/80 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFulfilmentMode('delivery')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fulfilmentMode === 'delivery'
                    ? 'bg-white text-raakky-red shadow-xs'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                <Truck size={14} className={fulfilmentMode === 'delivery' ? 'text-raakky-red' : 'text-stone-500'} />
                <span>{isTamil ? 'வீட்டு டெலிவரி (~30 நிமிடம்)' : 'Home Delivery (~30 mins)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setFulfilmentMode('pickup')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  fulfilmentMode === 'pickup'
                    ? 'bg-white text-raakky-red shadow-xs'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                <Store size={14} className={fulfilmentMode === 'pickup' ? 'text-raakky-red' : 'text-stone-500'} />
                <span>{isTamil ? 'கடையில் பெற (~20 நிமிடம்)' : 'Store Pickup (~20 mins)'}</span>
              </button>
            </div>
          </div>

          {/* Right: Counter status & link to main website */}
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPaused
                    ? 'bg-amber-400 animate-pulse'
                    : shopStatusState === 'open'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-neutral-400'
                }`}
              />
              <span className="text-[11px] uppercase tracking-wider font-extrabold">
                {isPaused
                  ? t('common.orderPaused')
                  : shopStatusState === 'open'
                  ? (isTamil ? 'கடை திறந்துள்ளது' : 'Counter Open')
                  : (isTamil ? 'கடை மூடப்பட்டுள்ளது' : 'Counter Closed')}
              </span>
            </div>

            <div className="h-3 w-px bg-stone-300 hidden sm:block" />

            {/* External link to the separate display website */}
            <a
              href="https://raakky-chicken-website.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-500 hover:text-raakky-red transition-colors"
              title="Visit the informational brand website"
            >
              <span>{isTamil ? 'கடை இணையதளம்' : 'About & Store Info'}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>

      {/* 2. AUTO-SLIDING PROMO BANNER CAROUSEL (Moves Right to Left, Compact on Mobile) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
        <PromoBannerCarousel />
      </section>

      {/* 3. SHOP PAUSED CALLOUT IF COUNTER IS PAUSED BY APP A */}
      {isPaused && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex items-start gap-3">
            <Clock size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                {t('shopStatus.pausedTitle')}
              </h4>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                {isTamil ? pauseReason.ta : pauseReason.en}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. SEARCH BAR — POSITIONED DIRECTLY ABOVE THE PRODUCT CATALOG */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search size={17} className="absolute left-3.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isTamil ? 'குழம்பு வெட்டு, போன்லெஸ், லெக் பீஸ், 65 துண்டுகள் தேடவும்...' : 'Search for Curry Cut, Boneless, Leg Pieces, 65 Fry Cut...'}
              className="w-full pl-10 pr-24 py-2.5 sm:py-3 rounded-2xl bg-white border border-stone-200 text-xs sm:text-sm text-neutral-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-16 p-1 text-stone-400 hover:text-stone-600"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1 px-3 sm:px-4 py-1.5 bg-raakky-red hover:bg-raakky-red-dark text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {isTamil ? 'தேடு' : 'Search'}
            </button>
          </div>
        </form>
      </section>

      {/* 5. THE SINGLE UNIFIED MENU (NO SECOND MENU) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-2">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={catId => setSelectedCategory(catId)}
        />
      </section>

      {/* 6. PRIMARY DIRECT ORDERING GRID (2X2 IN MOBILE, 3-4 IN DESKTOP) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg sm:text-2xl font-black text-neutral-950 tracking-tight">
              {activeFilterLabel}
            </h2>
            <p className="text-[11px] sm:text-xs text-stone-500">
              {displayedProducts.length} {isTamil ? 'புதிய வெட்டுகள் கிடைக்கின்றன' : 'fresh cuts available'} • {isTamil ? 'அளவைத் தேர்ந்தெடுத்து உடனுக்குடன் ஆர்டர் செய்யவும்' : 'Select size and order fresh on demand'}
            </p>
          </div>

          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-raakky-red hover:underline flex items-center gap-1"
          >
            <span>{t('common.viewAll')}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductSkeleton key={idx} />
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-stone-200 p-6">
            <p className="text-sm font-bold text-neutral-800">
              {isTamil ? 'சிக்கன் வெட்டுகள் எதுவும் கிடைக்கவில்லை' : 'No chicken cuts found matching your filter'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 bg-raakky-red text-white text-xs font-bold rounded-xl"
            >
              {isTamil ? 'அனைத்து சிக்கன் பார்க்க' : 'Show All Cuts'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
