import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastNotification } from '../types';

interface NotificationContextType {
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => string;
  showSuccess: (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => string;
  showError: (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => string;
  showWarning: (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => string;
  showInfo: (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastNotification, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastNotification = {
        ...toast,
        id,
        duration: toast.duration ?? 4000,
      };

      setToasts(prev => [...prev.slice(-4), newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => {
      return showToast({ type: 'success', titleEn, titleTa, messageEn, messageTa });
    },
    [showToast]
  );

  const showError = useCallback(
    (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => {
      return showToast({ type: 'error', titleEn, titleTa, messageEn, messageTa, duration: 5500 });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => {
      return showToast({ type: 'warning', titleEn, titleTa, messageEn, messageTa, duration: 5000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (titleEn: string, titleTa: string, messageEn?: string, messageTa?: string) => {
      return showToast({ type: 'info', titleEn, titleTa, messageEn, messageTa });
    },
    [showToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        dismissToast,
        clearAllToasts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
