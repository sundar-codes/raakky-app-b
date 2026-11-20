import React from 'react';
import { useShop } from '../../contexts/ShopContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Phone } from 'lucide-react';

export const ToplineBanner: React.FC = () => {
  const { shopStatusState, timeInfo, isPaused } = useShop();
  const { isTamil } = useLanguage();

  const statusLabel = isPaused
    ? (isTamil ? 'ஆர்டர்கள் தற்காலிக நிறுத்தம்' : 'ORDERS PAUSED')
    : shopStatusState === 'open'
    ? (isTamil ? 'இப்போது திறந்துள்ளது' : 'OPEN NOW')
    : (isTamil ? timeInfo.statusLabelTa : timeInfo.statusLabelEn);

  return (
    <div className="bg-raakky-red text-white h-9 px-4 sm:px-8 flex items-center justify-between text-[11px] font-bold tracking-wider uppercase border-b border-raakky-red-dark select-none">
      <div className="flex items-center gap-2">
        <span className="opacity-90">{isTamil ? 'கோயம்புத்தூர், தமிழ்நாடு' : 'COIMBATORE, TAMIL NADU'}</span>
        <span className="hidden sm:inline-block opacity-40">|</span>
        <span className="hidden sm:inline-block opacity-80 text-[10px] font-medium tracking-normal normal-case">
          {isTamil ? 'பிரஸ் காலனி கடை' : 'Press Colony Counter'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="tel:+919843599030"
          className="hidden md:flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity font-mono text-[10px]"
        >
          <Phone size={12} />
          <span>+91 98435 99030</span>
        </a>

        <div className="flex items-center gap-2 bg-black/20 px-2.5 py-0.5 rounded-full">
          <span
            className={`w-2 h-2 rounded-full ${
              isPaused
                ? 'bg-amber-300 animate-pulse'
                : shopStatusState === 'open'
                ? 'bg-emerald-300 ring-2 ring-emerald-300/40 animate-pulse'
                : 'bg-white/60'
            }`}
          />
          <span className="text-[10px] font-extrabold">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
};
