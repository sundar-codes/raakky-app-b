import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Truck,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useShop } from '../contexts/ShopContext';
import { useNotification } from '../contexts/NotificationContext';
import { CartItemRow } from '../components/cart/CartItemRow';
import { OrderSummaryCard } from '../components/cart/OrderSummaryCard';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { formatCurrency } from '../utils/formatters';
import { CartItem } from '../types';

export const Cart: React.FC = () => {
  const { t, isTamil } = useLanguage();
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    subtotal,
    deliveryFee,
    finalTotal,
    isFreeDelivery,
    freeDeliveryRemaining,
    updateQuantity,
    removeItem,
    clearCart,
    revalidateCart,
  } = useCart();
  const { isPaused, pauseReason } = useShop();
  const { showSuccess, showInfo, showWarning } = useNotification();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const handleProceedToCheckout = async () => {
    setIsRevalidating(true);
    try {
      const result = await revalidateCart();
      if (result.hasChanges) {
        showWarning(
          'Cart Updated',
          'கூடை புதுப்பிக்கப்பட்டது',
          `${result.removedCount} unavailable item(s) adjusted`,
          `இருப்பில் இல்லாத பொருட்கள் சரிசெய்யப்பட்டன`
        );
      }
    } finally {
      setIsRevalidating(false);
    }
    navigate('/checkout');
  };

  const handleManualRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const result = await revalidateCart();
      if (result.hasChanges) {
        showWarning(
          'Cart Updated',
          'கூடை புதுப்பிக்கப்பட்டது',
          `${result.removedCount} unavailable item(s) adjusted`,
          `இருப்பில் இல்லாத பொருட்கள் சரிசெய்யப்பட்டன`
        );
      } else {
        showInfo(
          'Prices Validated',
          'விலைகள் சரிபார்க்கப்பட்டன',
          'All items and prices are up to date',
          'அனைத்து பொருட்களும் இருப்பில் உள்ளன'
        );
      }
    } finally {
      setIsRevalidating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-stone-50 py-16">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-raakky-cream shadow-inner">
            <ShoppingBag className="h-12 w-12 text-raakky-orange" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900">
            {t('cart.emptyTitle')}
          </h1>
          <p className="mt-3 text-sm text-stone-600 sm:text-base">
            {t('cart.emptySubtitle')}
          </p>

          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-8 py-4 font-heading text-base font-extrabold uppercase tracking-wider text-white shadow-xl shadow-raakky-red/25 transition-all hover:bg-raakky-red-dark active:scale-95"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>{t('cart.startShopping')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4 md:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title & Actions */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-raakky-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-raakky-red">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{itemCount} {isTamil ? 'பொருட்கள்' : 'items'}</span>
            </div>
            <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {t('cart.title')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRevalidate}
              disabled={isRevalidating}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-600 shadow-sm hover:bg-stone-50 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRevalidating ? 'animate-spin text-raakky-red' : ''}`} />
              <span>{isTamil ? 'விலை சரிபார்க்க' : 'Revalidate'}</span>
            </button>

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50/60 px-3.5 py-2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100/70 active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isTamil ? 'கூடையை காலியாக்கு' : 'Clear Cart'}</span>
            </button>
          </div>
        </div>

        {/* Free Delivery Goal Bar */}
        <div className="mb-6 rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              {isFreeDelivery ? (
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('cart.freeDeliveryBadge')} Unlocked!
                </span>
              ) : (
                <span>
                  {t('cart.freeDeliveryHint', { amount: Math.round(freeDeliveryRemaining) })}
                </span>
              )}
            </span>
            <span className="text-stone-500 font-mono">
              {isFreeDelivery ? '100%' : `${Math.round((subtotal / (subtotal + freeDeliveryRemaining)) * 100)}%`}
            </span>
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-200/50">
            <div
              className="h-full bg-emerald-600 transition-all duration-500"
              style={{
                width: isFreeDelivery
                  ? '100%'
                  : `${Math.min(100, (subtotal / (subtotal + freeDeliveryRemaining)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Shop Availability Notice if paused */}
        {isPaused && (
          <div className="mb-6 flex items-center gap-3 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-xs sm:text-sm">
              <strong className="font-bold">{t('shopClosed.temporarilyPaused')}: </strong>
              <span>{isTamil ? pauseReason.ta : pauseReason.en}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Items List */}
          <div className="space-y-3 lg:col-span-8">
            {items.map((item) => (
              <CartItemRow
                key={item.cartItemId}
                item={item}
                onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
                onRemove={(item) => setItemToRemove(item)}
              />
            ))}

            {/* Back to shop button */}
            <div className="pt-3">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 transition-colors hover:text-raakky-red"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{isTamil ? 'தொடர்ந்து வாங்க' : 'Continue Shopping'}</span>
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <OrderSummaryCard
              onProceedToCheckout={handleProceedToCheckout}
              showCheckoutButton={true}
            />
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t('cart.clearConfirmTitle')}
        message={t('cart.clearConfirmMsg')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        isDestructive
        onConfirm={() => {
          clearCart();
          setShowClearConfirm(false);
          showInfo('Cart Cleared', 'கூடை காலியானது', 'All items removed from cart', 'கூடையிலிருந்து அனைத்து பொருட்களும் நீக்கப்பட்டன');
        }}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Remove Single Item Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(itemToRemove)}
        title={t('cart.removeConfirmTitle')}
        message={t('cart.removeConfirmMsg')}
        confirmText={t('cart.remove')}
        cancelText={t('common.cancel')}
        isDestructive
        onConfirm={() => {
          if (itemToRemove) {
            removeItem(itemToRemove.cartItemId);
            setItemToRemove(null);
          }
        }}
        onCancel={() => setItemToRemove(null)}
      />
    </div>
  );
};
