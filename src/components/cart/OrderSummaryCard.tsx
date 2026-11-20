import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShop } from '../../contexts/ShopContext';
import { formatCurrency } from '../../utils/formatters';

interface OrderSummaryCardProps {
  onProceedToCheckout?: () => void;
  showCheckoutButton?: boolean;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  onProceedToCheckout,
  showCheckoutButton = true,
}) => {
  const { subtotal, deliveryFee, packagingFee, finalTotal, isFreeDelivery, freeDeliveryRemaining, items } = useCart();
  const { t, isTamil } = useLanguage();
  const { isPaused, pauseReason } = useShop();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-card space-y-5">
      <h3 className="text-base font-bold text-neutral-900 font-sans tracking-tight">
        {t('cart.billDetails')}
      </h3>

      {items.length > 0 && (
        <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            {isFreeDelivery ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {t('cart.freeDeliveryBadge')} Unlocked!
              </span>
            ) : (
              <span className="text-neutral-600">
                {t('cart.freeDeliveryHint', { amount: Math.round(freeDeliveryRemaining) })}
              </span>
            )}
          </div>
          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFreeDelivery ? 'bg-emerald-500' : 'bg-raakky-red'
              }`}
              style={{
                width: `${Math.min(100, (subtotal / (subtotal + freeDeliveryRemaining)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between text-neutral-600">
          <span>{t('cart.itemSubtotal')}</span>
          <span className="font-bold text-neutral-900">{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between text-neutral-600">
          <span>{t('cart.deliveryFee')}</span>
          <span className="font-bold">
            {deliveryFee === 0 ? (
              <span className="text-emerald-600 font-bold">{t('cart.freeDeliveryBadge')}</span>
            ) : (
              formatCurrency(deliveryFee)
            )}
          </span>
        </div>

        {packagingFee > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>{t('cart.packagingFee')}</span>
            <span className="font-bold text-neutral-900">{formatCurrency(packagingFee)}</span>
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline text-neutral-900">
          <span className="text-sm font-extrabold">{t('cart.toPay')}</span>
          <span className="text-xl font-black text-raakky-red font-sans">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      {isPaused && (
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
          <p className="font-bold">{t('shopStatus.pausedTitle')}</p>
          <p className="opacity-90 mt-0.5">{isTamil ? pauseReason.ta : pauseReason.en}</p>
        </div>
      )}

      {showCheckoutButton && (
        <button
          type="button"
          disabled={isPaused || items.length === 0}
          onClick={onProceedToCheckout}
          className={`w-full py-4 px-5 rounded-2xl font-bold text-sm flex items-center justify-between shadow-spicy transition-all ${
            isPaused || items.length === 0
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
              : 'bg-raakky-red text-white hover:bg-raakky-red-dark active:scale-[0.99]'
          }`}
        >
          <span>{isPaused ? t('cart.checkoutDisabledShort') : t('cart.checkoutBtn')}</span>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-mono">
              {formatCurrency(finalTotal)}
            </span>
            <ArrowRight size={17} />
          </div>
        </button>
      )}

      <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 text-center pt-1">
        <ShieldCheck size={14} className="text-emerald-600 flex-shrink-0" />
        <span>{t('cart.priceDisclaimer')}</span>
      </div>
    </div>
  );
};
