import React, { useState } from 'react';
import { AlertCircle, Check, Home, MapPin, Phone, Plus, Store } from 'lucide-react';
import { CustomerAddress, DeliveryLocalityId } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { SUPPORTED_LOCALITIES } from '../../services/api';

interface DeliveryAddressFormProps {
  selectedAddress: CustomerAddress | null;
  onSelectAddress: (address: CustomerAddress) => void;
  onSwitchToPickup?: () => void;
}

export const DeliveryAddressForm: React.FC<DeliveryAddressFormProps> = ({
  selectedAddress,
  onSelectAddress,
  onSwitchToPickup,
}) => {
  const { t, isTamil } = useLanguage();
  const { customer, saveAddress } = useAuth();

  const [isAddingNew, setIsAddingNew] = useState<boolean>(
    !customer?.addresses || customer.addresses.length === 0
  );

  const [selectedLocalityChoice, setSelectedLocalityChoice] = useState<DeliveryLocalityId | 'other'>(
    'press-colony'
  );

  const [formData, setFormData] = useState({
    label: 'Home' as 'Home' | 'Work' | 'Other',
    recipientName: customer?.name || '',
    recipientPhone: customer?.phone || '',
    flatNumber: '',
    streetAddress: '',
    localityId: 'press-colony' as DeliveryLocalityId,
    localityName: 'Press Colony',
    landmark: '',
    pincode: '641019',
    deliveryNotes: '',
    isDefault: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleLocalityChange = (locId: string) => {
    if (locId === 'other') {
      setSelectedLocalityChoice('other');
    } else {
      const match = SUPPORTED_LOCALITIES.find(l => l.id === locId);
      if (match) {
        setSelectedLocalityChoice(match.id);
        setFormData(p => ({
          ...p,
          localityId: match.id,
          localityName: isTamil ? match.nameTa : match.nameEn,
          pincode: match.defaultPincode,
        }));
      }
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.recipientName.trim()) errors.recipientName = isTamil ? 'பெயர் தேவை' : 'Name is required';
    if (!formData.recipientPhone.trim() || formData.recipientPhone.replace(/\D/g, '').length !== 10) {
      errors.recipientPhone = isTamil ? '10 இலக்க மொபைல் எண் தேவை' : '10-digit phone number is required';
    }
    if (!formData.flatNumber.trim()) errors.flatNumber = isTamil ? 'வீட்டு எண் தேவை' : 'House/Flat number is required';
    if (!formData.streetAddress.trim()) errors.streetAddress = isTamil ? 'தெரு முகவரி தேவை' : 'Street address is required';
    if (selectedLocalityChoice === 'other') {
      errors.locality = isTamil ? 'இப்பகுதிக்கு டெலிவரி இல்லை' : 'Delivery is not supported in this locality';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newAddr: CustomerAddress = {
      ...formData,
      id: `addr-${Date.now()}`,
    };

    await saveAddress(newAddr);
    onSelectAddress(newAddr);
    setIsAddingNew(false);
  };

  const savedAddresses = customer?.addresses || [];

  return (
    <div className="space-y-5">
      {/* 4-Localities Guarantee Notification */}
      <div className="p-3.5 rounded-2xl bg-raakky-cream/70 border border-stone-200 text-stone-800 text-xs flex items-start gap-2.5">
        <MapPin size={16} className="text-raakky-red flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">
            {isTamil ? 'அங்கீகரிக்கப்பட்ட டெலிவரி பகுதிகள்:' : 'Supported Delivery Localities:'}
          </span>{' '}
          <span>
            {isTamil
              ? 'பிரஸ் காலனி, வீரபாண்டி பிரிவு, பெரியநாயக்கன்பாளையம், மாதம்பாளையம்.'
              : 'Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, and Mathampalayam.'}
          </span>
        </div>
      </div>

      {savedAddresses.length > 0 && !isAddingNew && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              {t('checkout.selectAddress')}
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="text-xs font-bold text-raakky-red hover:underline flex items-center gap-1"
            >
              <Plus size={14} />
              <span>{t('checkout.addNewAddress')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map(addr => {
              const isSelected = selectedAddress?.id === addr.id;
              const isLocalitySupported = !addr.localityId || SUPPORTED_LOCALITIES.some(l => l.id === addr.localityId);

              return (
                <div
                  key={addr.id}
                  onClick={() => {
                    if (isLocalitySupported) onSelectAddress(addr);
                  }}
                  className={`p-4 rounded-3xl border text-left transition-all relative ${
                    !isLocalitySupported
                      ? 'border-red-200 bg-red-50/50 opacity-80 cursor-not-allowed'
                      : isSelected
                      ? 'border-raakky-red bg-raakky-red/5 ring-2 ring-raakky-red/20 shadow-xs cursor-pointer'
                      : 'border-stone-200 bg-white hover:border-stone-300 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-stone-100 text-stone-800">
                      {addr.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-raakky-red text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-bold text-neutral-900">{addr.recipientName}</p>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">{addr.recipientPhone}</p>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {addr.flatNumber}, {addr.streetAddress}
                  </p>
                  {addr.localityName && (
                    <p className="text-[11px] text-raakky-red font-bold mt-1">
                      {addr.localityName}
                    </p>
                  )}
                  {addr.landmark && (
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Landmark: {addr.landmark}
                    </p>
                  )}
                  <p className="text-[11px] text-stone-500 font-bold mt-1">Pincode: {addr.pincode}</p>

                  {!isLocalitySupported && (
                    <div className="mt-2 text-[10px] font-bold text-red-600">
                      {isTamil ? 'இப்பகுதிக்கு நேரடி டெலிவரி இல்லை' : 'Outside 4-locality delivery zone'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAddingNew && (
        <form onSubmit={handleSaveNewAddress} className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h4 className="text-sm font-bold text-neutral-900">
              {t('checkout.addNewAddress')}
            </h4>
            {savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs font-bold text-stone-500 hover:text-neutral-900"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>

          {/* Address Label Tags */}
          <div className="flex gap-2">
            {(['Home', 'Work', 'Other'] as const).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setFormData(p => ({ ...p, label: tag }))}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  formData.label === tag
                    ? 'bg-neutral-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Locality Selector Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              {t('deliveryLocalities.selectLocality')} *
            </label>
            <select
              value={selectedLocalityChoice}
              onChange={(e) => handleLocalityChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red bg-white"
            >
              {SUPPORTED_LOCALITIES.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {isTamil ? loc.nameTa : loc.nameEn} ({loc.defaultPincode})
                </option>
              ))}
              <option value="other">
                {t('deliveryLocalities.otherLocality')}
              </option>
            </select>
          </div>

          {/* Rejection / Warning banner if unsupported locality selected */}
          {selectedLocalityChoice === 'other' && (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-950 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-red-900">
                    {t('deliveryLocalities.unsupportedAreaTitle')}
                  </h5>
                  <p className="mt-0.5 leading-relaxed text-red-800">
                    {t('deliveryLocalities.unsupportedAreaDesc')}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-red-200/60">
                {onSwitchToPickup && (
                  <button
                    type="button"
                    onClick={onSwitchToPickup}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-red-300 font-bold text-xs text-red-900 hover:bg-red-100 flex items-center justify-center gap-1.5"
                  >
                    <Store size={14} />
                    <span>{isTamil ? 'கடையில் பெற மாற்றவும்' : 'Switch to Store Pickup'}</span>
                  </button>
                )}

                <a
                  href="tel:+919843599030"
                  className="flex-1 py-2 px-3 rounded-xl bg-raakky-red text-white font-bold text-xs hover:bg-raakky-red-dark flex items-center justify-center gap-1.5"
                >
                  <Phone size={14} />
                  <span>{isTamil ? 'கடையை அழைக்க (+91 98435 99030)' : 'Call Shop (+91 98435 99030)'}</span>
                </a>
              </div>
            </div>
          )}

          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {isTamil ? 'பெயர்' : 'Recipient Name'} *
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={e => setFormData(p => ({ ...p, recipientName: e.target.value }))}
                placeholder="E.g. Sundar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
              />
              {formErrors.recipientName && (
                <p className="text-[10px] text-red-500 mt-1">{formErrors.recipientName}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {isTamil ? 'மொபைல் எண்' : 'Phone Number'} *
              </label>
              <input
                type="tel"
                value={formData.recipientPhone}
                onChange={e => setFormData(p => ({ ...p, recipientPhone: e.target.value }))}
                placeholder="10-digit mobile"
                maxLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
              />
              {formErrors.recipientPhone && (
                <p className="text-[10px] text-red-500 mt-1">{formErrors.recipientPhone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              {t('checkout.streetAddress')} *
            </label>
            <input
              type="text"
              value={formData.flatNumber}
              onChange={e => setFormData(p => ({ ...p, flatNumber: e.target.value }))}
              placeholder="E.g. Door No. 14, 2nd Cross"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
            />
            {formErrors.flatNumber && (
              <p className="text-[10px] text-red-500 mt-1">{formErrors.flatNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {t('checkout.areaStreet')} *
              </label>
              <input
                type="text"
                value={formData.streetAddress}
                onChange={e => setFormData(p => ({ ...p, streetAddress: e.target.value }))}
                placeholder="E.g. Thiruvalluvar Nagar Main Road"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
              />
              {formErrors.streetAddress && (
                <p className="text-[10px] text-red-500 mt-1">{formErrors.streetAddress}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {t('checkout.landmark')}
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={e => setFormData(p => ({ ...p, landmark: e.target.value }))}
                placeholder="E.g. Near Bus Stand / Temple"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {t('checkout.pincode')}
              </label>
              <input
                type="text"
                readOnly
                value={formData.pincode}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono font-bold text-stone-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">
                {t('checkout.deliveryInstructions')}
              </label>
              <input
                type="text"
                value={formData.deliveryNotes}
                onChange={e => setFormData(p => ({ ...p, deliveryNotes: e.target.value }))}
                placeholder="E.g. Call before arrival"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-raakky-red/20 focus:border-raakky-red"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={selectedLocalityChoice === 'other'}
            className={`w-full py-3 px-4 text-xs font-bold rounded-2xl shadow-xs transition-all ${
              selectedLocalityChoice === 'other'
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-neutral-800 text-white'
            }`}
          >
            {t('common.save')} & Use Address
          </button>
        </form>
      )}
    </div>
  );
};
