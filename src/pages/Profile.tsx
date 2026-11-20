import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { CustomerAddress } from '../types';

export const Profile: React.FC = () => {
  const { t, language, setLanguage, isTamil } = useLanguage();
  const {
    customer,
    isAuthenticated,
    isPhoneVerified,
    logout,
    updateProfile,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuth();
  const { showSuccess, showInfo, showError } = useNotification();

  // Profile edit state
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  // Address modal / addition state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home' as 'Home' | 'Work' | 'Other',
    recipientName: customer?.name || '',
    recipientPhone: customer?.phone || '',
    flatNumber: '',
    streetAddress: '',
    landmark: '',
    pincode: '641019',
    deliveryNotes: '',
    isDefault: false,
  });

  // Dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(name, email);
      setIsEditing(false);
      showSuccess(
        'Profile Updated',
        'சுயவிவரம் புதுப்பிக்கப்பட்டது',
        'Your profile changes have been saved',
        'உங்கள் சுயவிவர மாற்றங்கள் சேமிக்கப்பட்டன'
      );
    } catch (err: any) {
      showError('Update Failed', 'தோல்வியுற்றது', err.message, err.message);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.streetAddress.trim() || !formData.flatNumber.trim()) {
      showError('Required Fields', 'தேவையான விவரங்கள்', 'Please fill street and flat number', 'தயவுசெய்து வீட்டு எண் மற்றும் தெரு முகவரியை உள்ளிடவும்');
      return;
    }

    try {
      await saveAddress(formData);
      setShowAddressForm(false);
      setFormData({
        label: 'Home',
        recipientName: customer?.name || '',
        recipientPhone: customer?.phone || '',
        flatNumber: '',
        streetAddress: '',
        landmark: '',
        pincode: '641019',
        deliveryNotes: '',
        isDefault: false,
      });
      showSuccess('Address Saved', 'முகவரி சேமிக்கப்பட்டது', 'New address added to profile', 'புதிய முகவரி சேர்க்கப்பட்டது');
    } catch (err: any) {
      showError('Save Failed', 'சேமிக்க முடியவில்லை', err.message, err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4 md:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Profile Header Card */}
        <div className="mb-6 overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-raakky-red to-raakky-orange text-2xl font-black text-white shadow-md">
                {(customer?.name || 'R').charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-black text-neutral-900 sm:text-3xl">
                    {customer?.name || (isTamil ? 'அன்புள்ள வாடிக்கையாளர்' : 'Valued Customer')}
                  </h1>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
                  {customer?.phone && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      +91 {customer.phone} ({isTamil ? 'சரிபார்க்கப்பட்டது' : 'Verified'})
                    </span>
                  )}
                  {customer?.email && (
                    <span className="inline-flex items-center gap-1 text-stone-500">
                      <Mail className="h-3.5 w-3.5" />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100"
            >
              {isEditing ? t('common.cancel') : (isTamil ? 'சுயவிவரம் மாற்ற' : 'Edit Profile')}
            </button>
          </div>

          {/* Edit Profile inline form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="mt-6 border-t border-stone-100 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    {isTamil ? 'உங்கள் பெயர்' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">
                    {isTamil ? 'மின்னஞ்சல் (விருப்பத்தேர்வு)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="rounded-2xl bg-raakky-red px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-raakky-red-dark"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 1: Language Preference */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-raakky-cream text-raakky-orange">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">
                  {isTamil ? 'மொழி விருப்பம்' : 'Language Preference'}
                </h3>
                <p className="text-xs text-stone-500">
                  {isTamil ? 'தமிழ் அல்லது ஆங்கிலம் தேர்ந்தெடுக்கவும்' : 'Choose your preferred language (Tamil / English)'}
                </p>
              </div>
            </div>

            <div className="flex rounded-2xl border border-stone-200 bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  language === 'en'
                    ? 'bg-white text-raakky-red shadow-sm'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ta')}
                className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all ${
                  language === 'ta'
                    ? 'bg-raakky-red text-white shadow-sm'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Saved Delivery Addresses */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-neutral-900">
                  {isTamil ? 'சேமிக்கப்பட்ட முகவரிகள்' : 'Saved Delivery Addresses'}
                </h3>
                <p className="text-xs text-stone-500">
                  {customer?.addresses?.length || 0} {isTamil ? 'முகவரிகள்' : 'saved locations'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddressForm(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-neutral-900 hover:bg-stone-100 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isTamil ? 'புதிய முகவரி' : 'Add Address'}</span>
            </button>
          </div>

          {/* New address form */}
          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="mb-6 rounded-2xl border border-stone-200 bg-stone-50/50 p-4">
              <h4 className="mb-3 font-heading text-xs font-bold uppercase tracking-wider text-stone-700">
                {isTamil ? 'புதிய முகவரி சேர்த்தல்' : 'Add New Delivery Address'}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Recipient Name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit Phone"
                    value={formData.recipientPhone}
                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat No."
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Street / Area Name"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Landmark"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Pincode (641019)"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-raakky-red focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="rounded-2xl border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-raakky-red px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-raakky-red-dark"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          )}

          {/* List of addresses */}
          {customer?.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-3">
              {customer.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="flex items-start justify-between rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4"
                >
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="font-bold text-neutral-900">{addr.recipientName}</strong>
                      <span className="rounded-full bg-raakky-orange/10 px-2 py-0.5 text-[10px] font-bold text-raakky-orange">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600">
                      {addr.flatNumber}, {addr.streetAddress}, {addr.landmark && `${addr.landmark}, `}Coimbatore - {addr.pincode}
                    </p>
                    <p className="text-[11px] text-stone-500">Phone: +91 {addr.recipientPhone}</p>
                  </div>

                  <button
                    onClick={() => setAddressToDelete(addr.id)}
                    className="rounded-xl p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    title={isTamil ? 'முகவரியை நீக்க' : 'Delete Address'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-stone-500 py-4">
              {isTamil ? 'முகவரிகள் எதுவும் சேமிக்கப்படவில்லை.' : 'No saved addresses yet.'}
            </p>
          )}
        </div>

        {/* Section 3: Shop Help & Operating Hours */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-base font-bold text-neutral-900">
            {isTamil ? 'உதவி & கடை தொடர்பு' : 'Help & Store Support'}
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <a
              href="tel:+919843599030"
              className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3.5 transition-colors hover:border-raakky-red hover:bg-stone-50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-raakky-cream text-raakky-red">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-neutral-900">+91 98435 99030</strong>
                <span className="text-stone-500">Counter Telephone & WhatsApp</span>
              </div>
            </a>

            <div className="flex items-center gap-3 rounded-2xl border border-stone-200 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <strong className="block text-neutral-900">Mon - Sat: 7 AM - 9 PM</strong>
                <span className="text-stone-500">Sunday Market: 4 AM - 9 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Logout */}
        <div className="rounded-3xl border border-red-200 bg-red-50/50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-red-900">
                {isTamil ? 'வெளியேறு' : 'Sign Out'}
              </h3>
              <p className="text-xs text-red-700">
                {isTamil ? 'உங்கள் கணக்கிலிருந்து வெளியேறலாம்' : 'Sign out from this customer device'}
              </p>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-red-600 shadow-sm hover:bg-red-100 active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              <span>{isTamil ? 'வெளியேறு' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={isTamil ? 'வெளியேற விரும்புகிறீர்களா?' : 'Sign out?'}
        message={isTamil ? 'உங்கள் சாதனத்திலிருந்து கணக்கு வெளியேற்றப்படும்.' : 'Are you sure you want to sign out from your customer account?'}
        confirmText={isTamil ? 'வெளியேறு' : 'Sign Out'}
        cancelText={t('common.cancel')}
        isDestructive
        onConfirm={() => {
          logout();
          setShowLogoutConfirm(false);
          showInfo('Signed Out', 'வெளியேறிவிட்டீர்கள்', 'You have been signed out successfully', 'வெற்றிகரமாக வெளியேறிவிட்டீர்கள்');
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Address Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(addressToDelete)}
        title={isTamil ? 'முகவரியை நீக்கவா?' : 'Delete Address?'}
        message={isTamil ? 'இந்த முகவரியை நிச்சயமாக நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to remove this delivery address?'}
        confirmText={isTamil ? 'நீக்கு' : 'Delete'}
        cancelText={t('common.cancel')}
        isDestructive
        onConfirm={async () => {
          if (addressToDelete) {
            await deleteAddress(addressToDelete);
            setAddressToDelete(null);
            showInfo('Address Removed', 'முகவரி நீக்கப்பட்டது', 'Address removed from profile', 'முகவரி நீக்கப்பட்டது');
          }
        }}
        onCancel={() => setAddressToDelete(null)}
      />
    </div>
  );
};
