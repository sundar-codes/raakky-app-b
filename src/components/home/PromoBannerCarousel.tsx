import React, { useState, useEffect, useRef } from 'react';
import { Truck, Flame, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShop } from '../../contexts/ShopContext';

export const PromoBannerCarousel: React.FC = () => {
  const { isTamil } = useLanguage();
  const { settings } = useShop();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const freeDeliveryThreshold = settings?.freeDeliveryThreshold ?? 499;

  const banners = [
    {
      id: 'free-delivery',
      badgeEn: 'FREE DELIVERY',
      badgeTa: 'இலவச டெலிவரி',
      titleEn: `Free Delivery on Orders Above ₹${freeDeliveryThreshold}`,
      titleTa: `₹${freeDeliveryThreshold}க்கு மேல் இலவச ஹோம் டெலிவரி`,
      descEn: 'Delivering to Press Colony, Veerapandi Pirivu, Periyanaickenpalayam & Mathampalayam',
      descTa: 'பிரஸ் காலனி, வீரபாண்டி பிரிவு, பெரியநாயக்கன்பாளையம் & மாதம்பாளையம்',
      bgGradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700',
      iconBg: 'bg-white/15',
      icon: Truck,
    },
    {
      id: 'sunday-rush',
      badgeEn: 'SUNDAY RUSH',
      badgeTa: 'ஞாயிறு காலை சந்தை',
      titleEn: 'Fresh Butcher Cuts from 4:00 AM',
      titleTa: 'அதிகாலை 4:00 AM முதல் நேரடி வெட்டுக்கள்',
      descEn: 'Early morning fresh cuts for Sunday family biryani & roasts',
      descTa: 'ஞாயிறு காலை வீட்டு பிரியாணி மற்றும் விருந்துக்கு புத்தம் புதிய கறி',
      bgGradient: 'bg-gradient-to-r from-raakky-red via-orange-600 to-raakky-orange',
      iconBg: 'bg-white/15',
      icon: Flame,
    },
    {
      id: 'custom-cuts',
      badgeEn: 'CUSTOM CUTS',
      badgeTa: 'நேரடி வெட்டு',
      titleEn: 'Chopped Fresh Exactly As You Like',
      titleTa: 'உங்கள் விருப்பப்படி நறுக்கித் தரப்படும்',
      descEn: 'Skinless, Skin-on, Curry cut, Chukka, or Boneless cubes',
      descTa: 'தோல் நீக்கியது, தோலுடன், குழம்பு வெட்டு அல்லது சுக்கா துண்டுகள்',
      bgGradient: 'bg-gradient-to-r from-neutral-900 via-stone-850 to-neutral-950',
      iconBg: 'bg-neutral-800',
      icon: ShieldCheck,
    },
  ];

  // Auto-advance banner from right to left every 3.8 seconds
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPaused, banners.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-sm select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Container - sliding horizontally right to left */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => {
          const Icon = banner.icon;
          return (
            <div
              key={banner.id}
              className={`w-full flex-shrink-0 ${banner.bgGradient} text-white p-3.5 sm:p-5 flex items-center justify-between gap-3 min-h-[96px] sm:min-h-[120px]`}
            >
              {/* Text content */}
              <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0 pr-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                  {isTamil ? banner.badgeTa : banner.badgeEn}
                </span>
                <h3 className="font-heading text-sm sm:text-lg font-black tracking-tight leading-snug line-clamp-1">
                  {isTamil ? banner.titleTa : banner.titleEn}
                </h3>
                <p className="text-[10px] sm:text-xs text-white/85 line-clamp-1 leading-normal">
                  {isTamil ? banner.descTa : banner.descEn}
                </p>
              </div>

              {/* Icon badge */}
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${banner.iconBg} flex items-center justify-center flex-shrink-0 text-white shadow-xs`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows for Desktop Hover */}
      <button
        onClick={handlePrev}
        aria-label="Previous banner"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white hidden sm:flex items-center justify-center transition-opacity backdrop-blur-xs"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next banner"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 text-white hidden sm:flex items-center justify-center transition-opacity backdrop-blur-xs"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? 'w-5 bg-white'
                : 'w-1.5 bg-white/45 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
