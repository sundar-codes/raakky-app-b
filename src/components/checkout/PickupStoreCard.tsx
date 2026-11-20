import React from 'react';
import { Clock3, ExternalLink, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShop } from '../../contexts/ShopContext';

export const PickupStoreCard: React.FC = () => {
  const { t, isTamil } = useLanguage();
  const { settings } = useShop();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-card space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-raakky-red/10 text-raakky-red flex items-center justify-center">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900">{t('checkout.pickupLocationTitle')}</h4>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
              {isTamil ? 'டெலிவரி கட்டணம் இல்லை (₹0)' : 'No Delivery Fee (₹0)'}
            </span>
          </div>
        </div>

        <a
          href={settings.storeMapUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <span>{t('home.getDirections')}</span>
          <Navigation size={13} />
        </a>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p className="font-semibold text-neutral-900">
            {isTamil ? 'தி ராக்கி சிக்கன் — பிரஸ் காலனி கிளை' : 'The Raakky Chicken — Press Colony Branch'}
          </p>
          <p className="text-neutral-600 mt-1 leading-relaxed">
            {isTamil ? settings.storeAddressTa : settings.storeAddressEn}
          </p>
        </div>

        <div className="flex items-center gap-2 text-neutral-600 pt-1">
          <Clock3 size={15} className="text-raakky-orange" />
          <span>
            {isTamil ? 'தயாராகும் நேரம்' : 'Estimated Preparation'}:{' '}
            <strong className="text-neutral-900">20–25 mins</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-neutral-600">
          <Phone size={15} className="text-neutral-400" />
          <span>
            {isTamil ? 'கடை தொடர்பு' : 'Counter Contact'}:{' '}
            <strong className="text-neutral-900 font-mono">+91 98435 99030</strong>
          </span>
        </div>
      </div>

      <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-2.5 text-[11px] text-neutral-600">
        <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
        <span>{t('checkout.pickupHoursNote')}</span>
      </div>
    </div>
  );
};
