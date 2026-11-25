import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Clock,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronRight,
  Zap,
  Scale,
  Truck,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useShop } from '../contexts/ShopContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency, formatWeight } from '../utils/formatters';
import { Product, ProductVariant, CutType, SkinType, CuttingPreference } from '../types';
import { api } from '../services/api';

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

// Reusable Butcher Guarantee Card (Screenshot 2: shown below image on desktop, below options on mobile)
const ButcherGuaranteeCard: React.FC<{ settings: any; isTamil: boolean }> = ({ settings, isTamil }) => (
  <div className="rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
    <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
      <div className="w-7 h-7 rounded-lg bg-raakky-orange/10 flex items-center justify-center text-raakky-orange flex-shrink-0">
        <ShieldCheck size={16} />
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
          {isTamil ? 'ராக்கி சிக்கன் தர உத்தரவாதம்' : 'Raakky Fresh Guarantee'}
        </h3>
        <p className="text-[10px] text-stone-500">
          {isTamil ? 'திருவள்ளுவர் நகர், பிரஸ் காலனி, கோவை' : 'Press Colony Counter, Coimbatore'}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 text-xs">
      {/* 1. Fresh on-order */}
      <div className="flex items-start gap-2.5">
        <Clock size={15} className="text-raakky-red mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-bold text-neutral-900 text-[11px]">
            {isTamil ? 'நேரடி வெட்டு (உறைந்தது அல்ல)' : 'Cut Fresh On-Order'}
          </div>
          <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
            {isTamil ? 'ஆர்டர் உறுதி செய்யப்பட்ட பின்னரே நறுக்கப்படும்.' : 'Never pre-cut or frozen. Prepared fresh after confirmation.'}
          </div>
        </div>
      </div>

      {/* 2. Weight verification */}
      <div className="flex items-start gap-2.5">
        <Scale size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-bold text-neutral-900 text-[11px]">
            {isTamil ? 'நிகர எடை உறுதி' : 'Verified Counter Weight'}
          </div>
          <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
            {isTamil ? 'தோல் நீக்கி சுத்தம் செய்த துல்லிய எடை.' : 'Cleaned & trimmed net weight on certified scales.'}
          </div>
        </div>
      </div>

      {/* 3. Delivery speed */}
      <div className="flex items-start gap-2.5">
        <Truck size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-bold text-neutral-900 text-[11px]">
            {isTamil ? 'ஹோம் டெலிவரி & நேரடி பிக்கப்' : 'Fast Delivery & Counter Pickup'}
          </div>
          <div className="text-[10px] text-stone-500 leading-tight mt-0.5">
            {isTamil ? '~30 நிமிட டெலிவரி • 15 நிமிட கவுண்டர் பிக்கப்' : '~30-40 mins delivery in 4 localities • 15 mins store pickup.'}
          </div>
        </div>
      </div>

      {/* 4. Contact Phone for special cuts */}
      <div className="flex items-start gap-2.5 pt-1 border-t border-stone-100">
        <Phone size={14} className="text-stone-500 mt-0.5 flex-shrink-0" />
        <div className="text-[10px] text-stone-600 leading-tight">
          <span className="font-bold">{isTamil ? 'சிறப்பு வெட்டு உதவி:' : 'Custom cuts & party orders:'}</span>{' '}
          <a href={`tel:${settings?.storePhone || '+919843599030'}`} className="font-bold text-raakky-red hover:underline">
            {settings?.storePhone || '+91 98435 99030'}
          </a>
        </div>
      </div>
    </div>
  </div>
);

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isTamil, language } = useLanguage();
  const { isPaused, settings } = useShop();
  const { addToCart } = useCart();
  const { showSuccess } = useNotification();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Cutting preferences state
  const [cutType, setCutType] = useState<CutType>('curry_medium');
  const [skinType, setSkinType] = useState<SkinType>('skin_off');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Quantity
  const [quantity, setQuantity] = useState(1);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const prod = await api.getProductById(id);
        if (prod) {
          setProduct(prod);
          const defaultVariant = prod.variants.find((v: ProductVariant) => v.isAvailable) || prod.variants[0];
          setSelectedVariant(defaultVariant);
          if (prod.supportedCuts && prod.supportedCuts.length > 0) {
            setCutType(prod.supportedCuts[0]);
          }
        }
      } catch (e) {
        console.error('Failed to load product detail:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-raakky-red border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-raakky-red">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          {isTamil ? 'இறைச்சி வகை கிடைக்கவில்லை' : 'Product Not Found'}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {isTamil
            ? 'நீங்கள் தேடிய சிக்கன் வகை தற்போது பட்டியலில் இல்லை.'
            : 'The chicken cut you requested is currently unavailable in the catalogue.'}
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isTamil ? 'அனைத்து சிக்கன் பார்க்க' : 'Back to Shop'}</span>
        </Link>
      </div>
    );
  }

  const name = isTamil ? product.nameTa : product.nameEn;
  const description = isTamil ? product.descriptionTa : product.descriptionEn;
  const currentPrice = selectedVariant ? selectedVariant.price * quantity : 0;
  const isAvailable = product.isAvailable && (selectedVariant?.isAvailable ?? false) && !isPaused;

  const getCuttingPreference = (): CuttingPreference => ({
    cutType,
    skinType: product.allowSkinSelection ? skinType : 'skin_off',
    specialInstructions: specialInstructions.trim() || undefined,
  });

  const getCleanWeightSubtitle = (labelEn: string, labelTa: string) => {
    const target = isTamil ? labelTa : labelEn;
    const match = target.match(/\((.*?)\)/);
    return match ? match[1] : target;
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !isAvailable) return;

    addToCart({
      product,
      variant: selectedVariant,
      quantity,
      cuttingPreference: getCuttingPreference(),
    });

    setIsAddedSuccess(true);
    showSuccess(
      'Added to Cart',
      'கூடையில் சேர்க்கப்பட்டது',
      `${product.nameEn} (${formatWeight(selectedVariant.weightGrams, 'en')}) added`,
      `${product.nameTa} (${formatWeight(selectedVariant.weightGrams, 'ta')}) கூடையில் சேர்க்கப்பட்டது`
    );

    setTimeout(() => setIsAddedSuccess(false), 2200);
  };

  const handleOrderNow = () => {
    if (!selectedVariant || !isAvailable) return;

    // Direct 1-Click to Checkout
    addToCart({
      product,
      variant: selectedVariant,
      quantity,
      cuttingPreference: getCuttingPreference(),
    });

    navigate('/checkout');
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 sm:pb-16 pt-0 sm:pt-4 md:py-6">
      <div className="mx-auto max-w-6xl px-0 sm:px-6 lg:px-8">
        
        {/* Desktop Breadcrumb Navigation */}
        <div className="hidden sm:flex mb-4 items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 transition-colors hover:text-raakky-red"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>{t('common.back')}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Link to="/" className="hover:text-raakky-red transition-colors">{t('nav.home')}</Link>
            <ChevronRight size={13} />
            <Link to="/shop" className="hover:text-raakky-red transition-colors">{t('nav.shop')}</Link>
            <ChevronRight size={13} />
            <span className="font-bold text-neutral-800 truncate">{name}</span>
          </div>
        </div>

        {/* 2-COLUMN BALANCED DESKTOP & IMMERSIVE MOBILE GRID */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-8 lg:grid-cols-12 items-start">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: HERO IMAGE + RICH BUTCHER COUNTER GUARANTEES     */}
          {/* Large, high-clarity immersive image on mobile and desktop      */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-3 sm:space-y-4">
            
            {/* Product Image Card: Generous height and uncropped crisp aspect ratio */}
            <div className="relative h-72 xs:h-80 sm:h-96 lg:h-[400px] overflow-hidden rounded-b-3xl sm:rounded-3xl border-b sm:border border-stone-200/80 bg-neutral-900 shadow-sm">
              <img
                src={product.imageUrl}
                alt={name}
                className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/storefront.jpg';
                }}
              />

              {/* Gradient scrim at top for back button contrast on mobile */}
              <div className="sm:hidden absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none z-10" />

              {/* Mobile Back Button (Floats cleanly over top-left of hero image) */}
              <div className="sm:hidden absolute top-4 left-4 z-20">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-900 hover:text-raakky-red active:scale-95 transition-all border border-stone-200/60"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              {/* Badges on Image */}
              <div className="absolute left-2.5 bottom-2.5 flex flex-wrap gap-1.5 z-10">
                {product.isPopular && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-raakky-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>{isTamil ? 'அதிக விருப்பம்' : 'Popular'}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-md">
                  <span>{isTamil ? 'பிராய்லர் சிக்கன்' : 'Broiler Chicken'}</span>
                </span>
              </div>

              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs z-20">
                  <span className="rounded-2xl bg-white px-4 py-2 font-heading text-xs font-extrabold uppercase tracking-wider text-red-600 shadow-xl">
                    {isPaused ? t('common.orderPaused') : t('common.outOfStock')}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Only: BUTCHER COUNTER ASSURANCE CARD (Screenshot 2: fills empty space below photo) */}
            <div className="hidden lg:block">
              <ButcherGuaranteeCard settings={settings} isTamil={isTamil} />
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: COMPACT SELECTORS & ABOVE-THE-FOLD ORDER ACTIONS */}
          {/* Screenshot 1 is immediately below hero image on mobile         */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 space-y-3 px-3 sm:px-0">
            <div className="rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
              
              {/* Product Header & Live Price */}
              <div className="border-b border-stone-100 pb-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-raakky-orange/10 text-raakky-orange text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                    {isTamil ? 'புத்தம் புதிய கறி வெட்டு' : 'Fresh Butcher Cut'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {isTamil ? 'பிராய்லர் கறி' : 'Broiler Chicken Only'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2 pt-0.5">
                  <h1 className="font-heading text-base sm:text-xl font-black tracking-tight text-neutral-950 leading-tight">
                    {name}
                  </h1>
                  {selectedVariant && (
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="font-heading text-lg sm:text-2xl font-black text-raakky-red leading-none">
                        {formatCurrency(selectedVariant.price)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-stone-500 font-semibold">
                        / {formatWeight(selectedVariant.weightGrams, language)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs leading-relaxed text-stone-600 line-clamp-2">
                  {description}
                </p>
              </div>

              {/* Contextual Notices if Chicken 65 or piece notes */}
              {product.id === 'prod-65-fry-cut' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-2 flex items-start gap-2 text-amber-950 text-[11px] leading-tight">
                  <Info className="h-3.5 w-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{isTamil ? 'கவனிக்க:' : 'Plain Meat:'}</span>{' '}
                    <span>{t('catalog.plainMeatNotice')}</span>
                  </div>
                </div>
              )}

              {product.approxWeightPerPiece && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 flex items-start gap-2 text-stone-700 text-[11px] leading-tight">
                  <Info className="h-3.5 w-3.5 text-raakky-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{isTamil ? 'துண்டு எடை:' : 'Piece Weight:'}</span>{' '}
                    <span>
                      {isTamil
                        ? (product.approxWeightPerPiece.noteTa || `சுமார் ${product.approxWeightPerPiece.minGrams} முதல் ${product.approxWeightPerPiece.maxGrams} கிராம் ஒரு துண்டு.`)
                        : (product.approxWeightPerPiece.noteEn || `Approx. ${product.approxWeightPerPiece.minGrams}g – ${product.approxWeightPerPiece.maxGrams}g per piece.`)}
                    </span>
                  </div>
                </div>
              )}

              {/* 1. PACKAGE SIZE SELECTOR (Compact Segmented Pills) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-raakky-red text-white text-[9px] font-black flex items-center justify-center">1</span>
                    <span>{t('catalog.selectWeight')}</span>
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {isTamil ? 'பேக் அளவு' : 'Pack size'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isBestValue = api.isBestValueVariant(product, v);
                    const subtitle = getCleanWeightSubtitle(v.weightLabelEn, v.weightLabelTa);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={!v.isAvailable}
                        onClick={() => setSelectedVariant(v)}
                        className={`relative flex flex-col items-center justify-center rounded-xl border py-1.5 px-2 text-center transition-all ${
                          isSelected
                            ? 'border-2 border-raakky-red bg-raakky-red/5 ring-1 ring-raakky-red/20 shadow-2xs'
                            : v.isAvailable
                            ? 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98]'
                            : 'cursor-not-allowed border-stone-200 bg-stone-100 opacity-50'
                        }`}
                      >
                        {isBestValue && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-1.5 py-0 text-[7px] font-black uppercase text-white whitespace-nowrap shadow-2xs">
                            {t('catalog.bestValue')}
                          </span>
                        )}

                        <span className="font-heading text-xs sm:text-sm font-black text-neutral-900 leading-tight">
                          {formatWeight(v.weightGrams, language)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-stone-400 font-medium leading-none">
                            {subtitle}
                          </span>
                          <span className="font-heading text-[11px] font-black text-raakky-red leading-none">
                            {formatCurrency(v.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. CUTTING STYLE (Compact Horizontal Pills / Chips) */}
              {product.supportedCuts && product.supportedCuts.length > 0 && (
                <div className="space-y-1.5 border-t border-stone-100 pt-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-raakky-red text-white text-[9px] font-black flex items-center justify-center">2</span>
                      <Scissors className="h-3 w-3 text-raakky-orange" />
                      <span>{t('cutting.cutTypeTitle')}</span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {product.supportedCuts.map((cut) => {
                      const isSelected = cutType === cut;
                      const cutInfo = CUT_LABELS[cut];
                      const label = isTamil ? cutInfo?.ta : cutInfo?.en;

                      return (
                        <button
                          key={cut}
                          type="button"
                          onClick={() => setCutType(cut)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-2 border-raakky-red bg-raakky-red/5 text-raakky-red font-black shadow-2xs'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                          }`}
                        >
                          <span className="text-[11px]">{label || cut}</span>
                          {isSelected && <Check className="h-3 w-3 stroke-[3] text-raakky-red" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. SKIN PREFERENCE (Compact 2-Button Toggle) */}
              {product.allowSkinSelection && (
                <div className="space-y-1.5 border-t border-stone-100 pt-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-raakky-red text-white text-[9px] font-black flex items-center justify-center">3</span>
                      <span>{t('cutting.skinTitle')}</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSkinType('skin_off')}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-left transition-all ${
                        skinType === 'skin_off'
                          ? 'border-2 border-raakky-red bg-raakky-red/5 text-raakky-red font-black shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">
                        {isTamil ? 'தோல் நீக்கியது' : 'Skinless (Skin-off)'}
                      </span>
                      {skinType === 'skin_off' && <Check className="h-3 w-3 stroke-[3] text-raakky-red" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSkinType('skin_on')}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-left transition-all ${
                        skinType === 'skin_on'
                          ? 'border-2 border-raakky-red bg-raakky-red/5 text-raakky-red font-black shadow-2xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">
                        {isTamil ? 'தோலுடன்' : 'With Skin (Skin-on)'}
                      </span>
                      {skinType === 'skin_on' && <Check className="h-3 w-3 stroke-[3] text-raakky-red" />}
                    </button>
                  </div>
                </div>
              )}

              {/* 4. SPECIAL INSTRUCTIONS (Compact Micro Input) */}
              <div className="border-t border-stone-100 pt-2">
                <input
                  type="text"
                  maxLength={100}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder={isTamil ? 'குறிப்புகள் (எ.கா. சிறிய துண்டுகளாக வெட்டவும்)' : 'Cutting instructions (e.g. small pieces, clean fat)'}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs text-neutral-900 placeholder-stone-400 focus:border-raakky-red focus:bg-white focus:outline-none focus:ring-1 focus:ring-raakky-red"
                />
              </div>

              {/* IN-CARD ACTION BLOCK: QUANTITY STEPPER + DUAL BUTTONS ("Add to Cart" AND "Order Now") */}
              {/* Visible on Desktop only. Hidden on mobile because the floating sticky bottom bar handles it! */}
              <div className="hidden sm:block border-t border-stone-200 pt-3">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  {/* Stepper */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-stone-600">
                      {isTamil ? 'எண்ணிக்கை:' : 'Qty:'}
                    </span>
                    <div className="inline-flex items-center rounded-xl border border-stone-200 bg-stone-50 p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1 || !isAvailable}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-neutral-900 shadow-2xs transition-all hover:bg-stone-100 active:scale-95 disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-heading text-xs font-black text-neutral-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= 10 || !isAvailable}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-neutral-900 shadow-2xs transition-all hover:bg-stone-100 active:scale-95 disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Calculated Price */}
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block leading-tight">
                      {t('common.total')}
                    </span>
                    <div className="font-heading text-lg sm:text-xl font-black text-raakky-red leading-tight">
                      {formatCurrency(currentPrice)}
                    </div>
                  </div>
                </div>

                {/* The Two Requested Action Buttons Side-by-Side: Add to Cart AND Order Now */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Button 1: Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 font-heading text-xs font-black uppercase tracking-wider transition-all active:scale-[0.98] ${
                      isAddedSuccess
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isAvailable
                        ? 'border-2 border-raakky-red text-raakky-red bg-white hover:bg-raakky-red/5 shadow-2xs'
                        : 'cursor-not-allowed border-2 border-stone-200 text-stone-400'
                    }`}
                  >
                    {isAddedSuccess ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{t('cart.addedSuccess')}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{t('cutting.addToCartBtn')}</span>
                      </>
                    )}
                  </button>

                  {/* Button 2: Order Now / Buy Now (Direct to Checkout) */}
                  <button
                    type="button"
                    onClick={handleOrderNow}
                    disabled={!isAvailable}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 font-heading text-xs font-black uppercase tracking-wider text-white transition-all active:scale-[0.98] ${
                      isAvailable
                        ? 'bg-raakky-red hover:bg-raakky-red-dark shadow-spicy'
                        : 'bg-stone-300 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    <span>{t('cutting.orderNowBtn')}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Mobile Only: BUTCHER COUNTER ASSURANCE CARD (Screenshot 2: placed directly BELOW Screenshot 1 options) */}
            <div className="lg:hidden mt-3">
              <ButcherGuaranteeCard settings={settings} isTamil={isTamil} />
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE STICKY BOTTOM ACTION BAR                                */}
      {/* Pinned to bottom on mobile so user never has to scroll to order*/}
      {/* ============================================================== */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] px-3 pt-2 sm:hidden"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Left: Total & Stepper */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase text-stone-400 leading-none">
                {formatWeight(selectedVariant?.weightGrams || 500, language)}
              </span>
              <span className="font-heading text-base font-black text-raakky-red leading-tight mt-0.5">
                {formatCurrency(currentPrice)}
              </span>
            </div>

            {/* Micro Stepper */}
            <div className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || !isAvailable}
                className="w-6 h-6 flex items-center justify-center rounded bg-white text-neutral-900 shadow-2xs active:scale-95 disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus size={11} />
              </button>
              <span className="w-5 text-center font-heading text-xs font-black text-neutral-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 10 || !isAvailable}
                className="w-6 h-6 flex items-center justify-center rounded bg-white text-neutral-900 shadow-2xs active:scale-95 disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={11} />
              </button>
            </div>
          </div>

          {/* Right: Dual Buttons (Add to Cart + Order Now) */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {/* Button 1: Add to Cart */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-heading text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 truncate ${
                isAddedSuccess
                  ? 'bg-emerald-600 text-white'
                  : isAvailable
                  ? 'border-2 border-raakky-red text-raakky-red bg-white active:bg-raakky-red/5'
                  : 'border-2 border-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {isAddedSuccess ? (
                <>
                  <CheckCircle2 size={12} className="flex-shrink-0" />
                  <span className="truncate">{t('cart.addedSuccess')}</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={12} className="flex-shrink-0" />
                  <span className="truncate">{t('cutting.addToCartBtn')}</span>
                </>
              )}
            </button>

            {/* Button 2: Order Now */}
            <button
              type="button"
              onClick={handleOrderNow}
              disabled={!isAvailable}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl font-heading text-[11px] font-black uppercase tracking-wider text-white shadow-spicy transition-all active:scale-95 truncate ${
                isAvailable
                  ? 'bg-raakky-red active:bg-raakky-red-dark'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Zap size={12} className="fill-white flex-shrink-0" />
              <span className="truncate">{t('cutting.orderNowBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
