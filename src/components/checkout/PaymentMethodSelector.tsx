import React from 'react';
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Store,
  Smartphone,
  Info
} from 'lucide-react';
import { PaymentMethod, OrderType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  orderType: OrderType;
  amount?: number;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  orderType,
}) => {
  const { t, isTamil } = useLanguage();
  const { showInfo } = useNotification();

  const handlePayOnlineClick = () => {
    showInfo(
      'Coming Soon',
      'விரைவில் வரும்',
      'Online payments will be available soon. Please use Cash on Delivery or Pay at Store.',
      'இணையவழி கட்டண சேவை விரைவில் தொடங்கப்படவுள்ளது. தற்போது டெலிவரி அல்லது கடையில் பணம் செலுத்தவும்.'
    );
  };

  const handleCodClick = () => {
    if (orderType === 'DELIVERY') {
      onSelectMethod('CASH_ON_DELIVERY');
    } else {
      showInfo(
        'Home Delivery Only',
        'வீட்டு டெலிவரிக்கு மட்டும்',
        'Cash on Delivery is available for Home Delivery orders. For store pickup, please select Pay at Store.',
        'பொருளைப் பெற்றதும் பணம் செலுத்தும் முறை வீட்டு டெலிவரிக்கு மட்டுமே பொருந்தும். கடை பிக்கப்பிற்கு கடையில் செலுத்தவும் என்பதைத் தேர்ந்தெடுக்கவும்.'
      );
    }
  };

  const handlePayAtStoreClick = () => {
    if (orderType === 'PICKUP') {
      onSelectMethod('PAY_AT_STORE');
    } else {
      showInfo(
        'Store Pickup Only',
        'கடை பிக்கப்பிற்கு மட்டும்',
        'Pay at Store is available for Store Pickup orders. For home delivery, please select Cash on Delivery.',
        'கடையில் பணம் செலுத்தும் முறை நேரடி கடை பிக்கப்பிற்கு மட்டுமே பொருந்தும். வீட்டு டெலிவரிக்கு கேஷ் ஆன் டெலிவரியைத் தேர்ந்தெடுக்கவும்.'
      );
    }
  };

  const isDelivery = orderType === 'DELIVERY';
  const isPickup = orderType === 'PICKUP';

  return (
    <div className="space-y-4">
      {/* Header with Trust Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h4 className="text-xs sm:text-sm font-black text-neutral-800 uppercase tracking-wider">
            {t('checkout.paymentMethod')}
          </h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            {isTamil
              ? 'உங்கள் வசதிக்கேற்ப பணம் செலுத்தும் முறையைத் தேர்வு செய்யவும்'
              : 'Choose your preferred payment method'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 w-fit">
          <ShieldCheck size={13} />
          <span>{isTamil ? '100% பாதுகாப்பானது · கூடுதல் கட்டணம் இல்லை' : '100% Safe · Zero Extra Fees'}</span>
        </span>
      </div>

      <div className="space-y-3">
        {/* ========================================================= */}
        {/* CARD 1: PAY ONLINE (Disabled, Coming Soon)               */}
        {/* ========================================================= */}
        <div
          onClick={handlePayOnlineClick}
          role="button"
          tabIndex={-1}
          aria-disabled="true"
          className="relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200 bg-stone-50/70 text-stone-600 transition-all cursor-not-allowed select-none opacity-85 hover:border-amber-200"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Online Icon */}
            <div className="w-11 h-11 rounded-2xl bg-stone-200/80 text-stone-500 flex items-center justify-center flex-shrink-0 shadow-2xs">
              <CreditCard size={22} strokeWidth={2.2} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-neutral-800">
                    {t('checkout.payOnline')}
                  </span>
                </div>

                {/* Clearly Visible Amber COMING SOON Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  <Clock size={11} className="text-amber-700" />
                  <span>{t('checkout.payOnlineComingSoon')}</span>
                </span>
              </div>

              {/* Supported payment badges upcoming */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600">
                  <Smartphone size={10} className="text-blue-600" />
                  UPI
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600">
                  Google Pay
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600">
                  PhonePe
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600">
                  Paytm
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-bold text-stone-600">
                  Cards & Net Banking
                </span>
              </div>

              {/* Informational Message */}
              <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/60 rounded-xl px-2.5 py-1.5 leading-relaxed">
                <Info size={13} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <span>{t('checkout.payOnlineDesc')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 2: CASH ON DELIVERY (Available for Home Delivery)    */}
        {/* ========================================================= */}
        <div
          onClick={handleCodClick}
          role="button"
          tabIndex={isDelivery ? 0 : -1}
          aria-selected={selectedMethod === 'CASH_ON_DELIVERY'}
          className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
            isDelivery
              ? selectedMethod === 'CASH_ON_DELIVERY'
                ? 'border-2 border-raakky-red bg-raakky-red/5 ring-2 ring-raakky-red/20 shadow-xs cursor-pointer'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 cursor-pointer active:scale-[0.99]'
              : 'border-stone-200 bg-stone-50/60 opacity-55 cursor-not-allowed select-none'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Cash Icon */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                isDelivery && selectedMethod === 'CASH_ON_DELIVERY'
                  ? 'bg-emerald-600 text-white'
                  : isDelivery
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-400'
              }`}
            >
              <Banknote size={22} strokeWidth={2.4} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-neutral-900">
                    {t('checkout.cashOnDelivery')}
                  </span>
                  {isDelivery ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      <span>{t('checkout.availableBadge')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-stone-500 bg-stone-100">
                      {t('checkout.forDeliveryOnly')}
                    </span>
                  )}
                </div>

                {/* Selected Radio Indicator */}
                {isDelivery && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedMethod === 'CASH_ON_DELIVERY'
                        ? 'border-raakky-red bg-raakky-red text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {selectedMethod === 'CASH_ON_DELIVERY' && <Check size={12} strokeWidth={3} />}
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {t('checkout.cashOnDeliveryDesc')}
              </p>

              {/* Benefits note */}
              {isDelivery && (
                <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
                  <span>{t('checkout.cashOnDeliveryNote')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CARD 3: PAY AT STORE (Available for Store Pickup)         */}
        {/* ========================================================= */}
        <div
          onClick={handlePayAtStoreClick}
          role="button"
          tabIndex={isPickup ? 0 : -1}
          aria-selected={selectedMethod === 'PAY_AT_STORE'}
          className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 ${
            isPickup
              ? selectedMethod === 'PAY_AT_STORE'
                ? 'border-2 border-raakky-red bg-raakky-red/5 ring-2 ring-raakky-red/20 shadow-xs cursor-pointer'
                : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/60 cursor-pointer active:scale-[0.99]'
              : 'border-stone-200 bg-stone-50/60 opacity-55 cursor-not-allowed select-none'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Store Icon */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                isPickup && selectedMethod === 'PAY_AT_STORE'
                  ? 'bg-amber-600 text-white'
                  : isPickup
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-stone-200 text-stone-400'
              }`}
            >
              <Store size={22} strokeWidth={2.4} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-neutral-900">
                    {t('checkout.payAtStore')}
                  </span>
                  {isPickup ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 size={11} />
                      <span>{t('checkout.availableBadge')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-stone-500 bg-stone-100">
                      {t('checkout.forPickupOnly')}
                    </span>
                  )}
                </div>

                {/* Selected Radio Indicator */}
                {isPickup && (
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedMethod === 'PAY_AT_STORE'
                        ? 'border-raakky-red bg-raakky-red text-white'
                        : 'border-stone-300 bg-white'
                    }`}
                  >
                    {selectedMethod === 'PAY_AT_STORE' && <Check size={12} strokeWidth={3} />}
                  </div>
                )}
              </div>

              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {t('checkout.payAtStoreDesc')}
              </p>

              {/* Benefits note */}
              {isPickup && (
                <div className="mt-2 text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                  <span>{t('checkout.payAtStoreNote')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
