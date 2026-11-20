import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X, AlertTriangle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShop } from '../../contexts/ShopContext';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { ConfirmDialog } from '../dialogs/ConfirmDialog';
import { CartItem } from '../../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, deliveryFee, finalTotal, isFreeDelivery, freeDeliveryRemaining, updateQuantity, removeItem } = useCart();
  const { t, isTamil, language } = useLanguage();
  const { isPaused, pauseReason } = useShop();

  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-raakky-cream">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-raakky-red/10 text-raakky-red flex items-center justify-center">
                  <ShoppingBag size={20} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 font-sans tracking-tight">
                    {t('cart.title')}
                  </h2>
                  <p className="text-xs text-neutral-500 font-medium">
                    {t('cart.itemsCount', { count: itemCount })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            {isPaused && (
              <div className="bg-amber-50 border-b border-amber-200 p-3.5 flex items-start gap-2.5 text-amber-900 text-xs">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('shopStatus.pausedTitle')}</p>
                  <p className="opacity-90 mt-0.5">{isTamil ? pauseReason.ta : pauseReason.en}</p>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  {isFreeDelivery ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      {t('cart.freeDeliveryBadge')} Unlocked!
                    </span>
                  ) : (
                    <span className="text-neutral-600">
                      {t('cart.freeDeliveryHint', { amount: Math.round(freeDeliveryRemaining) })}
                    </span>
                  )}
                  <span className="text-neutral-400 text-[11px]">{formatCurrency(subtotal)}</span>
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

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-neutral-100">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center">
                    <ShoppingBag size={36} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800">{t('cart.emptyTitle')}</h3>
                    <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">
                      {t('cart.emptySubtitle')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/shop');
                    }}
                    className="px-5 py-2.5 bg-raakky-red text-white text-xs font-bold rounded-xl shadow-spicy hover:bg-raakky-red-dark transition-all"
                  >
                    {t('cart.startShopping')}
                  </button>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                    <img
                      src={item.imageUrl}
                      alt={item.productNameEn}
                      className="w-16 h-16 rounded-2xl object-cover bg-neutral-100 flex-shrink-0 border border-neutral-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 leading-tight">
                            {isTamil ? item.productNameTa : item.productNameEn}
                          </h4>
                          <p className="text-xs text-raakky-red font-semibold mt-0.5">
                            {formatWeight(item.weightGrams, language)} · {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <button
                          onClick={() => setItemToRemove(item)}
                          className="p-1 text-neutral-400 hover:text-raakky-red transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-600 font-medium">
                          {item.cuttingPreference.skinType === 'skin_on' ? 'Skin-on' : 'Skinless'}
                        </span>
                        <span className="px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-600 font-medium capitalize">
                          {item.cuttingPreference.cutType.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50 shadow-sm">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                setItemToRemove(item);
                              } else {
                                updateQuantity(item.cartItemId, item.quantity - 1);
                              }
                            }}
                            className="p-1.5 hover:bg-neutral-200 text-neutral-700 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-3 text-xs font-bold text-neutral-900 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            className="p-1.5 hover:bg-neutral-200 text-neutral-700 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-extrabold text-neutral-900 font-sans">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-neutral-100 bg-raakky-cream/60 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>{t('cart.itemSubtotal')}</span>
                    <span className="font-semibold text-neutral-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>{t('cart.deliveryFee')}</span>
                    <span className="font-semibold">
                      {deliveryFee === 0 ? (
                        <span className="text-emerald-600 font-bold">{t('cart.freeDeliveryBadge')}</span>
                      ) : (
                        formatCurrency(deliveryFee)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                    <span>{t('cart.toPay')}</span>
                    <span className="text-base text-raakky-red font-extrabold">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                </div>

                <button
                  disabled={isPaused}
                  onClick={handleCheckoutClick}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-between transition-all shadow-spicy ${
                    isPaused
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed shadow-none'
                      : 'bg-raakky-red text-white hover:bg-raakky-red-dark active:scale-[0.99]'
                  }`}
                >
                  <span>{isPaused ? t('cart.checkoutDisabledShort') : t('cart.checkoutBtn')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg">
                      {formatCurrency(finalTotal)}
                    </span>
                    <ArrowRight size={16} />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToRemove}
        title={t('cart.removeConfirmTitle')}
        message={
          itemToRemove
            ? t('cart.removeConfirmMessage', {
                name: isTamil ? itemToRemove.productNameTa : itemToRemove.productNameEn,
                weight: formatWeight(itemToRemove.weightGrams, language),
              })
            : ''
        }
        confirmText={t('cart.removeConfirmBtn')}
        cancelText={t('cart.keepItemBtn')}
        isDestructive={true}
        onConfirm={() => {
          if (itemToRemove) {
            removeItem(itemToRemove.cartItemId);
            setItemToRemove(null);
          }
        }}
        onCancel={() => setItemToRemove(null)}
      />
    </>
  );
};
