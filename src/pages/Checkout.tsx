import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Phone,
  Clock,
  Sparkles,
  AlertCircle,
  Truck,
  Store,
  Scissors
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import { useNotification } from '../contexts/NotificationContext';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps';
import { PickupStoreCard } from '../components/checkout/PickupStoreCard';
import { DeliveryAddressForm } from '../components/checkout/DeliveryAddressForm';
import { PaymentMethodSelector } from '../components/checkout/PaymentMethodSelector';
import { ChilliSpinner } from '../components/loaders/ChilliSpinner';
import { api, SUPPORTED_LOCALITIES } from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import { OrderType, PaymentMethod, CustomerAddress } from '../types';

export const Checkout: React.FC = () => {
  const { t, isTamil, language } = useLanguage();
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, packagingFee, finalTotal, clearCart } = useCart();
  const { customer, isAuthenticated, isPhoneVerified, sendOtp, verifyOtp } = useAuth();
  const { settings, isPaused, pauseReason } = useShop();
  const { showSuccess, showError, showWarning } = useNotification();

  // Current Step (1: Auth, 2: Fulfilment, 3: Payment, 4: Review)
  const [currentStep, setCurrentStep] = useState<number>(isPhoneVerified ? 2 : 1);

  // Auth Inputs
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fulfilment state
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(
    customer?.addresses?.[0] || null
  );

  // Payment state - Strictly synced with fulfilment mode:
  // Delivery -> Cash on Delivery
  // Pickup -> Pay at Store
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');

  // Enforce business logic: Delivery -> CASH_ON_DELIVERY, Pickup -> PAY_AT_STORE
  useEffect(() => {
    if (orderType === 'DELIVERY' && paymentMethod !== 'CASH_ON_DELIVERY') {
      setPaymentMethod('CASH_ON_DELIVERY');
    } else if (orderType === 'PICKUP' && paymentMethod !== 'PAY_AT_STORE') {
      setPaymentMethod('PAY_AT_STORE');
    }
  }, [orderType]);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Redirect if cart empty
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-raakky-cream text-raakky-orange">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          {t('cart.emptyTitle')}
        </h2>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('cart.startShopping')}</span>
        </Link>
      </div>
    );
  }

  // 1. Auth Handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleaned = phoneInput.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setAuthError(isTamil ? '10 இலக்க மொபைல் எண்ணை உள்ளிடவும்' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setIsSendingOtp(true);
    const res = await sendOtp(cleaned);
    setIsSendingOtp(false);
    if (res.success) {
      setOtpSent(true);
    } else {
      setAuthError(res.message);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!otpInput.trim() || otpInput.length < 4) {
      setAuthError(isTamil ? 'OTP எண்ணை உள்ளிடவும்' : 'Please enter the verification code');
      return;
    }
    setIsVerifyingOtp(true);
    const cleaned = phoneInput.replace(/\D/g, '');
    const success = await verifyOtp(cleaned, otpInput);
    setIsVerifyingOtp(false);
    if (success) {
      setCurrentStep(2);
    } else {
      setAuthError(isTamil ? 'தவறான OTP குறியீடு. மீண்டும் முயற்சிக்கவும்.' : 'Invalid OTP code. Please try again.');
    }
  };

  // Effective Delivery Fee
  const effectiveDeliveryFee = orderType === 'PICKUP' ? 0 : deliveryFee;
  const calculatedPayable = subtotal + effectiveDeliveryFee + packagingFee;

  // Step Navigation Validation
  const goToNextStep = () => {
    setSubmissionError(null);

    if (currentStep === 1) {
      if (!isPhoneVerified) {
        showWarning('Verification Required', 'சரிபார்ப்பு தேவை', 'Please verify your phone number to proceed', 'தொடர உங்கள் மொபைல் எண்ணைச் சரிபார்க்கவும்');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (orderType === 'DELIVERY') {
        if (!selectedAddress) {
          showWarning('Address Required', 'முகவரி தேவை', 'Please select or add a delivery address', 'டெலிவரி முகவரியைத் தேர்வு செய்யவும்');
          return;
        }

        // Validate supported localities
        const isLocalitySupported = selectedAddress.localityId && SUPPORTED_LOCALITIES.some(l => l.id === selectedAddress.localityId);
        if (!isLocalitySupported) {
          showError(
            'Delivery Unavailable in Locality',
            'இப்பகுதிக்கு டெலிவரி இல்லை',
            'Delivery is only available in Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, and Mathampalayam. Please choose Store Pickup or call our shop.',
            'டெலிவரி பிரஸ் காலனி, வீரபாண்டி பிரிவு, பெரியநாயக்கன்பாளையம் மற்றும் மாதம்பாளையம் ஆகிய 4 பகுதிகளுக்கு மட்டுமே உள்ளது. கடையில் பெறத் தேர்ந்தெடுக்கவும்.'
          );
          return;
        }
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
  };

  // 4. Final Place Order Submission
  const handlePlaceOrder = async () => {
    if (isPaused) {
      showError(
        'Ordering Temporarily Paused',
        'ஆர்டர்கள் தற்காலிகமாக நிறுத்தம்',
        pauseReason.en,
        pauseReason.ta
      );
      return;
    }

    if (orderType === 'DELIVERY' && !selectedAddress) {
      showWarning('Address Required', 'முகவரி தேவை', 'Please select delivery address', 'முகவரியைத் தேர்ந்தெடுக்கவும்');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Record selected cash payment method strictly by fulfilment mode
      const selectedPayMethod: PaymentMethod = orderType === 'DELIVERY' ? 'CASH_ON_DELIVERY' : 'PAY_AT_STORE';

      const orderPayload = {
        customerId: customer?.id || `cust-${Date.now()}`,
        customerName: customer?.name || selectedAddress?.recipientName || 'Valued Customer',
        customerPhone: customer?.phone || selectedAddress?.recipientPhone || phoneInput,
        orderType,
        deliveryAddress: orderType === 'DELIVERY' && selectedAddress ? selectedAddress : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          productNameEn: i.productNameEn,
          productNameTa: i.productNameTa,
          imageUrl: i.imageUrl,
          weightGrams: i.weightGrams,
          weightLabelEn: i.weightLabelEn,
          weightLabelTa: i.weightLabelTa,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          subtotal: i.unitPrice * i.quantity,
          cutType: i.cuttingPreference.cutType,
          skinType: i.cuttingPreference.skinType,
          specialInstructions: i.cuttingPreference.specialInstructions,
        })),
        itemTotal: subtotal,
        deliveryFee: effectiveDeliveryFee,
        packagingFee,
        discount: 0,
        finalTotal: calculatedPayable,
        paymentMethod: selectedPayMethod,
        // Business Rule: Never mark an order as paid merely because submitted.
        // Payment remains unpaid (PENDING) until shop confirms receipt.
        paymentStatus: 'PENDING' as const,
      };

      // Submit verified order to Cloudflare backend
      const createdOrder = await api.createOrder(orderPayload as any);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 110,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D62828', '#F77F00', '#FCBF49', '#10B981'],
        });
      } catch (e) {
        // ignore confetti errors
      }

      // Show central toast
      showSuccess(
        'Order Received!',
        'ஆர்டர் பெறப்பட்டது!',
        `Order #${createdOrder.orderNumber} sent to shop counter`,
        `ஆர்டர் #${createdOrder.orderNumber} கடைக்கு அனுப்பப்பட்டது`
      );

      // Clear cart
      clearCart();

      // Navigate to live tracking page
      navigate(`/order/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      const errMsg = err.message || 'Failed to place order. Please try again.';
      setSubmissionError(errMsg);
      showError('Order Failed', 'ஆர்டர் தோல்வியுற்றது', errMsg, errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case 'CASH_ON_DELIVERY':
        return isTamil
          ? 'பொருளைப் பெற்றதும் பணம் (Cash on Delivery)'
          : 'Cash on Delivery (Pay at doorstep)';
      case 'PAY_AT_STORE':
        return isTamil
          ? 'கடையில் பணம் செலுத்தவும் (Pay at Counter)'
          : 'Pay at Store Counter (Cash / UPI at counter)';
      default:
        return orderType === 'DELIVERY'
          ? (isTamil ? 'பொருளைப் பெற்றதும் பணம் (Cash on Delivery)' : 'Cash on Delivery')
          : (isTamil ? 'கடையில் பணம் செலுத்தவும்' : 'Pay at Store Counter');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4 md:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb back */}
        <Link
          to="/cart"
          className="group mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 transition-colors hover:text-raakky-red"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>{isTamil ? 'கூடைக்குத் திரும்ப' : 'Back to Cart'}</span>
        </Link>

        {/* Title & Progress Tracker */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {t('checkout.title')}
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            {isTamil
              ? 'சுலபமான 4 படிகளில் உங்கள் ஆர்டரை உறுதி செய்து நேரடியாக கடைக்கு அனுப்பவும்.'
              : 'Complete your fresh chicken order in 4 quick steps and send directly to the shop counter.'}
          </p>

          <div className="mt-6">
            <CheckoutSteps currentStep={currentStep} onStepClick={(s) => s < currentStep && setCurrentStep(s)} />
          </div>
        </div>

        {/* Error Callout */}
        {submissionError && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-4 text-red-900">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="text-xs sm:text-sm">
              <strong className="font-bold">{t('common.error')}:</strong> {submissionError}
            </div>
          </div>
        )}

        {/* Main Step Flow Container */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
          {/* ================= STEP 1: AUTHENTICATION ================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-raakky-red">
                  Step 1 of 4
                </span>
                <h2 className="font-heading text-2xl font-black text-neutral-900">
                  {t('checkout.step1')}
                </h2>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  {isTamil
                    ? 'ஆர்டரின் நிலையை அறியவும், டெலிவரியாளர் தொடர்பு கொள்ளவும் மொபைல் எண் தேவை.'
                    : 'A verified mobile number is required so our shop can send order confirmation.'}
                </p>
              </div>

              {authError && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4 max-w-md">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-700">
                      {isTamil ? 'மொபைல் எண்' : 'Indian Mobile Number'} *
                    </label>
                    <div className="flex rounded-2xl border border-stone-200 bg-stone-50/50 p-1">
                      <span className="flex items-center px-3 text-xs font-bold text-stone-500">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="98435 99030"
                        className="w-full bg-transparent py-2.5 pr-3 text-sm font-bold text-neutral-900 placeholder-stone-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp || phoneInput.length !== 10}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-raakky-red py-3.5 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-raakky-red-dark active:scale-[0.99] disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <ChilliSpinner size="sm" />
                    ) : (
                      <span>{t('auth.sendOtp')}</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md">
                  <div className="flex items-center justify-between text-xs text-stone-600">
                    <span>
                      {isTamil ? 'OTP அனுப்பப்பட்டது:' : 'OTP sent to:'}{' '}
                      <strong className="text-neutral-900 font-mono">+91 {phoneInput}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="font-bold text-raakky-red hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-stone-700">
                      {isTamil ? 'OTP எண்ணை உள்ளிடவும்' : 'Enter 6-Digit OTP'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-2xl font-black tracking-widest rounded-2xl border border-stone-200 bg-stone-50/50 py-3 text-neutral-900 focus:border-raakky-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-raakky-red/20"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpInput.length < 4}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-raakky-red py-3.5 font-heading text-sm font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-raakky-red-dark active:scale-[0.99] disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <ChilliSpinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{t('auth.verifyOtp')}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= STEP 2: FULFILMENT TYPE & ADDRESS ================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-raakky-red">
                  Step 2 of 4
                </span>
                <h2 className="font-heading text-2xl font-black text-neutral-900">
                  {t('checkout.step2')}
                </h2>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  {isTamil
                    ? 'வீட்டு டெலிவரி (4 குறிப்பிட்ட பகுதிகள்) அல்லது கடையில் நேரில் பெற்றுக் கொள்ளும் முறையைத் தேர்ந்தெடுக்கவும்.'
                    : 'Choose whether you want local door delivery (Press Colony, Veerapandi Pirivu, Periyanaickenpalayam, Mathampalayam) or direct store pickup.'}
                </p>
              </div>

              {/* Fulfilment Toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
                    orderType === 'DELIVERY'
                      ? 'border-raakky-red bg-raakky-red/5 ring-2 ring-raakky-red'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <Truck size={22} className={orderType === 'DELIVERY' ? 'text-raakky-red' : 'text-stone-500'} />
                  <span className="font-heading text-base font-black text-neutral-900">
                    {isTamil ? 'வீட்டு டெலிவரி' : 'Home Delivery'}
                  </span>
                  <span className="text-xs text-stone-500">
                    {effectiveDeliveryFee === 0 ? 'FREE' : formatCurrency(effectiveDeliveryFee)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('PICKUP')}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
                    orderType === 'PICKUP'
                      ? 'border-raakky-red bg-raakky-red/5 ring-2 ring-raakky-red'
                      : 'border-stone-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <Store size={22} className={orderType === 'PICKUP' ? 'text-raakky-red' : 'text-stone-500'} />
                  <span className="font-heading text-base font-black text-neutral-900">
                    {isTamil ? 'கடையில் பெறுதல்' : 'Store Pickup'}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    FREE • Ready in 20m
                  </span>
                </button>
              </div>

              {/* Fulfilment Details Form */}
              {orderType === 'DELIVERY' ? (
                <div className="space-y-4">
                  <DeliveryAddressForm
                    selectedAddress={selectedAddress}
                    onSelectAddress={setSelectedAddress}
                    onSwitchToPickup={() => setOrderType('PICKUP')}
                  />
                </div>
              ) : (
                <PickupStoreCard />
              )}

              {/* Step Navigation CTA */}
              <div className="flex items-center justify-between border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900"
                >
                  {isTamil ? 'முந்தைய படி' : 'Previous Step'}
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark active:scale-95"
                >
                  {isTamil ? 'அடுத்தது: பணம் செலுத்தும் முறை' : 'Next: Payment Method'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PAYMENT METHOD SELECTION ================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-raakky-red">
                  Step 3 of 4
                </span>
                <h2 className="font-heading text-2xl font-black text-neutral-900">
                  {t('checkout.step3')}
                </h2>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  {isTamil
                    ? 'உங்கள் வசதிக்கேற்ப பணம் செலுத்தும் முறையைத் தேர்வு செய்யவும். ஆர்டர் பெற்றதும் செலுத்தலாம்.'
                    : 'Choose how you would like to pay. Pay conveniently upon receiving your fresh order.'}
                </p>
              </div>

              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                orderType={orderType}
                onSelectMethod={setPaymentMethod}
              />

              <div className="flex items-center justify-between border-t border-stone-100 pt-5">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold uppercase tracking-wider text-stone-600 hover:text-stone-900"
                >
                  {isTamil ? 'முந்தைய படி' : 'Previous Step'}
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark active:scale-95"
                >
                  {isTamil ? 'அடுத்தது: மதிப்பாய்வு' : 'Next: Review Order'}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: FINAL ORDER SUMMARY & SUBMIT ================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-raakky-red">
                  Step 4 of 4
                </span>
                <h2 className="font-heading text-2xl font-black text-neutral-900">
                  {t('checkout.step4')}
                </h2>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  {isTamil
                    ? 'கடைசி முறை உங்கள் ஆர்டர் விவரங்களைச் சரிபார்த்து உறுதி செய்யவும்.'
                    : 'Please review your items, cut preferences, address, and total amount before confirming.'}
                </p>
              </div>

              {/* Items summary */}
              <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-4">
                <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('cart.title')} ({items.length} {isTamil ? 'பொருட்கள்' : 'items'})
                </h3>
                <div className="divide-y divide-stone-200">
                  {items.map((i) => (
                    <div key={i.cartItemId} className="flex items-center justify-between py-2 text-xs">
                      <div>
                        <span className="font-bold text-neutral-900">
                          {isTamil ? i.productNameTa : i.productNameEn}
                        </span>{' '}
                        <span className="text-stone-500">
                          ({formatWeight(i.weightGrams, language)}) x {i.quantity}
                        </span>
                        {i.cuttingPreference && (
                          <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Scissors size={12} className="text-stone-400" />
                            <span>{i.cuttingPreference.cutType} • {i.cuttingPreference.skinType}</span>
                          </div>
                        )}
                      </div>
                      <div className="font-heading font-black text-neutral-900">
                        {formatCurrency(i.unitPrice * i.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fulfilment & Payment Summary card */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {orderType === 'DELIVERY' ? (isTamil ? 'வீட்டு டெலிவரி' : 'Home Delivery') : (isTamil ? 'கடையில் பெறுதல்' : 'Store Pickup')}
                  </h4>
                  {orderType === 'DELIVERY' && selectedAddress ? (
                    <p className="mt-1 text-xs text-stone-700 leading-relaxed">
                      <strong>{selectedAddress.recipientName}</strong> ({selectedAddress.recipientPhone})<br />
                      {selectedAddress.flatNumber}, {selectedAddress.streetAddress}, {selectedAddress.localityName && `${selectedAddress.localityName}, `}Coimbatore - {selectedAddress.pincode}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-stone-700 leading-relaxed">
                      81, Thiruvalluvar Nagar, Press Colony, Coimbatore, Tamil Nadu 641019
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-stone-200/80 bg-white p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {t('checkout.paymentMethod')}
                  </h4>
                  <p className="mt-1 text-xs font-bold text-neutral-900">
                    {getPaymentMethodDisplay()}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-500 leading-relaxed">
                    {orderType === 'DELIVERY'
                      ? (isTamil ? 'பொருளைப் பெற்றதும் ரொக்கமாகச் செலுத்தவும்' : 'Pay cash to delivery executive upon arrival')
                      : (isTamil ? 'கடை கவுன்டரில் ரொக்கம் அல்லது UPI மூலம் செலுத்தலாம்' : 'Pay cash or UPI at store counter upon pickup')}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/80 p-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>{t('cart.itemSubtotal')}</span>
                    <span className="font-bold text-neutral-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>{t('cart.deliveryFee')}</span>
                    <span className="font-bold text-emerald-600">
                      {effectiveDeliveryFee === 0 ? 'FREE' : formatCurrency(effectiveDeliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-black">
                    <span className="text-neutral-900">{t('common.total')}</span>
                    <span className="font-heading text-xl text-raakky-red">{formatCurrency(calculatedPayable)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order CTA */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-raakky-red py-4 font-heading text-base font-extrabold uppercase tracking-wider text-white shadow-spicy transition-all hover:bg-raakky-red-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <ChilliSpinner size="sm" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>{t('checkout.placeOrder', { total: calculatedPayable })}</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-stone-500">
                  {isTamil
                    ? 'ஆர்டர் உறுதி செய்யப்பட்டதும் உங்கள் ஆர்டர் கடைக்கு உடனடியாக அனுப்பப்படும்.'
                    : 'Order will be routed instantly to the shop counter for fresh cutting.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
