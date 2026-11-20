import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: 'trash' | 'warning' | 'alert';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  icon = 'trash',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              isDestructive
                ? 'bg-red-50 text-raakky-red'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {icon === 'trash' ? (
              <Trash2 size={26} strokeWidth={2.2} />
            ) : icon === 'warning' ? (
              <AlertTriangle size={26} strokeWidth={2.2} />
            ) : (
              <AlertCircle size={26} strokeWidth={2.2} />
            )}
          </div>

          <h3 className="text-lg font-bold text-neutral-900 font-sans tracking-tight mb-2">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98] ${
                isDestructive
                  ? 'bg-raakky-red hover:bg-raakky-red-dark'
                  : 'bg-neutral-900 hover:bg-neutral-800'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
