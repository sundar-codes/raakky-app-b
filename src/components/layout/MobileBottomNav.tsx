import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Home, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CartDrawer } from '../navigation/CartDrawer';
import { formatCurrency } from '../../utils/formatters';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { itemCount, subtotal } = useCart();
  const { t, isTamil } = useLanguage();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Hide general mobile nav on dedicated transactional and product detail views
  if (
    location.pathname.startsWith('/product/') ||
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart')
  ) {
    return null;
  }

  // Exactly three modules as requested: Home, My Orders, Profile
  const NAV_ITEMS = [
    {
      id: 'home',
      path: '/',
      labelEn: 'Home',
      labelTa: 'முகப்பு',
      icon: Home,
      isActive: location.pathname === '/' || location.pathname === '/shop',
    },
    {
      id: 'orders',
      path: '/orders',
      labelEn: 'My Orders',
      labelTa: 'ஆர்டர்கள்',
      icon: Clock,
      isActive: location.pathname.startsWith('/orders') || location.pathname.startsWith('/order/'),
    },
    {
      id: 'profile',
      path: '/profile',
      labelEn: 'Profile',
      labelTa: 'கணக்கு',
      icon: User,
      isActive: location.pathname.startsWith('/profile'),
    },
  ];

  return (
    <>
      {/* Floating Active Cart Bar (Shows above bottom nav when cart has items) */}
      {itemCount > 0 && !location.pathname.includes('/checkout') && !location.pathname.includes('/cart') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="md:hidden fixed bottom-20 left-4 right-4 z-30"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-neutral-950 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-neutral-800 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-raakky-red flex items-center justify-center font-bold text-xs text-white shadow-spicy">
                {itemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">{t('cart.title')}</p>
                <p className="text-[11px] text-neutral-300 font-mono">
                  {formatCurrency(subtotal)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-raakky-orange">
              <span>{t('cart.checkoutBtn')}</span>
              <ShoppingBag size={15} />
            </div>
          </button>
        </motion.div>
      )}

      {/* Floating Animated 3-Module Dock */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-4 pt-1.5 shadow-lg select-none"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around relative">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex-1 py-1.5 flex flex-col items-center justify-center focus:outline-none"
              >
                {/* Animated active background pill */}
                {active && (
                  <motion.div
                    layoutId="activeBottomTabPill"
                    className="absolute inset-x-2 inset-y-0.5 bg-raakky-red/10 border border-raakky-red/20 rounded-2xl"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 35,
                    }}
                  />
                )}

                {/* Animated Icon & Text */}
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className={`relative z-10 flex flex-col items-center transition-colors ${
                    active ? 'text-raakky-red' : 'text-stone-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.6 : 2}
                    className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}
                  />
                  <span
                    className={`text-[10px] mt-1 tracking-tight font-heading ${
                      active ? 'font-black' : 'font-semibold'
                    }`}
                  >
                    {isTamil ? item.labelTa : item.labelEn}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};
