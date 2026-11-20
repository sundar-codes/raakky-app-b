import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Home, ShoppingBag, UtensilsCrossed, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CartDrawer } from '../navigation/CartDrawer';
import { formatCurrency } from '../../utils/formatters';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { itemCount, subtotal } = useCart();
  const { t } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Hide general mobile nav on dedicated transactional and product detail views
  if (
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart')
  ) {
    return null;
  }

  return (
    <>
      {itemCount > 0 && !location.pathname.includes('/checkout') && !location.pathname.includes('/cart') && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-neutral-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-neutral-800 animate-in slide-in-from-bottom-4 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-raakky-red flex items-center justify-center font-bold text-xs text-white">
                {itemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">{t('cart.title')}</p>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {formatCurrency(subtotal)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-raakky-orange">
              <span>{t('cart.checkoutBtn')}</span>
              <ShoppingBag size={15} />
            </div>
          </button>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          to="/"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            isActive('/') && location.pathname === '/'
              ? 'text-raakky-red font-bold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Home size={20} strokeWidth={isActive('/') && location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight">{t('nav.home')}</span>
        </Link>

        <Link
          to="/shop"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            isActive('/shop') ? 'text-raakky-red font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <UtensilsCrossed size={20} strokeWidth={isActive('/shop') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight">{t('nav.shop')}</span>
        </Link>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center py-1 px-3 rounded-xl text-neutral-500 hover:text-neutral-900 transition-colors"
          aria-label="View Cart"
        >
          <div className="relative">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-raakky-red text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{t('nav.cart')}</span>
        </button>

        <Link
          to="/orders"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            isActive('/orders') ? 'text-raakky-red font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Clock size={20} strokeWidth={isActive('/orders') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight">{t('nav.myOrders')}</span>
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
            isActive('/profile') ? 'text-raakky-red font-bold' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <User size={20} strokeWidth={isActive('/profile') ? 2.5 : 2} />
          <span className="text-[10px] mt-1 tracking-tight">{t('nav.profile')}</span>
        </Link>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
