import React, { useState } from 'react';
import { Check, Plus, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { CuttingPreferencesModal } from './CuttingPreferencesModal';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface ProductCardProps {
  product: Product;
  onAddedToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddedToCart }) => {
  const navigate = useNavigate();
  const { isTamil, language, t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(() => {
    return product.variants.find(v => v.isAvailable) || product.variants[0];
  });

  const isAvailable = product.isAvailable && product.variants.some(v => v.isAvailable);
  const isBestValue = selectedVariant ? api.isBestValueVariant(product, selectedVariant) : false;

  return (
    <>
      <article className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/80 overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
        {/* Photo Container */}
        <div
          onClick={() => navigate(`/product/${product.id}`)}
          className="relative aspect-[4/3] overflow-hidden bg-stone-100 cursor-pointer"
        >
          <img
            src={product.imageUrl}
            alt={product.nameEn}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/storefront.jpg';
            }}
          />

          {/* Badges on Image */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
            {product.isPopular && (
              <span className="px-2 py-0.5 rounded-full bg-raakky-red text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-md flex items-center gap-0.5 sm:gap-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{isTamil ? 'அதிக விருப்பம்' : 'Popular'}</span>
              </span>
            )}
            {isBestValue && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-md">
                {t('catalog.bestValue')}
              </span>
            )}
          </div>

          {!isAvailable && (
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2">
              <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg">
                {t('catalog.outOfStockBadge')}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
          <div className="space-y-1">
            <h3
              onClick={() => navigate(`/product/${product.id}`)}
              className="text-xs sm:text-base font-bold text-neutral-900 hover:text-raakky-red transition-colors cursor-pointer leading-snug line-clamp-1"
            >
              {isTamil ? product.nameTa : product.nameEn}
            </h3>
            <p className="hidden sm:block text-xs text-stone-500 leading-relaxed line-clamp-2">
              {isTamil ? product.shortDescTa : product.shortDescEn}
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3 pt-1.5 sm:pt-2 border-t border-stone-100">
            {/* Package selector pills - horizontally scrollable on mobile */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {product.variants.map(variant => {
                const isSelected = selectedVariant.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.isAvailable}
                    onClick={() => setSelectedVariant(variant)}
                    className={`whitespace-nowrap px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-0.5 sm:gap-1 ${
                      !variant.isAvailable
                        ? 'opacity-40 line-through bg-stone-100 text-stone-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <span>{formatWeight(variant.weightGrams, language)}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3] text-raakky-orange" />}
                  </button>
                );
              })}
            </div>

            {/* Price and CTA row */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5 sm:pt-1">
              <div className="min-w-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm sm:text-lg font-black text-raakky-red font-sans">
                    {formatCurrency(selectedVariant.price)}
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-stone-400 font-medium truncate">
                  {formatWeight(selectedVariant.weightGrams, language)}
                </p>
              </div>

              <button
                type="button"
                disabled={!isAvailable || !selectedVariant.isAvailable}
                onClick={() => setIsModalOpen(true)}
                className={`py-1.5 px-2 sm:py-2 sm:px-3.5 rounded-xl sm:rounded-2xl font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all shadow-2xs active:scale-95 flex-shrink-0 ${
                  !isAvailable || !selectedVariant.isAvailable
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                    : 'bg-raakky-red text-white hover:bg-raakky-red-dark hover:shadow-spicy'
                }`}
                aria-label={`Add ${product.nameEn} to cart`}
              >
                <Plus size={13} strokeWidth={3} />
                <span className="hidden xs:inline sm:inline">
                  {isTamil ? 'சேர்' : 'Add'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </article>

      <CuttingPreferencesModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddedSuccess={onAddedToCart}
      />
    </>
  );
};
