import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'header' | 'inline' | 'dropdown';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 p-1.5 bg-neutral-100 rounded-2xl ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            language === 'en'
              ? 'bg-white text-raakky-red shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('ta')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            language === 'ta'
              ? 'bg-raakky-red text-white shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          தமிழ் (Tamil)
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center bg-neutral-100/90 hover:bg-neutral-200/80 p-0.5 rounded-full border border-neutral-200/60 transition-colors ${className}`}>
      <div className="flex items-center pl-2 pr-1 text-neutral-500">
        <Globe size={13} />
      </div>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-[11px] font-bold rounded-full transition-all ${
          language === 'en'
            ? 'bg-white text-raakky-red shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ta')}
        className={`px-2 py-1 text-[11px] font-bold rounded-full transition-all ${
          language === 'ta'
            ? 'bg-raakky-red text-white shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
        aria-label="தமிழுக்கு மாறவும்"
      >
        தமிழ்
      </button>
    </div>
  );
};
