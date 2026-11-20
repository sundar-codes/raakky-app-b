import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ShopSettings, ShopStatusState } from '../types';
import { api, DEFAULT_SHOP_SETTINGS } from '../services/api';
import { calculateCoimbatoreShopHours, LiveShopTimeInfo } from '../utils/formatters';

interface ShopContextType {
  settings: ShopSettings;
  timeInfo: LiveShopTimeInfo;
  shopStatusState: ShopStatusState;
  isOpen: boolean;
  isPaused: boolean;
  canAcceptOrders: boolean;
  pauseReason: { en: string; ta: string };
  refreshShopStatus: () => Promise<void>;
  loading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [now, setNow] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const refreshShopStatus = async () => {
    try {
      const live = await api.getShopSettings();
      setSettings(live);
    } catch {
      // Keep existing settings
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshShopStatus();
    const pollInterval = setInterval(refreshShopStatus, 45000);
    return () => clearInterval(pollInterval);
  }, []);

  const timeInfo = useMemo(() => calculateCoimbatoreShopHours(now), [now]);

  const shopStatusState: ShopStatusState = useMemo(() => {
    if (settings.orderAcceptancePaused) {
      return 'paused';
    }
    if (!settings.isOpen || !timeInfo.isOpen) {
      return 'closed';
    }
    return 'open';
  }, [settings, timeInfo]);

  const isOpen = shopStatusState === 'open';
  const isPaused = shopStatusState === 'paused';
  const canAcceptOrders = isOpen;

  const pauseReason = {
    en: settings.pauseReasonEn || DEFAULT_SHOP_SETTINGS.pauseReasonEn,
    ta: settings.pauseReasonTa || DEFAULT_SHOP_SETTINGS.pauseReasonTa,
  };

  return (
    <ShopContext.Provider
      value={{
        settings,
        timeInfo,
        shopStatusState,
        isOpen,
        isPaused,
        canAcceptOrders,
        pauseReason,
        refreshShopStatus,
        loading,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
