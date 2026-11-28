import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../contexts/LanguageContext';

export const InstallApp: React.FC = () => {
  const { isInstallable, isInstalled, isInstalling, isIOS, promptInstall } = usePWAInstall();
  const { isTamil } = useLanguage();
  const [showFallbackHint, setShowFallbackHint] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'unavailable') {
        setShowFallbackHint(true);
      }
      return;
    }
    setShowFallbackHint((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{isTamil ? 'முகப்புக்குச் செல்' : 'Back to Shop'}</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-widest text-raakky-red bg-raakky-red/10 px-3 py-1 rounded-full">
            The Raakky Chicken
          </span>
        </div>

        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-raakky-red via-red-600 to-raakky-red-dark" />

          <img
            src="/images/raakky-brand-badge.png"
            alt="The Raakky Chicken"
            className="w-20 h-20 mx-auto object-contain rounded-full shadow-spicy"
          />

          <div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-neutral-900 uppercase">
              {isTamil ? 'தி ராக்கி சிக்கன் செயலி' : 'The Raakky Chicken'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
              {isTamil
                ? 'உங்கள் மொபைலில் இருந்து உடனுக்குடன் பிரஷ் சிக்கன் ஆர்டர் செய்யுங்கள்.'
                : 'Open directly or install to your home screen for quick chicken ordering.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isInstalled ? (
              <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-heading font-black text-xs uppercase tracking-wider shadow-sm">
                <CheckCircle2 size={18} />
                <span>{isTamil ? 'செயலி நிறுவப்பட்டது' : 'App Installed'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-raakky-red hover:bg-raakky-red-dark disabled:opacity-60 text-white px-8 py-3.5 rounded-2xl font-heading font-black text-sm uppercase tracking-wider shadow-spicy active:scale-95 transition-all"
              >
                <Download size={18} />
                <span>
                  {isInstalling
                    ? isTamil
                      ? 'நிறுவப்படுகிறது...'
                      : 'Installing...'
                    : isTamil
                      ? 'செயலியை நிறுவு'
                      : 'Install App'}
                </span>
              </button>
            )}

            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-6 py-3.5 rounded-2xl font-heading font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ShoppingBag size={16} />
              <span>{isTamil ? 'மெனு பார்க்க' : 'Order Now'}</span>
            </Link>
          </div>

          {!isInstalled && !isInstallable && showFallbackHint && (
            <p className="text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 max-w-md mx-auto">
              {isIOS
                ? isTamil
                  ? 'Safari-இல் Share (⎋) → "Add to Home Screen" என்பதைத் தட்டவும்.'
                  : 'In Safari, tap Share (⎋) and select "Add to Home Screen".'
                : isTamil
                  ? 'உலாவி மெனுவில் "Install app" அல்லது "Add to Home screen" என்பதைத் தேர்ந்தெடுக்கவும்.'
                  : 'Use your browser menu and choose "Install app" or "Add to Home screen".'}
            </p>
          )}
        </div>

        {/* QR Code Section for Counter or Desktop Users */}
        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-raakky-red bg-raakky-red/5 px-3 py-1 rounded-full">
                <QrCode size={15} />
                <span>{isTamil ? 'மொபைல் க்யூஆர் ஸ்கேன்' : 'Scan With Phone Camera'}</span>
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-neutral-900">
                {isTamil ? 'போன் கேமரா மூலம் ஸ்கேன் செய்து நிறுவுங்கள்' : 'Scan to Install Directly on Mobile'}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isTamil
                  ? 'கடை கவுண்டரில் உள்ள வாடிக்கையாளர்கள் அல்லது கணினியில் பார்ப்பவர்கள் உங்கள் போன் கேமரா மூலம் இந்த க்யூஆர் குறியீட்டை ஸ்கேன் செய்து உடனடியாக நிறுவிக்கொள்ளலாம்.'
                  : 'Visiting from a desktop or at our Press Colony shop counter? Point your phone camera at this branded QR code to open and install the app instantly.'}
              </p>
              <div className="pt-2 flex items-center justify-center md:justify-start gap-4 text-xs font-bold text-stone-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  {isTamil ? 'பாதுகாப்பானது' : 'Safe & Direct'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-500" />
                  {isTamil ? 'நொடியில் திறக்கும்' : 'Instant Loading'}
                </span>
              </div>
            </div>

            {/* QR Image with Raakky Center Badge */}
            <div className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100">
                <img
                  src="/images/raakky-app-qr.png"
                  alt="Raakky Chicken App QR Code"
                  className="w-52 h-52 object-contain rounded-xl"
                />
              </div>
              <a
                href="https://raakky-app-b.pages.dev"
                className="mt-3 text-[11px] font-mono text-stone-500 hover:text-raakky-red tracking-tight"
              >
                https://raakky-app-b.pages.dev
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
