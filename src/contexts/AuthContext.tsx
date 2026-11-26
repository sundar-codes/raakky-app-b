import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, ConfirmationResult } from 'firebase/auth';
import { Customer, CustomerAddress } from '../types';
import { safeStorage, StorageKeys } from '../services/storage';
import { api } from '../services/api';
import { isFirebaseConfigured, firebaseConfigError } from '../services/firebase';
import { useLanguage } from './LanguageContext';
import {
  triggerGooglePopupDirect,
  triggerGoogleRedirect,
  resolveGoogleRedirectResult,
  evaluateFirebaseUser,
  sendPhoneLinkOtp,
  confirmPhoneOtpAndReload,
  signOutCustomer,
  onCustomerAuthStateChanged,
  parseAuthError,
  isMobileBrowser,
  isInAppOrStandaloneBrowser,
} from '../services/firebaseAuth';

export interface AuthModalOptions {
  reason?: string;
  onSuccess?: () => void;
}

export interface AuthNotice {
  type: 'dismissed' | 'blocked' | 'redirect-fallback';
  code: string;
  message: string;
}

export interface SendOtpResponse {
  success: boolean;
  confirmationResult?: ConfirmationResult;
  formattedPhone?: string;
  errorCode?: string;
  isBillingError?: boolean;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  errorCode?: string;
  error?: string;
}

export interface GoogleSignInResponse {
  success: boolean;
  user?: User;
  hasLinkedPhone: boolean;
  isEmailVerified?: boolean;
  dismissed?: boolean;
  blocked?: boolean;
  redirecting?: boolean;
  error?: string;
}

export interface AuthContextType {
  firebaseUser: User | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  token: string | null;
  loading: boolean;
  isGooglePopupPending: boolean;
  authError: string | null;
  authNotice: AuthNotice | null;
  setAuthError: (error: string | null) => void;
  setAuthNotice: (notice: AuthNotice | null) => void;
  clearAuthMessages: () => void;

  // Checkout-triggered synchronous entry point
  initiateCheckoutAuth: (navigateFn: (path: string) => void) => void;

  // Google authentication
  signInWithGoogle: (options?: { redirectPath?: string }) => Promise<GoogleSignInResponse>;
  signInWithGoogleRedirect: (redirectPath?: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;

  // Redirect restoration
  pendingRedirectPath: string | null;
  clearPendingRedirectPath: () => void;

  // Phone linking via SMS OTP
  sendPhoneOtp: (
    phone: string,
    recaptchaContainer: string | HTMLElement
  ) => Promise<SendOtpResponse>;
  verifyAndLinkOtp: (
    confirmationResult: ConfirmationResult,
    otp: string
  ) => Promise<VerifyOtpResponse>;

  // Sign out
  logout: () => Promise<void>;

  // Profile & Address Management
  updateProfile: (name: string, email?: string) => Promise<void>;
  saveAddress: (address: Omit<CustomerAddress, 'id'>, editId?: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;

  // Customer phone (self-reported, unverified)
  setCustomerPhone: (phone: string) => void;
  hasValidPhone: boolean;

  // Global Auth Modal Controls
  isAuthModalOpen: boolean;
  authModalOptions: AuthModalOptions | null;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const POST_AUTH_REDIRECT_KEY = 'raakky_post_auth_redirect';
const getAddressStorageKey = (uid: string) => `raakky_addresses_${uid}`;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isTamil } = useLanguage();

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(() => {
    return safeStorage.get<Customer | null>(StorageKeys.CUSTOMER, null);
  });
  const [token, setToken] = useState<string | null>(() => {
    return safeStorage.getString(StorageKeys.TOKEN, '');
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isGooglePopupPending, setIsGooglePopupPending] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null);
  const [pendingRedirectPath, setPendingRedirectPath] = useState<string | null>(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<AuthModalOptions | null>(null);

  const clearAuthMessages = useCallback(() => {
    setAuthError(null);
    setAuthNotice(null);
  }, []);

  const clearPendingRedirectPath = useCallback(() => {
    setPendingRedirectPath(null);
  }, []);

  const openAuthModal = useCallback((options?: AuthModalOptions) => {
    setAuthError(null);
    setAuthNotice(null);
    setAuthModalOptions(options || null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthModalOptions(null);
  }, []);

  // Build Customer object from verified Firebase User and sync durable profile from backend D1
  const buildCustomerFromFirebase = useCallback(
    async (user: User, options?: { forceRefreshToken?: boolean }): Promise<Customer> => {
      const userToken = await user.getIdToken(Boolean(options?.forceRefreshToken));
      setToken(userToken);
      safeStorage.setString(StorageKeys.TOKEN, userToken);

      const savedAddresses = safeStorage.get<CustomerAddress[]>(
        getAddressStorageKey(user.uid),
        []
      );

      // Extract clean 10-digit Indian phone from E.164 (+91XXXXXXXXXX)
      const rawPhone = user.phoneNumber || '';
      const cleanPhone = rawPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
      const { hasLinkedPhone } = evaluateFirebaseUser(user);

      const existingCustomer = safeStorage.get<Customer | null>(StorageKeys.CUSTOMER, null);
      const isSameCustomer = existingCustomer?.id === user.uid;

      let customerObj: Customer = {
        id: user.uid,
        name: user.displayName || (isSameCustomer ? existingCustomer?.name : '') || 'Customer',
        email: user.email || (isSameCustomer ? existingCustomer?.email : undefined) || undefined,
        phone: cleanPhone || (hasLinkedPhone && isSameCustomer ? existingCustomer?.phone || '' : ''),
        isPhoneVerified: hasLinkedPhone,
        addresses:
          savedAddresses.length > 0
            ? savedAddresses
            : isSameCustomer
            ? existingCustomer?.addresses || []
            : [],
        defaultAddressId:
          savedAddresses.find((a) => a.isDefault)?.id ||
          savedAddresses[0]?.id ||
          (isSameCustomer ? existingCustomer?.defaultAddressId : undefined),
        createdAt: user.metadata.creationTime || new Date().toISOString(),
      };

      // When email is verified, hydrate/create D1 customer profile
      // Allow syncing even without Firebase-verified phone (self-reported phone case)
      if (user.emailVerified) {
        try {
          let syncedProfile = await api.getCustomerProfile(Boolean(options?.forceRefreshToken));

          // Migrate pre-existing browser-cached addresses up to D1 once if D1 has none yet
          if (syncedProfile.addresses.length === 0 && savedAddresses.length > 0) {
            try {
              syncedProfile = await api.updateCustomerProfile({
                name: customerObj.name,
                addresses: savedAddresses,
                defaultAddressId:
                  savedAddresses.find((a) => a.isDefault)?.id || savedAddresses[0]?.id,
              });
            } catch {
              // Keep remote profile even if legacy local address missed fields
            }
          }

          customerObj = syncedProfile;
          safeStorage.set(getAddressStorageKey(user.uid), syncedProfile.addresses);
        } catch (err: any) {
          const msg = String(err?.message || '');
          if (msg.toLowerCase().includes('another customer profile') || msg.toLowerCase().includes('merge')) {
            setAuthError(msg);
          }
        }
      }

      setCustomer(customerObj);
      safeStorage.set(StorageKeys.CUSTOMER, customerObj);
      return customerObj;
    },
    []
  );

  // Restore session and resolve Firebase redirect results on mount
  useEffect(() => {
    let isMounted = true;

    const handleRedirectOnBoot = async () => {
      try {
        const redirectCred = await resolveGoogleRedirectResult();
        if (!isMounted) return;

        if (redirectCred?.user) {
          setFirebaseUser(redirectCred.user);
          if (!redirectCred.user.emailVerified) {
            setAuthError(
              isTamil
                ? 'தொடர சரிபார்க்கப்பட்ட Google மின்னஞ்சல் முகவரி தேவை.'
                : 'A verified Google email address is required to continue.'
            );
          } else {
            await buildCustomerFromFirebase(redirectCred.user);
          }

          try {
            const target = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
            if (target) {
              sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
              setPendingRedirectPath(target);
            }
          } catch {
            // Ignore sessionStorage errors
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        const parsed = parseAuthError(err, isTamil);
        if (!parsed.isPopupDismissed) {
          setAuthError(parsed.message);
        }
        try {
          sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
        } catch {
          // Ignore
        }
      }
    };

    handleRedirectOnBoot();

    const unsubscribe = onCustomerAuthStateChanged(async (user) => {
      if (!isMounted) return;
      setLoading(true);
      try {
        if (user) {
          setFirebaseUser(user);
          await buildCustomerFromFirebase(user);

          // If returning from redirect and path remained pending, restore destination
          try {
            const target = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
            if (target) {
              sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
              setPendingRedirectPath(target);
            }
          } catch {
            // Ignore
          }
        } else {
          setFirebaseUser(null);
          setCustomer(null);
          setToken(null);
          safeStorage.remove(StorageKeys.CUSTOMER);
          safeStorage.remove(StorageKeys.TOKEN);
        }
      } catch (err: any) {
        console.error('Error synchronizing auth state:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [buildCustomerFromFirebase, isTamil]);

  // Explicit full-page redirect fallback trigger
  const signInWithGoogleRedirect = useCallback(
    async (redirectPath: string = '/checkout'): Promise<void> => {
      setAuthError(null);
      setAuthNotice(null);
      try {
        sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, redirectPath);
      } catch {
        // Ignore
      }
      try {
        await triggerGoogleRedirect();
      } catch (err: any) {
        const parsed = parseAuthError(err, isTamil);
        setAuthError(parsed.message);
      }
    },
    [isTamil]
  );

  // Synchronous click-handler safe Google Sign-In
  const signInWithGoogle = useCallback(
    (options?: { redirectPath?: string }): Promise<GoogleSignInResponse> => {
      setAuthError(null);
      setAuthNotice(null);

      if (!isFirebaseConfigured) {
        const msg =
          firebaseConfigError ||
          (isTamil
            ? 'Firebase அங்கீகார அமைப்பு முழுமையடையவில்லை.'
            : 'Firebase authentication is not configured in this environment.');
        setAuthError(msg);
        return Promise.resolve({
          success: false,
          hasLinkedPhone: false,
          error: msg,
        });
      }

      const targetRedirect = options?.redirectPath || '/checkout';

      // Embedded WebView / standalone iOS PWA: popups reliably fail, use redirect fallback
      if (isInAppOrStandaloneBrowser()) {
        try {
          sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, targetRedirect);
        } catch {
          // Ignore
        }
        setAuthNotice({
          type: 'redirect-fallback',
          code: 'redirect-initiated',
          message: isTamil
            ? 'Google உள்நுழைவு பக்கத்திற்கு அழைத்துச் செல்லப்படுகிறது...'
            : 'Redirecting to Google Sign-In...',
        });
        return new Promise((resolve) => {
          setTimeout(() => {
            triggerGoogleRedirect().catch((err) => {
              const parsed = parseAuthError(err, isTamil);
              setAuthError(parsed.message);
              resolve({ success: false, hasLinkedPhone: false, error: parsed.message });
            });
          }, 80);
        });
      }

      setIsGooglePopupPending(true);

      // Call signInWithPopup SYNCHRONOUSLY before any await to satisfy browser user-gesture policy
      return triggerGooglePopupDirect()
        .then(async (cred): Promise<GoogleSignInResponse> => {
          try {
            sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
          } catch {
            // Ignore
          }

          const user = cred.user;
          setFirebaseUser(user);
          const { isEmailVerified, hasLinkedPhone } = evaluateFirebaseUser(user);

          if (!isEmailVerified) {
            const msg = isTamil
              ? 'தொடர சரிபார்க்கப்பட்ட Google மின்னஞ்சல் முகவரி தேவை. சரிபார்க்கப்பட்ட கணக்கைப் பயன்படுத்தவும்.'
              : 'A verified Google email address is required. Please sign in with a verified Google account.';
            setAuthError(msg);
            return {
              success: false,
              user,
              isEmailVerified: false,
              hasLinkedPhone,
              error: msg,
            };
          }

          const customerObj = await buildCustomerFromFirebase(user);
          return {
            success: true,
            user,
            isEmailVerified: true,
            hasLinkedPhone: customerObj.isPhoneVerified,
          };
        })
        .catch((err): Promise<GoogleSignInResponse> | GoogleSignInResponse => {
          try {
            sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
          } catch {
            // Ignore
          }

          const parsed = parseAuthError(err, isTamil);

          // Closed or cancelled popup: non-blocking notice, NEVER clear cart or throw blocking error
          if (parsed.isPopupDismissed) {
            setAuthError(null);
            setAuthNotice({
              type: 'dismissed',
              code: parsed.code,
              message: parsed.message,
            });
            return {
              success: false,
              hasLinkedPhone: false,
              dismissed: true,
            };
          }

          // Popup blocked / environment unsupported: redirect fallback on mobile, calm notice on desktop
          if (parsed.isPopupBlocked) {
            if (isMobileBrowser()) {
              try {
                sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, targetRedirect);
              } catch {
                // Ignore
              }
              setAuthNotice({
                type: 'redirect-fallback',
                code: parsed.code,
                message: isTamil
                  ? 'மொபைல் உலாவியில் முழுப்பக்க Google உள்நுழைவுக்கு மாற்றப்படுகிறது...'
                  : 'Switching to mobile-friendly Google Sign-In redirect...',
              });
              triggerGoogleRedirect().catch((redirectErr) => {
                const redirectParsed = parseAuthError(redirectErr, isTamil);
                setAuthError(redirectParsed.message);
              });
              return {
                success: false,
                hasLinkedPhone: false,
                redirecting: true,
              };
            }

            setAuthError(null);
            setAuthNotice({
              type: 'blocked',
              code: parsed.code,
              message: parsed.message,
            });
            return {
              success: false,
              hasLinkedPhone: false,
              blocked: true,
              error: parsed.message,
            };
          }

          setAuthError(parsed.message);
          return {
            success: false,
            hasLinkedPhone: false,
            error: parsed.message,
          };
        })
        .finally(() => {
          setIsGooglePopupPending(false);
        });
    },
    [buildCustomerFromFirebase, isTamil]
  );

  // Checkout trigger handler invoked synchronously inside Order Now / Proceed to Checkout clicks
  const initiateCheckoutAuth = useCallback(
    (navigateFn: (path: string) => void) => {
      // Never ask already authenticated users to sign in again
      if (firebaseUser) {
        navigateFn('/checkout');
        return;
      }

      // Preserve intended checkout destination before popup or redirect
      try {
        sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, '/checkout');
      } catch {
        // Ignore
      }

      // Navigate immediately to checkout screen (preserves cart & step 1 behind popup)
      navigateFn('/checkout');
      setAuthError(null);
      setAuthNotice(null);

      if (!isFirebaseConfigured) {
        setAuthError(
          firebaseConfigError ||
            (isTamil
              ? 'Firebase அங்கீகார அமைப்பு முழுமையடையவில்லை.'
              : 'Firebase authentication is not configured for this build.')
        );
        return;
      }

      // WebView / standalone PWA redirect path (wait briefly so any addToCart effect commits)
      if (isInAppOrStandaloneBrowser()) {
        setAuthNotice({
          type: 'redirect-fallback',
          code: 'redirect-initiated',
          message: isTamil
            ? 'Google உள்நுழைவு பக்கத்திற்கு அழைத்துச் செல்லப்படுகிறது...'
            : 'Redirecting to Google Sign-In...',
        });
        setTimeout(() => {
          triggerGoogleRedirect().catch((err) => {
            const parsed = parseAuthError(err, isTamil);
            setAuthError(parsed.message);
            setAuthNotice(null);
          });
        }, 80);
        return;
      }

      setIsGooglePopupPending(true);

      // Synchronously invoke Firebase Google popup right inside the user click handler
      triggerGooglePopupDirect()
        .then(async (cred) => {
          try {
            sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
          } catch {
            // Ignore
          }

          const user = cred.user;
          setFirebaseUser(user);

          if (!user.emailVerified) {
            setAuthError(
              isTamil
                ? 'தொடர சரிபார்க்கப்பட்ட Google மின்னஞ்சல் முகவரி தேவை.'
                : 'A verified Google email address is required. Please sign in with a verified Google account.'
            );
            return;
          }

          await buildCustomerFromFirebase(user);
        })
        .catch((err) => {
          try {
            sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
          } catch {
            // Ignore
          }

          const parsed = parseAuthError(err, isTamil);

          // Closed popup: do NOT show blocking error, keep checkout & cart intact with manual retry button
          if (parsed.isPopupDismissed) {
            setAuthError(null);
            setAuthNotice({
              type: 'dismissed',
              code: parsed.code,
              message: parsed.message,
            });
            return;
          }

          // Blocked popup: redirect fallback on mobile; non-blocking retry note on desktop
          if (parsed.isPopupBlocked) {
            if (isMobileBrowser()) {
              try {
                sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, '/checkout');
              } catch {
                // Ignore
              }
              setAuthNotice({
                type: 'redirect-fallback',
                code: parsed.code,
                message: isTamil
                  ? 'மொபைல் உலாவியில் முழுப்பக்க Google உள்நுழைவுக்கு மாற்றப்படுகிறது...'
                  : 'Switching to mobile-friendly Google Sign-In redirect...',
              });
              triggerGoogleRedirect().catch((redirectErr) => {
                const redirectParsed = parseAuthError(redirectErr, isTamil);
                setAuthError(redirectParsed.message);
              });
              return;
            }

            setAuthError(null);
            setAuthNotice({
              type: 'blocked',
              code: parsed.code,
              message: parsed.message,
            });
            return;
          }

          setAuthError(parsed.message);
        })
        .finally(() => {
          setIsGooglePopupPending(false);
        });
    },
    [firebaseUser, buildCustomerFromFirebase, isTamil]
  );

  // Legacy wrapper
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    const res = await signInWithGoogle();
    return res.success;
  }, [signInWithGoogle]);

  // Send SMS OTP to link phone number to existing Google user
  const sendPhoneOtp = useCallback(
    async (
      phone: string,
      recaptchaContainer: string | HTMLElement
    ): Promise<SendOtpResponse> => {
      setAuthError(null);
      setAuthNotice(null);

      try {
        if (!firebaseUser) {
          throw new Error(
            isTamil
              ? 'உங்கள் மொபைல் எண்ணைச் சரிபார்ப்பதற்கு முன் Google மூலம் உள்நுழையவும்.'
              : 'Please sign in with Google first before verifying your phone number.'
          );
        }

        if (!firebaseUser.emailVerified) {
          throw new Error(
            isTamil
              ? 'உங்கள் Google மின்னஞ்சல் முகவரி சரிபார்க்கப்படவில்லை.'
              : 'Your Google email must be verified before linking a phone number.'
          );
        }

        const res = await sendPhoneLinkOtp(firebaseUser, phone, recaptchaContainer);
        return {
          success: true,
          confirmationResult: res.confirmationResult,
          formattedPhone: res.formattedE164,
        };
      } catch (err: any) {
        const parsed = parseAuthError(err, isTamil);
        setAuthError(parsed.message);
        return {
          success: false,
          errorCode: parsed.code,
          isBillingError: parsed.isBillingError,
          error: parsed.message,
        };
      }
    },
    [firebaseUser, isTamil]
  );

  // Confirm OTP and link phone to Google account
  const verifyAndLinkOtp = useCallback(
    async (
      confirmationResult: ConfirmationResult,
      otp: string
    ): Promise<VerifyOtpResponse> => {
      setAuthError(null);

      try {
        const reloadedUser = await confirmPhoneOtpAndReload(confirmationResult, otp);
        setFirebaseUser(reloadedUser);
        // Force-refresh Firebase ID token so backend immediately sees verified phone_number claim
        await buildCustomerFromFirebase(reloadedUser, { forceRefreshToken: true });

        return { success: true };
      } catch (err: any) {
        const parsed = parseAuthError(err, isTamil);
        setAuthError(parsed.message);
        return {
          success: false,
          errorCode: parsed.code,
          error: parsed.message,
        };
      }
    },
    [buildCustomerFromFirebase, isTamil]
  );

  // Sign out customer
  const logout = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    } catch {
      // Ignore
    }
    try {
      await signOutCustomer();
      setFirebaseUser(null);
      setCustomer(null);
      setToken(null);
      safeStorage.remove(StorageKeys.CUSTOMER);
      safeStorage.remove(StorageKeys.TOKEN);
    } catch (err: any) {
      console.error('Failed to sign out:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(
    async (name: string, _email?: string) => {
      if (!customer) return;
      const trimmedName = name.trim() || customer.name;

      if (firebaseUser?.emailVerified) {
        const synced = await api.updateCustomerProfile({ name: trimmedName });
        setCustomer(synced);
        safeStorage.set(StorageKeys.CUSTOMER, synced);
        return;
      }

      const updatedCustomer: Customer = {
        ...customer,
        name: trimmedName,
      };
      setCustomer(updatedCustomer);
      safeStorage.set(StorageKeys.CUSTOMER, updatedCustomer);
    },
    [customer, firebaseUser]
  );

  // Address management
  const saveAddress = useCallback(
    async (addressData: Omit<CustomerAddress, 'id'>, editId?: string) => {
      if (!customer) return;

      let updatedAddresses = [...customer.addresses];

      if (editId) {
        updatedAddresses = updatedAddresses.map((addr) =>
          addr.id === editId ? { ...addressData, id: editId } : addr
        );
      } else {
        const newAddress: CustomerAddress = {
          ...addressData,
          id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        };
        if (addressData.isDefault || updatedAddresses.length === 0) {
          updatedAddresses = updatedAddresses.map((a) => ({ ...a, isDefault: false }));
          newAddress.isDefault = true;
        }
        updatedAddresses.push(newAddress);
      }

      const defaultAddr = updatedAddresses.find((a) => a.isDefault) || updatedAddresses[0];

      if (firebaseUser?.emailVerified) {
        const synced = await api.updateCustomerProfile({
          addresses: updatedAddresses,
          defaultAddressId: defaultAddr?.id,
        });
        setCustomer(synced);
        safeStorage.set(StorageKeys.CUSTOMER, synced);
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), synced.addresses);
        return;
      }

      const updatedCustomer: Customer = {
        ...customer,
        addresses: updatedAddresses,
        defaultAddressId: defaultAddr?.id,
      };

      setCustomer(updatedCustomer);
      safeStorage.set(StorageKeys.CUSTOMER, updatedCustomer);
      if (firebaseUser) {
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), updatedAddresses);
      }
    },
    [customer, firebaseUser]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!customer) return;
      const updatedAddresses = customer.addresses.filter((a) => a.id !== addressId);
      const nextDefaultId =
        customer.defaultAddressId === addressId
          ? updatedAddresses[0]?.id
          : customer.defaultAddressId;

      if (firebaseUser?.emailVerified) {
        const synced = await api.updateCustomerProfile({
          addresses: updatedAddresses,
          defaultAddressId: nextDefaultId,
        });
        setCustomer(synced);
        safeStorage.set(StorageKeys.CUSTOMER, synced);
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), synced.addresses);
        return;
      }

      const updatedCustomer: Customer = {
        ...customer,
        addresses: updatedAddresses,
        defaultAddressId: nextDefaultId,
      };
      setCustomer(updatedCustomer);
      safeStorage.set(StorageKeys.CUSTOMER, updatedCustomer);
      if (firebaseUser) {
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), updatedAddresses);
      }
    },
    [customer, firebaseUser]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!customer) return;
      const updatedAddresses = customer.addresses.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }));

      if (firebaseUser?.emailVerified) {
        const synced = await api.updateCustomerProfile({
          addresses: updatedAddresses,
          defaultAddressId: addressId,
        });
        setCustomer(synced);
        safeStorage.set(StorageKeys.CUSTOMER, synced);
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), synced.addresses);
        return;
      }

      const updatedCustomer: Customer = {
        ...customer,
        addresses: updatedAddresses,
        defaultAddressId: addressId,
      };
      setCustomer(updatedCustomer);
      safeStorage.set(StorageKeys.CUSTOMER, updatedCustomer);
      if (firebaseUser) {
        safeStorage.set(getAddressStorageKey(firebaseUser.uid), updatedAddresses);
      }
    },
    [customer, firebaseUser]
  );

  const isEmailVerified = firebaseUser ? Boolean(firebaseUser.emailVerified) : false;
  const isPhoneVerified = Boolean(
    (firebaseUser?.phoneNumber ||
      firebaseUser?.providerData.some((p) => p.providerId === 'phone')) &&
      customer?.isPhoneVerified &&
      customer?.phone
  );

  // A customer has a valid phone if they have a 10-digit Indian number stored
  // (regardless of whether it was OTP-verified or self-reported)
  const hasValidPhone = Boolean(customer?.phone && /^[6-9]\d{9}$/.test(customer.phone));

  // Allow customer to set a self-reported phone number (not OTP-verified)
  const setCustomerPhone = useCallback(
    (phone: string) => {
      if (!customer) return;
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanDigits)) return;

      const updatedCustomer: Customer = {
        ...customer,
        phone: cleanDigits,
        // Explicitly never mark as verified — only Firebase phone auth can do that
        isPhoneVerified: customer.isPhoneVerified || false,
      };
      setCustomer(updatedCustomer);
      safeStorage.set(StorageKeys.CUSTOMER, updatedCustomer);
    },
    [customer]
  );

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        customer,
        isAuthenticated: Boolean(firebaseUser),
        isEmailVerified,
        isPhoneVerified,
        token,
        loading,
        isGooglePopupPending,
        authError,
        authNotice,
        setAuthError,
        setAuthNotice,
        clearAuthMessages,
        initiateCheckoutAuth,
        signInWithGoogle,
        signInWithGoogleRedirect,
        loginWithGoogle,
        pendingRedirectPath,
        clearPendingRedirectPath,
        sendPhoneOtp,
        verifyAndLinkOtp,
        logout,
        updateProfile,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        setCustomerPhone,
        hasValidPhone,
        isAuthModalOpen,
        authModalOptions,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
