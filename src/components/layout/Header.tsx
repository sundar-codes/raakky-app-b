import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, ShoppingBag, User } from 'lucide-react';
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

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm">
        <ToplineBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 group focus:outline-none"
            aria-label="The Raakky Chicken Home"
          >
            <div className="w-11 h-11 bg-raakky-red border-2 border-raakky-red-dark rounded-xl flex items-center justify-center text-white font-condensed font-extrabold text-2xl -skew-x-6 shadow-spicy transition-transform group-hover:scale-105">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-condensed font-black text-xl tracking-tight leading-none text-neutral-950 uppercase">
                THE RAAKKY
              </span>
              <span className="font-condensed font-black text-xl tracking-tight leading-none text-raakky-red uppercase">
                CHICKEN
              </span>
            </div>
          </Link>

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
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSelector variant="header" />

            <a
              href="tel:+919843599030"
              className="hidden lg:flex w-10 h-10 rounded-full border border-neutral-200 items-center justify-center text-neutral-700 hover:bg-raakky-red hover:text-white hover:border-raakky-red transition-all"
              aria-label="Call shop"
              title="+91 98435 99030"
            >
              <Phone size={17} />
            </a>

            <Link
              to="/profile"
              className={`flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl border transition-all ${
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

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 py-2.5 bg-raakky-red text-white rounded-2xl font-bold shadow-spicy hover:bg-raakky-red-dark active:scale-95 transition-all"
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
          </div>
        </div>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
