import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let cachedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let cachedIsInstalled = false;
const promptListeners = new Set<() => void>();

function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

if (typeof window !== 'undefined') {
  cachedIsInstalled = checkIsStandalone();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedDeferredPrompt = e as BeforeInstallPromptEvent;
    promptListeners.forEach((cb) => cb());
  });

  window.addEventListener('appinstalled', () => {
    cachedIsInstalled = true;
    cachedDeferredPrompt = null;
    promptListeners.forEach((cb) => cb());
  });
}

export function usePWAInstall() {
  const [hasPrompt, setHasPrompt] = useState<boolean>(() => Boolean(cachedDeferredPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(() => cachedIsInstalled || checkIsStandalone());
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsInstalled(cachedIsInstalled || checkIsStandalone());
    setHasPrompt(Boolean(cachedDeferredPrompt));

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    const sync = () => {
      setHasPrompt(Boolean(cachedDeferredPrompt));
      setIsInstalled(cachedIsInstalled || checkIsStandalone());
      if (cachedIsInstalled) {
        setIsInstalling(false);
      }
    };

    promptListeners.add(sync);
    return () => {
      promptListeners.delete(sync);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!cachedDeferredPrompt) return 'unavailable';
    try {
      setIsInstalling(true);
      await cachedDeferredPrompt.prompt();
      const choiceResult = await cachedDeferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        cachedDeferredPrompt = null;
        setHasPrompt(false);
        // Do NOT claim installation completed until browser fires 'appinstalled' or standalone activates.
        return 'accepted';
      }
      setIsInstalling(false);
      return 'dismissed';
    } catch (err) {
      console.warn('PWA install prompt failed:', err);
      setIsInstalling(false);
      return 'dismissed';
    }
  }, []);

  return {
    isInstallable: hasPrompt && !isInstalled,
    isInstalled,
    isInstalling,
    isIOS,
    isAndroid,
    promptInstall,
  };
}
