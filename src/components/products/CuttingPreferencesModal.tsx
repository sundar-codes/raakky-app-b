import React, { useState, useEffect } from 'react';
import { Check, Info, Minus, Plus, Scissors, ShoppingBag, X } from 'lucide-react';
import { CutType, CuttingPreference, Product, ProductVariant, SkinType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { api } from '../../services/api';

const CUT_LABELS: Record<CutType, { en: string; ta: string; descEn: string; descTa: string }> = {
  curry_medium: {
    en: 'Medium Curry Cut',
    ta: 'நடுத்தர குழம்பு வெட்டு',
    descEn: 'Standard pieces for family curries',
    descTa: 'குடும்பக் குழம்பிற்கு ஏற்ற துண்டுகள்',
  },
  curry_small: {
    en: 'Small Curry / Sukka Cut',
    ta: 'சிறிய குழம்பு / சுக்கா வெட்டு',
    descEn: 'Bite-sized pieces for quick gravy or sukka',
    descTa: 'சுக்கா மற்றும் கிரேவிக்கு சிறிய நறுக்கு',
  },
  chukka_cut: {
    en: 'Chukka Roast Cut',
    ta: 'சுக்கா வறுவல் துண்டுகள்',
    descEn: 'Neatly cut for spicy pan roasts',
    descTa: 'மசால் வறுவலுக்கு ஏற்ற வெட்டு',
  },
  fry_bite_size: {
    en: 'Chicken 65 Fry Cut',
    ta: 'சிக்கன் 65 வறுவல் துண்டுகள்',
    descEn: 'Bite-sized pieces (Plain unseasoned meat)',
    descTa: 'சிறிய துண்டுகள் (மசாலா சேர்க்கப்படாதது)',
  },
  drumstick_cut: {
    en: 'Whole Drumstick Cut',
    ta: 'முழு லெக் பீஸ் வெட்டு',
    descEn: 'Cleaned tender leg pieces',
    descTa: 'சுத்தம் செய்யப்பட்ட முழு லெக் பீஸ்',
  },
  wings_cut: {
    en: 'Fresh Wings Cut',
    ta: 'சிக்கன் விங்ஸ் வெட்டு',
    descEn: 'Separated cleaned wing portions',
    descTa: 'சுத்தம் செய்யப்பட்ட இறக்கை துண்டுகள்',
  },
  thigh_bone_in: {
    en: 'Bone-in Thigh Pieces',
    ta: 'எலும்புள்ள தொடைப் பகுதி',
    descEn: 'Juicy bone-in meat for rich flavour',
    descTa: 'சுவையான எலும்புள்ள தொடை கறி',
  },
  thigh_boneless: {
    en: 'Boneless Thigh Pieces',
    ta: 'எலும்பில்லாத தொடைப் பகுதி',
    descEn: 'Tender boneless thigh meat',
    descTa: 'எலும்பில்லா மென்மையான தொடை கறி',
  },
  boneless_cubes: {
    en: 'Boneless Cubes',
    ta: 'எலும்பில்லா க்யூப்ஸ்',
    descEn: 'Mixed breast and thigh meat cubes',
    descTa: 'மார்பு & தொடை கலந்த போன்லெஸ் கறி',
  },
  standard_cut: {
    en: 'Standard Butcher Cut',
    ta: 'வழக்கமான வெட்டு',
    descEn: 'Freshly portioned and cleaned',
    descTa: 'புதிதாக வெட்டி சுத்தம் செய்யப்பட்டது',
  },
};

interface CuttingPreferencesModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddedSuccess?: () => void;
}

export const CuttingPreferencesModal: React.FC<CuttingPreferencesModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddedSuccess,
}) => {
  const { t, isTamil, language } = useLanguage();
  const { addToCart } = useCart();
  const { showSuccess } = useNotification();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedCut, setSelectedCut] = useState<CutType>('curry_medium');
  const [selectedSkin, setSelectedSkin] = useState<SkinType>('skin_off');
  const [specialNote, setSpecialNote] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      const firstAvailable = product.variants.find(v => v.isAvailable) || product.variants[0];
      setSelectedVariant(firstAvailable || null);
      setSelectedCut(product.supportedCuts[0] || 'curry_medium');
      setSelectedSkin('skin_off');
      setSpecialNote('');
      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product || !selectedVariant) return null;

  const handleAddToCart = () => {
    if (!selectedVariant.isAvailable) return;

    const preference: CuttingPreference = {
      cutType: selectedCut,
      skinType: product.allowSkinSelection ? selectedSkin : 'skin_off',
      specialInstructions: specialNote.trim() || undefined,
    };

    addToCart({
      product,
      variant: selectedVariant,
      quantity,
      cuttingPreference: preference,
    });

    showSuccess(
      'Added to Cart',
      'கூடையில் சேர்க்கப்பட்டது',
      `${product.nameEn} (${formatWeight(selectedVariant.weightGrams, 'en')}) added`,
      `${product.nameTa} (${formatWeight(selectedVariant.weightGrams, 'ta')}) கூடையில் சேர்க்கப்பட்டது`
    );

    onClose();
    if (onAddedSuccess) onAddedSuccess();
  };

  const currentTotal = selectedVariant.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-stone-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-raakky-red/10 text-raakky-red flex items-center justify-center flex-shrink-0">
              <Scissors size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-sans tracking-tight">
                {t('cutting.title')}
              </h3>
              <p className="text-xs text-neutral-500 font-medium">
                {t('cutting.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Product Snapshot */}
          <div className="flex items-center gap-3.5 p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
            <img
              src={product.imageUrl}
              alt={product.nameEn}
              className="w-16 h-16 rounded-xl object-cover bg-stone-100 flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/storefront.jpg';
              }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-neutral-900 truncate">
                {isTamil ? product.nameTa : product.nameEn}
              </h4>
              <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                {isTamil ? product.shortDescTa : product.shortDescEn}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-extrabold text-raakky-red">
                  {formatCurrency(selectedVariant.price)}
                </span>
                <span className="text-xs text-stone-500">
                  {formatWeight(selectedVariant.weightGrams, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Important Plain Meat Notice for Chicken 65 */}
          {product.id === 'prod_65_fry_cut' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-amber-950 text-xs">
              <Info className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <span>{t('catalog.plainMeatNotice')}</span>
            </div>
          )}

          {/* 1. Package Size Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
              1. {t('catalog.selectWeight')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {product.variants.map(variant => {
                const isSelected = selectedVariant.id === variant.id;
                const isBestValue = api.isBestValueVariant(product, variant);

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.isAvailable}
                    onClick={() => setSelectedVariant(variant)}
                    className={`relative p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      !variant.isAvailable
                        ? 'opacity-50 border-neutral-200 bg-neutral-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-raakky-red bg-raakky-red/5 ring-1 ring-raakky-red shadow-xs'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    {isBestValue && (
                      <span className="absolute -top-2 right-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                        {t('catalog.bestValue')}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        {formatWeight(variant.weightGrams, language)}
                      </span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-raakky-red text-white flex items-center justify-center">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-raakky-red">
                        {formatCurrency(variant.price)}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {isTamil ? variant.weightLabelTa : variant.weightLabelEn}
                      </span>
                    </div>
                    {!variant.isAvailable && (
                      <span className="text-[10px] text-red-600 font-bold mt-1">
                        {t('catalog.outOfStockBadge')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Cutting Style Options */}
          {product.supportedCuts && product.supportedCuts.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                2. {t('cutting.cutTypeTitle')}
              </label>
              <div className="space-y-2">
                {product.supportedCuts.map(cut => {
                  const isSelected = selectedCut === cut;
                  const cutInfo = CUT_LABELS[cut];
                  const label = isTamil ? cutInfo?.ta : cutInfo?.en;
                  const desc = isTamil ? cutInfo?.descTa : cutInfo?.descEn;

                  return (
                    <button
                      key={cut}
                      type="button"
                      onClick={() => setSelectedCut(cut)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-raakky-red bg-raakky-red/5 ring-1 ring-raakky-red'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-neutral-800">
                          {label || cut}
                        </div>
                        {desc && (
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            {desc}
                          </div>
                        )}
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-raakky-red bg-raakky-red text-white'
                            : 'border-neutral-300'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Skin Preference (Only if product allows skin selection) */}
          {product.allowSkinSelection && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5">
                3. {t('cutting.skinTitle')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedSkin('skin_off')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedSkin === 'skin_off'
                      ? 'border-raakky-red bg-raakky-red/5 ring-1 ring-raakky-red'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-900">
                      {isTamil ? 'தோல் நீக்கியது' : 'Skinless'}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {isTamil ? 'குழம்பிற்கு சிறந்தது' : 'Recommended'}
                    </p>
                  </div>
                  {selectedSkin === 'skin_off' && (
                    <div className="w-4 h-4 rounded-full bg-raakky-red text-white flex items-center justify-center">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSkin('skin_on')}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedSkin === 'skin_on'
                      ? 'border-raakky-red bg-raakky-red/5 ring-1 ring-raakky-red'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-neutral-900">
                      {isTamil ? 'தோலுடன்' : 'Skin-on'}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {isTamil ? 'வறுவலுக்கு சுவை' : 'Rich for roasts'}
                    </p>
                  </div>
                  {selectedSkin === 'skin_on' && (
                    <div className="w-4 h-4 rounded-full bg-raakky-red text-white flex items-center justify-center">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 4. Special Note */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              {t('cutting.specialNotes')}
            </label>
            <input
              type="text"
              value={specialNote}
              onChange={e => setSpecialNote(e.target.value)}
              placeholder={t('cutting.notesPlaceholder')}
              maxLength={120}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-100 bg-stone-50 flex items-center gap-3">
          <div className="flex items-center border border-neutral-200 rounded-2xl bg-white shadow-xs p-1">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 transition-opacity"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="px-3 text-sm font-extrabold text-neutral-900 select-none">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => Math.min(10, q + 1))}
              disabled={quantity >= 10}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 transition-opacity"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant.isAvailable}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white flex items-center justify-between shadow-spicy transition-all ${
              !selectedVariant.isAvailable
                ? 'bg-neutral-300 cursor-not-allowed shadow-none'
                : 'bg-raakky-red hover:bg-raakky-red-dark active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={17} />
              <span>{t('cutting.confirm')}</span>
            </div>
            <span className="text-xs sm:text-sm font-extrabold bg-white/20 px-2 py-0.5 rounded-lg">
              {formatCurrency(currentTotal)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
