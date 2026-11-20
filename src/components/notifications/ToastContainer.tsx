import React from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { ToastMessage } from './ToastMessage';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-0 left-0 sm:left-auto sm:right-4 z-50 flex flex-col items-center sm:items-end gap-2.5 px-4 pointer-events-none max-h-screen overflow-hidden"
    >
      {toasts.map(toast => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};
