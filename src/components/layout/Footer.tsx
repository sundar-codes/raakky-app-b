import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, MapPin, Clock, Phone, Truck, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t, isTamil } = useLanguage();
  const studioUrl = 'https://sd-webstudio.vercel.app/#contact';
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=The+Raakky+Chicken+81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore';

  return (
    <footer className="bg-neutral-950 text-white pt-12 pb-32 sm:pb-12 border-t border-neutral-900 mt-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Multi-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-neutral-850">
          
          {/* Column 1: Brand & Mission (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-raakky-red border-2 border-raakky-red-dark rounded-xl flex items-center justify-center text-white font-condensed font-extrabold text-2xl -skew-x-6 shadow-sm">
                R
              </div>
              <div className="flex flex-col">
                <span className="font-condensed font-black text-lg tracking-tight leading-none text-white uppercase">
                  THE RAAKKY
                </span>
                <span className="font-condensed font-black text-lg tracking-tight leading-none text-raakky-red uppercase">
                  CHICKEN
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed pr-2">
              {isTamil
                ? 'உங்கள் பிரஸ் காலனி பகுதி நேரடி சிக்கன் கடை. அன்றாட சமையல் மற்றும் குடும்ப விருந்துகளுக்கு புத்தம் புதிய தரமான பிராய்லர் கறி உடனுக்குடன் வெட்டித் தரப்படும்.'
                : 'Your neighbourhood chicken shop in Press Colony, Coimbatore. Quality fresh broiler chicken prepared on-order for everyday family meals and Sunday feasts.'}
            </p>

            {/* Fresh Trust Highlights */}
            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>{isTamil ? 'நேரடி வெட்டு (உறைந்தது அல்ல)' : 'Cut Fresh On-Order'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                <Truck size={13} className="text-blue-400" />
                <span>{isTamil ? '4 பகுதிகளில் டெலிவரி' : '4 Localities Delivery'}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {isTamil ? 'பக்கங்கள்' : 'Quick Order'}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  {t('nav.shop')}
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  {t('nav.myOrders')}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  {t('nav.cart')}
                </Link>
              </li>
              <li>
                <a
                  href="https://raakky-chicken-website.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span>{isTamil ? 'கடை இணையதளம்' : 'Store Website'}</span>
                  <ExternalLink size={11} className="text-neutral-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Broiler Cuts (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {isTamil ? 'புதிய கறி வெட்டுகள்' : 'Fresh Broiler Cuts'}
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              <li>
                <Link to="/shop?cat=cat-curry-chukka" className="hover:text-white transition-colors">
                  {isTamil ? 'சிக்கன் குழம்பு துண்டுகள்' : 'Chicken Curry Pieces'}
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=cat-bone-in" className="hover:text-white transition-colors">
                  {isTamil ? 'லெக் பீஸ் & எலும்புடன் சிக்கன்' : 'Chicken Leg & With Bone'}
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=cat-boneless" className="hover:text-white transition-colors">
                  {isTamil ? 'எலும்பில்லா பிரெஸ்ட் & க்யூப்ஸ்' : 'Boneless Breast & Cubes'}
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=cat-fry-cuts" className="hover:text-white transition-colors">
                  {isTamil ? 'சிக்கன் 65 வறுவல் துண்டுகள்' : 'Chicken 65 Fry Cut (Plain)'}
                </Link>
              </li>
              <li>
                <Link to="/shop?cat=cat-liver-feet" className="hover:text-white transition-colors">
                  {isTamil ? 'சுத்தம் செய்த ஈரல் & கால்கள்' : 'Cleaned Liver & Feet'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Counter Location & Hours (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {isTamil ? 'நேரடி கடை & தொடர்புக்கு' : 'Counter & Hours'}
            </h4>
            
            <div className="space-y-2.5 text-xs text-neutral-400">
              {/* Address */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-raakky-red flex-shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span>81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019</span>
                  <div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-raakky-red hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5 mt-0.5"
                    >
                      <span>{isTamil ? 'வரைபடம் பார்க்க' : 'Get Directions'}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="leading-tight text-[11px]">
                  <div>Mon – Sat: <span className="text-neutral-200 font-semibold">7:00 AM – 9:00 PM</span></div>
                  <div className="mt-0.5">Sunday: <span className="text-emerald-400 font-semibold">4:00 AM – 9:00 PM</span> (Market Rush)</div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 pt-0.5">
                <Phone size={14} className="text-emerald-400 flex-shrink-0" />
                <a href="tel:+919843599030" className="text-neutral-200 hover:text-white font-bold tracking-wide">
                  +91 98435 99030
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          
          {/* Copyright & Shop Disclaimer */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span>© {new Date().getFullYear()} THE RAAKKY CHICKEN. ALL RIGHTS RESERVED.</span>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <span className="text-[11px] text-neutral-400">
              {isTamil ? 'பிராய்லர் சிக்கன் மட்டுமே • கோயம்புத்தூர்' : 'Broiler Chicken Only • Coimbatore, Tamil Nadu'}
            </span>
          </div>

          {/* Normal Transparent Watermark (No box, no border, no button; restores color on hover, redirects on click) */}
          <div className="flex items-center justify-center">
            <a
              href={studioUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 opacity-50 hover:opacity-100 transition-all duration-300 group cursor-pointer"
              title="Crafted by SD Web Studio"
            >
              <img
                src="/images/sd-logo.png"
                alt="SD Logo"
                className="w-5 h-5 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400 group-hover:text-white transition-colors">
                Crafted by SD Web Studio
              </span>
              <ArrowUpRight size={13} className="text-neutral-500 group-hover:text-white transition-colors" />
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};
