import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  ConfirmationResult,
  User,
  UserCredential,
  onAuthStateChanged,
  Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  cleaned10: string;
  error?: string;
}

export interface StructuredAuthError {
  code: string;
  message: string;
  isBillingError: boolean;
  isPopupDismissed: boolean;
  isPopupBlocked: boolean;
  isEmailUnverified: boolean;
  shouldResetRecaptcha: boolean;
}

/**
 * Validates and formats an Indian mobile number into standard E.164 (+91XXXXXXXXXX)
 */
export function formatIndianPhoneNumber(rawPhone: string): PhoneValidationResult {
  if (!rawPhone) {
    return { isValid: false, e164: '', cleaned10: '', error: 'Mobile number is required' };
  }

  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // Strip leading 0 if 11 digits (e.g. 09843599030)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip leading 91 if 12 digits (e.g. 919843599030)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      e164: '',
      cleaned10: digits,
      error: 'Please enter a valid 10-digit mobile number',
    };
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      isValid: false,
      e164: '',
      cleaned10: digits,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9',
    };
  }

  return {
    isValid: true,
    e164: `+91${digits}`,
    cleaned10: digits,
  };
}

/**
 * Detects mobile browsers
 */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detects embedded in-app browsers (WhatsApp, Instagram, Facebook, WebView) or standalone PWA mode
 * where browser popups frequently fail to return control to the opener tab.
 */
export function isInAppOrStandaloneBrowser(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isInAppWebView =
    /FBAN|FBAV|Instagram|WhatsApp|Line|Snapchat|Twitter|\bwv\b|WebView/i.test(ua);
  const isStandalonePWA =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isInAppWebView || isStandalonePWA;
}

/**
 * Creates configured GoogleAuthProvider requesting explicit account selection
 */
export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/**
 * Invokes Firebase Google popup synchronously inside user interaction click handler.
 * IMPORTANT: Do not precede calls to this with awaits, or browsers will block the popup.
 */
export function triggerGooglePopupDirect(): Promise<UserCredential> {
  const provider = createGoogleProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Initiates full-page redirect Google authentication for mobile/WebView fallback
 */
export function triggerGoogleRedirect(): Promise<void> {
  const provider = createGoogleProvider();
  return signInWithRedirect(auth, provider);
}

/**
 * Resolves any pending redirect result when returning from Google full-page authentication
 */
export function resolveGoogleRedirectResult(): Promise<UserCredential | null> {
  return getRedirectResult(auth);
}

/**
 * Checks email verification and linked phone state on a Firebase user
 */
export function evaluateFirebaseUser(user: User): {
  isEmailVerified: boolean;
  hasLinkedPhone: boolean;
} {
  const isEmailVerified = Boolean(user.emailVerified);
  const hasLinkedPhone = Boolean(
    user.phoneNumber ||
      user.providerData.some((p) => p.providerId === 'phone')
  );
  return { isEmailVerified, hasLinkedPhone };
}

/**
 * Singleton holder for RecaptchaVerifier to prevent DOM duplicate widget collisions
 */
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;
let activeRecaptchaContainer: string | HTMLElement | null = null;

/**
 * Destroys active RecaptchaVerifier and clears its host container DOM node
 */
export function clearRecaptchaVerifier(container?: string | HTMLElement): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignore cleanup error if widget was already destroyed
    }
    activeRecaptchaVerifier = null;
  }

  const targetContainer = container || activeRecaptchaContainer;
  if (targetContainer && typeof document !== 'undefined') {
    const el =
      typeof targetContainer === 'string'
        ? document.getElementById(targetContainer)
        : targetContainer;
    if (el) {
      el.innerHTML = '';
    }
  }
  activeRecaptchaContainer = null;
}

/**
 * Creates or resets a RecaptchaVerifier on the specified HTML container element or ID
 */
export function getOrCreateRecaptchaVerifier(
  container: string | HTMLElement,
  onExpired?: () => void
): RecaptchaVerifier {
  clearRecaptchaVerifier(container);

  activeRecaptchaContainer = container;
  const verifier = new RecaptchaVerifier(auth, container, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - Firebase proceeds with linkWithPhoneNumber
    },
    'expired-callback': () => {
      clearRecaptchaVerifier(container);
      if (onExpired) onExpired();
    },
  });

  activeRecaptchaVerifier = verifier;
  return verifier;
}

/**
 * Links an Indian mobile number to the currently authenticated Google user.
 * Sends an SMS OTP via Firebase Phone Auth with invisible reCAPTCHA verification.
 * Resets reCAPTCHA automatically on failure so subsequent retries do not collide.
 */
export async function sendPhoneLinkOtp(
  currentUser: User,
  rawPhone: string,
  container: string | HTMLElement
): Promise<{
  confirmationResult: ConfirmationResult;
  formattedE164: string;
  cleaned10: string;
}> {
  const validation = formatIndianPhoneNumber(rawPhone);
  if (!validation.isValid) {
    const err = new Error(validation.error || 'Invalid mobile number') as Error & { code?: string };
    err.code = 'auth/invalid-phone-number';
    throw err;
  }

  const verifier = getOrCreateRecaptchaVerifier(container, () => {
    clearRecaptchaVerifier(container);
  });

  try {
    await verifier.render();
    const confirmationResult = await linkWithPhoneNumber(
      currentUser,
      validation.e164,
      verifier
    );

    return {
      confirmationResult,
      formattedE164: validation.e164,
      cleaned10: validation.cleaned10,
    };
  } catch (err) {
    // Always reset reCAPTCHA after failed SMS OTP sends
    clearRecaptchaVerifier(container);
    throw err;
  }
}

/**
 * Confirms OTP code, links the phone number to the current Google user,
 * and reloads the Firebase user to ensure the session profile reflects the linked phone.
 */
export async function confirmPhoneOtpAndReload(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<User> {
  const cleanedCode = otpCode.trim();
  if (!cleanedCode || cleanedCode.length < 6) {
    const err = new Error('Please enter the 6-digit OTP sent to your phone') as Error & {
      code?: string;
    };
    err.code = 'auth/invalid-verification-code';
    throw err;
  }

  try {
    await confirmationResult.confirm(cleanedCode);

    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser;
    }

    throw new Error('No authenticated user found after verification');
  } catch (err: any) {
    if (err?.code === 'auth/code-expired') {
      clearRecaptchaVerifier();
    }
    throw err;
  }
}

/**
 * Signs out the current customer session
 */
export async function signOutCustomer(): Promise<void> {
  clearRecaptchaVerifier();
  await signOut(auth);
}

/**
 * Subscribes to Firebase Auth state changes
 */
export function onCustomerAuthStateChanged(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Parses Firebase Auth errors into structured, bilingual states for UI handling
 */
export function parseAuthError(
  error: any,
  isTamil: boolean = false
): StructuredAuthError {
  const code: string = error?.code || '';
  const rawMessage: string = error?.message || '';

  const base: StructuredAuthError = {
    code,
    message: '',
    isBillingError: false,
    isPopupDismissed: false,
    isPopupBlocked: false,
    isEmailUnverified: false,
    shouldResetRecaptcha: false,
  };

  switch (code) {
    case 'auth/billing-not-enabled':
      return {
        ...base,
        isBillingError: true,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'Firebase Cloud Billing செயல்படுத்தப்படாததால் உண்மையான SMS சரிபார்ப்பு தற்காலிகமாக கிடைக்கவில்லை. உண்மையான SMS OTP அனுப்ப, திட்ட உரிமையாளர் Firebase Console-இல் Cloud Billing கணக்கை இணைத்து Blaze திட்டத்தைச் செயல்படுத்த வேண்டும்.'
          : 'Real SMS verification is unavailable because Firebase Cloud Billing is not enabled on this project. The project owner must link a Cloud Billing account and enable the Blaze plan in the Firebase Console to send real SMS.',
      };

    case 'auth/quota-exceeded':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'இன்றைய SMS OTP வரம்பு முடிந்துவிட்டது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும் அல்லது கடையைத் தொடர்பு கொள்ளவும்.'
          : 'SMS verification quota has been exceeded for this project. Please try again later or contact our shop directly.',
      };

    case 'auth/too-many-requests':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'அதிக முறை முயற்சிக்கப்பட்டது. சில நிமிடங்கள் கழித்து மீண்டும் முயற்சிக்கவும்.'
          : 'Too many verification requests from this device or number. Please wait a few minutes and try again.',
      };

    case 'auth/invalid-phone-number':
    case 'auth/missing-phone-number':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'தவறான மொபைல் எண் வடிவமைப்பு. 6, 7, 8 அல்லது 9-இல் தொடங்கும் சரியான 10 இலக்க இந்திய எண்ணை உள்ளிடவும்.'
          : 'Invalid mobile number format. Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      };

    case 'auth/invalid-app-credential':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'செயலி சரிபார்ப்பு சான்று (Invalid App Credential) பிழை. பக்கத்தை புதுப்பித்து மீண்டும் முயற்சிக்கவும்.'
          : 'App verification credential failed. Please refresh the page and ensure this domain is authorized in Firebase Console.',
      };

    case 'auth/captcha-check-failed':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'பாதுகாப்பு reCAPTCHA சரிபார்ப்பு தோல்வியடைந்தது அல்லது காலாவதியானது. மீண்டும் OTP அனுப்ப முயற்சிக்கவும்.'
          : 'Security reCAPTCHA verification failed or expired. Please try sending the OTP again.',
      };

    case 'auth/code-expired':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'OTP குறியீட்டின் காலம் முடிந்துவிட்டது. புதிய OTP-ஐப் பெற மீண்டும் அனுப்பவும்.'
          : 'Your verification OTP code has expired. Please request a new OTP.',
      };

    case 'auth/invalid-verification-code':
      return {
        ...base,
        shouldResetRecaptcha: false,
        message: isTamil
          ? 'தவறான 6 இலக்க OTP குறியீடு. SMS-ஐச் சரிபார்த்து மீண்டும் உள்ளிடவும்.'
          : 'Incorrect verification code. Please check your 6-digit OTP and try again.',
      };

    case 'auth/credential-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'இந்த மொபைல் எண் ஏற்கனவே மற்றொரு வாடிக்கையாளர் கணக்குடன் இணைக்கப்பட்டுள்ளது. வேறு எண்ணைப் பயன்படுத்தவும்.'
          : 'This phone number is already linked to another customer account. Please use a different mobile number.',
      };

    case 'auth/provider-already-linked':
      return {
        ...base,
        message: isTamil
          ? 'உங்கள் கணக்கு ஏற்கனவே மொபைல் எண்ணுடன் இணைக்கப்பட்டுள்ளது.'
          : 'This account already has a verified mobile number linked.',
      };

    case 'auth/popup-closed-by-user':
      return {
        ...base,
        isPopupDismissed: true,
        message: isTamil
          ? 'Google உள்நுழைவு சாளரம் மூடப்பட்டது. தொடர கீழே உள்ள Continue with Google பொத்தானை அழுத்தவும்.'
          : 'Google sign-in popup was closed before completing login. Click Continue with Google whenever you are ready.',
      };

    case 'auth/cancelled-popup-request':
      return {
        ...base,
        isPopupDismissed: true,
        message: isTamil
          ? 'முந்தைய உள்நுழைவு கோரிக்கை ரத்து செய்யப்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Sign-in popup request was cancelled. Click Continue with Google to retry.',
      };

    case 'auth/popup-blocked':
    case 'auth/operation-not-supported-in-this-environment':
      return {
        ...base,
        isPopupBlocked: true,
        message: isTamil
          ? 'உங்கள் உலாவி பாப்-அப் சாளரத்தைத் தடுத்துள்ளது. மீண்டும் முயற்சிக்கவும் அல்லது முழுப்பக்க உள்நுழைவைப் பயன்படுத்தவும்.'
          : 'Your browser blocked the Google sign-in popup. Click Continue with Google below or use full-page redirect.',
      };

    case 'auth/network-request-failed':
      return {
        ...base,
        shouldResetRecaptcha: true,
        message: isTamil
          ? 'இணைய இணைப்புப் பிழை. உங்கள் இணையத்தைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
          : 'Network connection error. Please check your internet connection and try again.',
      };

    default:
      return {
        ...base,
        shouldResetRecaptcha: true,
        message:
          rawMessage ||
          (isTamil
            ? 'அங்கீகாரப் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
            : 'Authentication error. Please try again.'),
      };
  }
}

export function getFriendlyAuthErrorMessage(
  error: any,
  isTamil: boolean = false
): string {
  return parseAuthError(error, isTamil).message;
}
