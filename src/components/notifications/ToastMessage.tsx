import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastNotification } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ToastMessageProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onDismiss }) => {
  const { isTamil } = useLanguage();

  const title = isTamil ? toast.titleTa : toast.titleEn;
  const message = isTamil ? toast.messageTa : toast.messageEn;
  const actionLabel = toast.action ? (isTamil ? toast.action.labelTa : toast.action.labelEn) : null;

  const typeConfig = {
    success: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/95 text-emerald-950',
      iconBg: 'bg-emerald-500 text-white',
      Icon: CheckCircle2,
      accent: 'text-emerald-800',
    },
    error: {
      border: 'border-red-200',
      bg: 'bg-red-50/95 text-red-950',
      iconBg: 'bg-raakky-red text-white',
      Icon: AlertCircle,
      accent: 'text-red-800',
    },
    warning: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/95 text-amber-950',
      iconBg: 'bg-amber-500 text-white',
      Icon: AlertTriangle,
      accent: 'text-amber-800',
    },
    info: {
      border: 'border-neutral-200',
      bg: 'bg-neutral-900/95 text-white',
      iconBg: 'bg-white/20 text-white',
      Icon: Info,
      accent: 'text-neutral-300',
    },
  }[toast.type];

  const { Icon } = typeConfig;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl p-3.5 shadow-xl backdrop-blur-md border ${typeConfig.border} ${typeConfig.bg} transition-all transform animate-in slide-in-from-top-4 duration-200`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${typeConfig.iconBg}`}>
        <Icon size={18} strokeWidth={2.4} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-xs font-bold font-sans tracking-tight leading-snug">
          {title}
        </p>
        {message && (
          <p className={`text-xs mt-0.5 leading-relaxed font-sans ${typeConfig.accent}`}>
            {message}
          </p>
        )}
        {toast.action && actionLabel && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="mt-2 text-xs font-bold underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {actionLabel}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};
