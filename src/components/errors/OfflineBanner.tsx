import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const { isTamil } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-center gap-2.5 text-xs font-bold border-b border-neutral-800 shadow-md sticky top-0 z-50 animate-in slide-in-from-top">
      <WifiOff size={16} className="text-raakky-red animate-pulse" />
      <span>
        {isTamil
          ? 'இணைய இணைப்பு துண்டிக்கப்பட்டது. நெட்வொர்க் மீண்டும் வரும் வரை காத்திருக்கவும்.'
          : 'You are currently offline. Orders cannot be submitted without an internet connection.'}
      </span>
    </div>
  );
};
