import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Smartphone,
  Share2,
  MoreVertical,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../contexts/LanguageContext';

export const InstallApp: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const { isTamil } = useLanguage();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await promptInstall();
      if (success) setInstallSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>{isTamil ? 'முகப்புக்குச் செல்' : 'Back to Shop'}</span>
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-widest text-raakky-red bg-raakky-red/10 px-3 py-1 rounded-full">
            {isTamil ? 'மொபைல் செயலி' : 'Mobile Web App'}
          </span>
        </div>

        {/* Hero Card with Brand Badge */}
        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-raakky-red via-red-600 to-raakky-red-dark" />

          {/* Real Brand Badge with Yellow Base and Red Circle */}
          <div className="inline-block relative mb-4">
            <img
              src="/images/raakky-brand-badge.png"
              alt="The Raakky Chicken Logo"
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto object-contain rounded-2xl shadow-spicy transition-transform hover:scale-105"
            />
            <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-sm">
              <Sparkles size={14} />
            </span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-neutral-900 uppercase">
            {isTamil ? 'ராக்கி சிக்கன் செயலியை நிறுவுங்கள்' : 'Install The Raakky Chicken App'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            {isTamil
              ? 'உங்கள் மொபைல் முகப்புத் திரையில் இருந்து நொடியில் ஆர்டர் செய்யுங்கள். பிளே ஸ்டோர் அல்லது ஆப் ஸ்டோர் பதிவிறக்கம் தேவையில்லை!'
              : 'Add our lightweight ordering app directly to your phone home screen. 1-tap fresh chicken ordering with zero app store downloads!'}
          </p>

          {/* Quick Action Button */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isInstalled || installSuccess ? (
              <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-heading font-black text-xs uppercase tracking-wider shadow-sm">
                <CheckCircle2 size={18} />
                <span>{isTamil ? 'செயலி நிறுவப்பட்டது ✓' : 'App Already Installed ✓'}</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-raakky-red hover:bg-raakky-red-dark text-white px-8 py-3.5 rounded-2xl font-heading font-black text-sm uppercase tracking-wider shadow-spicy active:scale-95 transition-all"
              >
                <Download size={18} />
                <span>{isTamil ? 'இப்போதே நிறுவுங்கள்' : 'Install App Now'}</span>
              </button>
            ) : null}

            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-neutral-800 px-6 py-3.5 rounded-2xl font-heading font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ShoppingBag size={16} />
              <span>{isTamil ? 'சிக்கன் மெனு பார்க்க' : 'Browse Chicken Menu'}</span>
            </Link>
          </div>
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
              <span className="mt-3 text-[11px] font-mono text-stone-500 tracking-tight">
                https://raakky-app-b.pages.dev
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step OS Installation Instructions */}
        <div className="rounded-3xl bg-white border border-stone-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h2 className="font-heading font-black text-lg sm:text-xl text-neutral-900 uppercase">
                {isTamil ? 'எளிய நிறுவல் வழிமுறைகள்' : 'How to Add to Home Screen'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                {isTamil ? 'உங்கள் உலாவிக்கு ஏற்ப வழிமுறையைத் தேர்ந்தெடுக்கவும்' : 'Select your device for simple 3-step installation'}
              </p>
            </div>

            {/* Device Switcher Pills */}
            <div className="flex items-center p-1 bg-stone-100 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'android'
                    ? 'bg-white text-raakky-red shadow-xs'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                Android (Chrome)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === 'ios'
                    ? 'bg-white text-raakky-red shadow-xs'
                    : 'text-stone-500 hover:text-neutral-900'
                }`}
              >
                iPhone (Safari)
              </button>
            </div>
          </div>

          {/* Android Chrome Instructions */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? 'குரோம் மூன்று புள்ளிகளைத் தட்டவும்' : 'Tap Chrome 3 Dots Menu'}</span>
                    <MoreVertical size={16} className="text-stone-600" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? 'கூகிள் குரோம் உலாவியின் மேல் வலது மூலையில் உள்ள மூன்று புள்ளிகள் (⋮) மெனுவைத் தட்டவும்.'
                      : 'Open Google Chrome and tap the three vertical dots (⋮) icon in the top-right corner.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? '"செயலியை நிறுவு" என்பதைத் தேர்ந்தெடுக்கவும்' : 'Tap "Install app" or "Add to Home screen"'}</span>
                    <Download size={16} className="text-raakky-red" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? 'மெனுவில் "Install app" அல்லது "Add to Home screen" (முகப்புத் திரையில் சேர்) என்பதை அழுத்தவும்.'
                      : 'In the dropdown menu, select "Install app" or "Add to Home screen".'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? 'உறுதி செய்து திறக்கவும்' : 'Confirm & Launch from Home Screen'}</span>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? '"Install" என்பதை அழுத்தவும். ராக்கி சிக்கன் ஐகான் உடனடியாக உங்கள் போனில் தோன்றும்!'
                      : 'Click "Install". The Raakky Chicken icon will be placed on your home screen for fast 1-tap chicken orders!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iPhone Safari Instructions */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  1
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? 'பகிர் (Share) பொத்தானைத் தட்டவும்' : 'Tap the Safari Share Button'}</span>
                    <Share2 size={16} className="text-stone-600" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? 'சஃபாரி உலாவியின் திரையின் அடிப்பகுதியில் உள்ள பகிர் (Square with arrow up ⎋) ஐகானைத் தட்டவும்.'
                      : 'Open in Safari and tap the Share icon (square with upward arrow ⎋) in the bottom navigation bar.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  2
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? '"Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்' : 'Select "Add to Home Screen"'}</span>
                    <PlusSquare size={16} className="text-raakky-red" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? 'கீழே உருட்டி "Add to Home Screen" (முகப்புத் திரையில் சேர் ⊞) விருப்பத்தைத் தேர்ந்தெடுக்கவும்.'
                      : 'Scroll down the share sheet and tap "Add to Home Screen" (⊞).'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-stone-50 border border-stone-200/70">
                <div className="w-8 h-8 rounded-xl bg-raakky-red text-white flex items-center justify-center font-heading font-black text-sm flex-shrink-0">
                  3
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-heading font-bold text-sm text-neutral-900">
                    <span>{isTamil ? '"Add" என்பதை அழுத்தவும்' : 'Tap "Add" in Top-Right'}</span>
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-xs text-stone-600">
                    {isTamil
                      ? 'மேல் வலது மூலையில் உள்ள "Add" என்பதை அழுத்தவும். உங்கள் ஐபோன் திரையில் இருந்து நேரடியாக அணுகலாம்!'
                      : 'Tap "Add" at the top right. Raakky Chicken will open full-screen without Safari browser bars!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl bg-white border border-stone-200/90 p-4 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Zap size={18} />
            </div>
            <h3 className="font-heading font-black text-xs text-neutral-900 uppercase">
              {isTamil ? 'நொடிப் பொழுதில் ஆர்டர்' : 'Lightning Fast'}
            </h3>
            <p className="text-[11px] text-stone-500">
              {isTamil ? 'முகவரி மீண்டும் மீண்டும் தட்டச்சு செய்யத் தேவையில்லை.' : 'Saved delivery addresses and 1-tap instant counter checkout.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200/90 p-4 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-raakky-red/10 text-raakky-red flex items-center justify-center mx-auto">
              <Smartphone size={18} />
            </div>
            <h3 className="font-heading font-black text-xs text-neutral-900 uppercase">
              {isTamil ? 'குறைந்த நினைவகம்' : 'Zero Storage Lag'}
            </h3>
            <p className="text-[11px] text-stone-500">
              {isTamil ? 'போன் மெமரியை அடைக்காது, மிகக் குறைந்த எடையுடையது.' : 'Under 1MB footprint, never takes up your phone storage space.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-stone-200/90 p-4 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-heading font-black text-xs text-neutral-900 uppercase">
              {isTamil ? '100% நேரடி வெட்டு' : 'Direct Counter Live'}
            </h3>
            <p className="text-[11px] text-stone-500">
              {isTamil ? 'பிரஸ் காலனி கடையின் நேரடி நிலவரம் மற்றும் அறிவிப்புகள்.' : 'Get live butcher cut status and early morning Sunday rush updates.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
