import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, ShoppingBag, User, Download, ArrowLeft } from 'lucide-react';
import { ToplineBanner } from './ToplineBanner';
import { LanguageSelector } from '../navigation/LanguageSelector';
import { CartDrawer } from '../navigation/CartDrawer';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';

export const Header: React.FC = () => {
  const location = useLocation();
  const { itemCount, subtotal } = useCart();
  const { t, isTamil } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isProductPage = location.pathname.startsWith('/product/');

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <ToplineBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Left: Brand Logo & Title (or Back Button on Product Mobile View) */}
          <div className="flex items-center gap-2">
            {isProductPage && (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="sm:hidden p-2 -ml-1 text-stone-700 hover:text-neutral-950 active:scale-95 transition-transform"
                aria-label="Go Back"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
              aria-label="The Raakky Chicken Home"
            >
              {/* Real Official Brand Badge with Yellow Base and Red Circle */}
              <img
                src="/images/raakky-brand-badge.png"
                alt="The Raakky Chicken"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl shadow-spicy transition-transform group-hover:scale-105"
              />
              
              {/* Brand Text: Hidden on mobile product page to keep header clean and non-crowded */}
              <div className={`${isProductPage ? 'hidden sm:flex' : 'hidden sm:flex'} flex-col`}>
                <span className="font-condensed font-black text-xl tracking-tight leading-none text-neutral-950 uppercase">
                  THE RAAKKY
                </span>
                <span className="font-condensed font-black text-xl tracking-tight leading-none text-raakky-red uppercase">
                  CHICKEN
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                isActive('/') && location.pathname === '/'
                  ? 'text-raakky-red'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/shop"
              className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                isActive('/shop')
                  ? 'text-raakky-red'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {t('nav.shop')}
            </Link>
            <Link
              to="/orders"
              className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                isActive('/orders')
                  ? 'text-raakky-red'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {t('nav.myOrders')}
            </Link>
            <Link
              to="/install"
              className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                isActive('/install')
                  ? 'bg-raakky-red text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Download size={13} />
              <span>{isTamil ? 'செயலி' : 'App'}</span>
            </Link>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Download App Pill (Visible on mobile header when not inside product page) */}
            {!isProductPage && (
              <Link
                to="/install"
                className="flex sm:hidden items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-900 border border-amber-500/20 text-[11px] font-black uppercase tracking-tight active:scale-95 transition-transform"
                title="Install Raakky Chicken App"
              >
                <Download size={13} className="text-amber-700" />
                <span>{isTamil ? 'செயலி' : 'App'}</span>
              </Link>
            )}

            {/* Language Selector: Desktop only on product page to prevent crowding on mobile */}
            <div className={isProductPage ? 'hidden sm:block' : 'hidden sm:block'}>
              <LanguageSelector variant="header" />
            </div>

            <a
              href="tel:+919843599030"
              className="hidden lg:flex w-10 h-10 rounded-full border border-neutral-200 items-center justify-center text-neutral-700 hover:bg-raakky-red hover:text-white hover:border-raakky-red transition-all"
              aria-label="Call shop"
              title="+91 98435 99030"
            >
              <Phone size={17} />
            </a>

            {/* Profile Button: Desktop only on product page to prevent header clutter */}
            <Link
              to="/profile"
              className={`${
                isProductPage ? 'hidden sm:flex' : 'hidden sm:flex'
              } items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl border transition-all ${
                isActive('/profile')
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
              }`}
              aria-label="Customer Profile"
            >
              <User size={18} />
              <span className="hidden sm:inline text-xs font-bold">
                {isAuthenticated ? (isTamil ? 'கணக்கு' : 'Account') : t('nav.login')}
              </span>
            </Link>

            {/* Cart Button:
                - On mobile product page: HIDDEN so user doesn't see 3 duplicate cart buttons!
                - On desktop & all other pages: VISIBLE as primary universal cart drawer trigger!
            */}
            {(!isProductPage || window.innerWidth >= 640) && (
              <button
                onClick={() => setIsCartOpen(true)}
                className={`${
                  isProductPage ? 'hidden sm:flex' : 'flex'
                } relative items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 bg-raakky-red text-white rounded-2xl font-bold shadow-spicy hover:bg-raakky-red-dark active:scale-95 transition-all`}
                aria-label={`View cart with ${itemCount} items`}
              >
                <div className="relative">
                  <ShoppingBag size={18} strokeWidth={2.4} />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-raakky-red text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-black">
                  {subtotal > 0 ? formatCurrency(subtotal) : t('nav.cart')}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
