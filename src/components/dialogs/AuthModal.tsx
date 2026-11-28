import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  ArrowRight,
  RotateCw,
  Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ConfirmationResult } from 'firebase/auth';
import { formatIndianPhoneNumber } from '../../services/firebaseAuth';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalOptions,
    closeAuthModal,
    signInWithGoogle,
    signInWithGoogleRedirect,
    sendPhoneOtp,
    verifyAndLinkOtp,
    firebaseUser,
    isEmailVerified,
    isPhoneVerified,
    isGooglePopupPending,
    authNotice,
    clearAuthMessages,
    customer,
    logout,
  } = useAuth();
  const { isTamil } = useLanguage();

  // Modal Sub-steps: 'google' | 'phone' | 'otp' | 'success'
  const [step, setStep] = useState<'google' | 'phone' | 'otp' | 'success'>('google');

  // Input states
  const [phoneInput, setPhoneInput] = useState('');
  const [formattedE164, setFormattedE164] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Loading & error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);

  // Resend OTP countdown (30s)
  const [countdown, setCountdown] = useState(30);

  // Input refs for 6-digit OTP
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset or configure step when modal opens
  const isRecoveryMode = authModalOptions?.mode === 'recovery';

  useEffect(() => {
    if (isAuthModalOpen) {
      setLocalError(null);
      setBillingError(null);
      setOtpExpired(false);
      if (!firebaseUser) {
        setStep('google');
      } else if (isRecoveryMode && !isPhoneVerified) {
        setStep('phone');
        if (customer?.phone) {
          setPhoneInput(customer.phone);
        }
      } else {
        setStep('success');
      }
    }
  }, [isAuthModalOpen, firebaseUser, isPhoneVerified, isRecoveryMode, customer]);

  // Handle countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isAuthModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // 1. Google Sign-In Handler (synchronously runs signInWithPopup inside user click)
  const handleGoogleSignIn = () => {
    setLocalError(null);
    setBillingError(null);
    clearAuthMessages();

    const currentPath =
      typeof window !== 'undefined' ? window.location.pathname || '/checkout' : '/checkout';

    signInWithGoogle({ redirectPath: currentPath })
      .then((res) => {
        if (res.dismissed || res.blocked || res.redirecting) {
          return;
        }
        if (!res.success) {
          if (res.error) setLocalError(res.error);
          return;
        }

        // Unless explicitly invoked for account recovery OTP verification,
        // complete sign-in immediately after verified Google authentication without interrupting with OTP.
        if (!isRecoveryMode || res.hasLinkedPhone) {
          setStep('success');
          setTimeout(() => {
            authModalOptions?.onSuccess?.();
            closeAuthModal();
          }, 900);
        } else {
          // Recovery fallback mode only -> request Indian mobile number for OTP linking
          setStep('phone');
        }
      })
      .catch((err: any) => {
        setLocalError(err.message || 'Authentication error');
      });
  };

  // 2. Send SMS OTP Handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);
    setBillingError(null);
    setOtpExpired(false);

    const validation = formatIndianPhoneNumber(phoneInput);
    if (!validation.isValid) {
      setLocalError(
        isTamil
          ? 'சரியான 10 இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும் (6, 7, 8 அல்லது 9 இல் தொடங்க வேண்டும்)'
          : validation.error || 'Please enter a valid 10-digit Indian mobile number'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPhoneOtp(validation.e164, 'recaptcha-auth-modal-container');
      if (res.success && res.confirmationResult) {
        setConfirmationResult(res.confirmationResult);
        setFormattedE164(validation.e164);
        setStep('otp');
        setCountdown(30);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      } else if (res.isBillingError) {
        setBillingError(
          res.error || 'Real SMS verification is unavailable because Firebase Cloud Billing is not enabled.'
        );
      } else {
        setLocalError(
          res.error || (isTamil ? 'OTP அனுப்புவதில் பிழை' : 'Failed to send OTP. Please try again.')
        );
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. OTP Digit Change Handler (with paste support & auto-advance)
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanNumbers = value.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleanNumbers[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(cleanNumbers.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = cleanNumbers.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // 4. Verify OTP & Link Phone Handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLocalError(null);

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setLocalError(isTamil ? '6 இலக்க OTP குறியீட்டை உள்ளிடவும்' : 'Please enter all 6 digits of the OTP code');
      return;
    }

    if (!confirmationResult) {
      setLocalError(isTamil ? 'OTP அமர்வு காலாவதியானது. மீண்டும் முயற்சிக்கவும்.' : 'OTP session expired. Please resend code.');
      setOtpExpired(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyAndLinkOtp(confirmationResult, fullCode);
      if (res.success) {
        setStep('success');
        setTimeout(() => {
          authModalOptions?.onSuccess?.();
          closeAuthModal();
        }, 1200);
      } else {
        if (res.errorCode === 'auth/code-expired') {
          setOtpExpired(true);
          setCountdown(0);
        }
        setLocalError(res.error || (isTamil ? 'சரிபார்ப்பு தோல்வியடைந்தது' : 'Verification failed. Please check the code.'));
      }
    } catch (err: any) {
      setLocalError(err.message || 'Verification error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth (no display:none) */}
      <div id="recaptcha-auth-modal-container" />

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeAuthModal}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-6 sm:p-8 shadow-2xl z-10"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-raakky-red to-raakky-red-dark shadow-md p-2">
            <img
              src="/images/raakky-brand-badge.png"
              alt="Raakky Chicken"
              className="h-full w-full object-contain"
            />
          </div>

          <h2 className="font-heading text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            {step === 'google' && (isTamil ? 'உள்நுழைவு அல்லது பதிவு' : 'Customer Sign In')}
            {step === 'phone' && (isTamil ? 'மொபைல் எண் சரிபார்ப்பு' : 'Verify Mobile Number')}
            {step === 'otp' && (isTamil ? 'OTP குறியீட்டை உள்ளிடவும்' : 'Enter Verification Code')}
            {step === 'success' && (isTamil ? 'சரிபார்ப்பு முடிந்தது!' : 'Verified Successfully!')}
          </h2>

          <p className="mt-1 text-xs text-stone-500">
            {step === 'google' &&
              (authModalOptions?.reason ||
                (isTamil
                  ? 'உங்கள் ஆர்டர்களைக் கண்காணிக்கவும், முகவரிகளைச் சேமிக்கவும் உள்நுழையவும்.'
                  : 'Sign in to place orders, save delivery addresses, and track real-time counter status.'))}
            {step === 'phone' &&
              (isTamil
                ? 'ஆர்டர் உறுதிப்படுத்தல் மற்றும் டெலிவரி தகவல்களுக்காக 10 இலக்க எண்ணை உள்ளிடவும்.'
                : 'Required for order status updates and delivery communication.')}
            {step === 'otp' &&
              (isTamil
                ? `${formattedE164} என்ற எண்ணுக்கு அனுப்பப்பட்ட 6 இலக்க குறியீட்டை உள்ளிடவும்.`
                : `Enter the 6-digit SMS code sent to ${formattedE164}`)}
            {step === 'success' &&
              (isTamil
                ? 'உங்கள் கணக்கு சரிபார்க்கப்பட்டது. தொடர்கிறது...'
                : 'Your customer account is verified. Proceeding...')}
          </p>
        </div>

        {/* Calm non-blocking notice for popup dismissal / block */}
        {authNotice && !localError && !billingError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-stone-200 bg-raakky-cream/80 p-3.5 text-xs text-stone-700">
            <Info size={16} className="mt-0.5 flex-shrink-0 text-raakky-red" />
            <div className="flex-1 space-y-1">
              <p className="font-medium leading-relaxed">{authNotice.message}</p>
              {authNotice.type === 'blocked' && (
                <button
                  type="button"
                  onClick={() => signInWithGoogleRedirect(window.location.pathname || '/checkout')}
                  className="font-bold text-raakky-red hover:underline"
                >
                  {isTamil ? 'முழுப்பக்க Google உள்நுழைவைப் பயன்படுத்துக' : 'Continue via full-page Google redirect'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Billing Error Banner */}
        <AnimatePresence>
          {billingError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-2xl border border-raakky-red/30 bg-raakky-cream p-3.5 text-xs text-neutral-800 space-y-1.5"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-raakky-red" />
                <div>
                  <p className="font-bold text-raakky-red">
                    {isTamil ? 'உண்மையான SMS சரிபார்ப்பு கிடைக்கவில்லை' : 'Real SMS Verification Unavailable'}
                  </p>
                  <p className="mt-0.5 text-stone-700 leading-relaxed">{billingError}</p>
                  {import.meta.env.DEV && (
                    <p className="mt-1 text-[11px] text-stone-500">
                      {isTamil
                        ? 'உருவாக்குநர் சோதனை: Firebase Console-இல் அமைக்கப்பட்ட சோதனை எண்கள் மட்டுமே செயல்படும்.'
                        : 'Development mode: Configured Firebase test phone numbers work without Blaze billing enabled.'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* General Error Alert */}
        <AnimatePresence>
          {!billingError && localError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 font-medium space-y-1">
                <p>{localError}</p>
                {otpExpired && step === 'otp' && (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 font-bold text-raakky-red hover:underline"
                  >
                    <RotateCw size={12} />
                    <span>{isTamil ? 'புதிய OTP அனுப்புக' : 'Send a new OTP now'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 1: Google Sign-In */}
        {step === 'google' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGooglePopupPending || isSubmitting}
              className="w-full flex items-center justify-center gap-3.5 rounded-2xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-bold text-neutral-800 shadow-sm transition-all hover:bg-stone-50 hover:border-stone-400 active:scale-[0.98] disabled:opacity-60"
            >
              {isGooglePopupPending || isSubmitting ? (
                <Loader2 size={18} className="animate-spin text-raakky-red" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>
                {isGooglePopupPending
                  ? isTamil
                    ? 'Google சாளரத்திற்காக காத்திருக்கிறது...'
                    : 'Waiting for Google Sign-In...'
                  : isTamil
                    ? 'Google மூலம் தொடர்க'
                    : 'Continue with Google'}
              </span>
            </button>

            <div className="flex flex-col items-center gap-2 pt-1 text-center text-[11px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-stone-400" />
                <span>
                  {isTamil
                    ? 'உங்கள் விவரங்கள் பாதுகாப்பானவை. கடவுச்சொல் தேவையில்லை.'
                    : 'Fast, secure & encrypted sign-in. No password required.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => signInWithGoogleRedirect(window.location.pathname || '/checkout')}
                className="font-semibold text-stone-600 hover:text-raakky-red hover:underline"
              >
                {isTamil ? 'முழுப்பக்க உள்நுழைவு முறையைப் பயன்படுத்துக' : 'Trouble with popup? Sign in via redirect'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Phone Number Input (only if email is verified) */}
        {step === 'phone' && firebaseUser && !isEmailVerified && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {isTamil
                ? 'உங்கள் Google மின்னஞ்சல் சரிபார்க்கப்படவில்லை. சரிபார்க்கப்பட்ட Google கணக்கைப் பயன்படுத்தவும்.'
                : 'Your Google email address is not verified. Please sign in with a verified Google account.'}
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full rounded-2xl border border-stone-200 py-3 text-xs font-bold text-neutral-800 hover:bg-stone-50"
            >
              {isTamil ? 'வேறு கணக்கில் உள்நுழைக' : 'Sign out & switch account'}
            </button>
          </div>
        )}

        {step === 'phone' && (!firebaseUser || isEmailVerified) && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {firebaseUser && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-stone-50 p-3 text-xs text-stone-700 border border-stone-200">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-raakky-red/10 text-raakky-red font-bold text-xs">
                  {(firebaseUser.displayName || 'U').charAt(0)}
                </div>
                <div className="truncate flex-1">
                  <div className="font-bold text-neutral-900 truncate">
                    {firebaseUser.displayName || 'Customer'}
                  </div>
                  <div className="text-stone-500 text-[11px] truncate">{firebaseUser.email}</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Google ✓
                </span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-700">
                {isTamil ? 'இந்திய மொபைல் எண் (+91)' : 'Indian Mobile Number (+91)'}
              </label>

              <div className="relative flex items-center rounded-2xl border border-stone-300 bg-stone-50/50 focus-within:border-raakky-red focus-within:bg-white focus-within:ring-2 focus-within:ring-raakky-red/20 transition-all">
                <div className="flex items-center gap-1.5 border-r border-stone-200 px-3.5 py-3 text-xs font-extrabold text-stone-700">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="98435 99030"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/[^\d\s]/g, ''))}
                  className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold tracking-wider text-neutral-900 focus:outline-none placeholder:text-stone-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || phoneInput.replace(/\D/g, '').length < 10}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-raakky-red px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-spicy transition-all hover:bg-raakky-red-dark active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isTamil ? 'OTP அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span>
                </>
              ) : (
                <>
                  <span>{isTamil ? 'OTP குறியீடு பெறுக' : 'Send Verification OTP'}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: 6-Digit OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex items-center justify-between text-xs text-stone-600 bg-stone-50 px-3.5 py-2.5 rounded-2xl border border-stone-200">
              <span className="font-semibold">{formattedE164}</span>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setLocalError(null);
                  setOtpExpired(false);
                }}
                className="font-bold text-raakky-red hover:underline"
              >
                {isTamil ? 'எண் மாற்ற' : 'Change'}
              </button>
            </div>

            {/* 6 Digit Boxes */}
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-stone-700">
                {isTamil ? '6 இலக்க OTP எண்ணை உள்ளிடவும்' : 'Enter 6-digit OTP code'}
              </label>

              <div className="flex items-center justify-center gap-2">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="h-12 w-11 sm:w-12 rounded-2xl border-2 border-stone-200 bg-stone-50 text-center font-heading text-lg font-black text-neutral-900 focus:border-raakky-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-raakky-red/20 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer */}
            <div className="text-center text-xs">
              {countdown > 0 ? (
                <span className="text-stone-500 font-medium">
                  {isTamil ? `மீண்டும் அனுப்ப: ${countdown} வினாடிகள்` : `Resend code in ${countdown}s`}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 font-bold text-raakky-red hover:underline"
                >
                  <RotateCw size={13} />
                  <span>{isTamil ? 'மீண்டும் OTP அனுப்புக' : 'Resend OTP'}</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpDigits.join('').length < 6}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-raakky-red px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-spicy transition-all hover:bg-raakky-red-dark active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isTamil ? 'சரிபார்க்கப்படுகிறது...' : 'Verifying Code...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>{isTamil ? 'சரிபார்த்து இணைக்கவும்' : 'Verify & Link Account'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success Feedback */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm"
            >
              <CheckCircle2 size={36} />
            </motion.div>

            <h3 className="font-heading text-lg font-bold text-neutral-900">
              {isTamil ? 'வெற்றிகரமாக இணைக்கப்பட்டது!' : 'Account Linked & Verified!'}
            </h3>
            <p className="text-xs text-stone-500">
              {customer?.name && (
                <span className="font-bold text-neutral-800">{customer.name} • </span>
              )}
              {customer?.phone && <span>+91 {customer.phone}</span>}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
