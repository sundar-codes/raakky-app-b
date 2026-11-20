import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const NotFound: React.FC = () => {
  const { t, isTamil } = useLanguage();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-stone-50 px-4 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-raakky-red/10 text-raakky-red">
          <AlertCircle className="h-12 w-12" />
        </div>
        <span className="font-heading text-6xl font-black text-raakky-red">404</span>
        <h1 className="mt-2 font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">
          {isTamil ? 'பக்கம் காணப்படவில்லை' : 'Page Not Found'}
        </h1>
        <p className="mt-3 text-sm text-stone-600">
          {isTamil
            ? 'நீங்கள் தேடும் பக்கம் இடம் மாற்றப்பட்டிருக்கலாம் அல்லது அகற்றப்பட்டிருக்கலாம்.'
            : 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
          >
            <Home className="h-4 w-4" />
            <span>{t('nav.home')}</span>
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-neutral-900 shadow-sm hover:bg-stone-50"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>{t('nav.shop')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
