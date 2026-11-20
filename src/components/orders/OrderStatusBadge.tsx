import React from 'react';
import { OrderStatus } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlertCircle, CheckCircle2, Clock, Package, Truck, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const { t } = useLanguage();

  const config = {
    PENDING: {
      label: t('orders.statusPending'),
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      dot: 'bg-amber-500 animate-pulse',
    },
    ACCEPTED: {
      label: t('orders.statusAccepted'),
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: CheckCircle2,
      dot: 'bg-blue-500',
    },
    PREPARING: {
      label: t('orders.statusPreparing'),
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      icon: Package,
      dot: 'bg-orange-500 animate-pulse',
    },
    READY_FOR_PICKUP: {
      label: t('orders.statusReadyForPickup'),
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: Package,
      dot: 'bg-purple-500',
    },
    OUT_FOR_DELIVERY: {
      label: t('orders.statusOutForDelivery'),
      bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: Truck,
      dot: 'bg-indigo-500 animate-pulse',
    },
    COMPLETED: {
      label: t('orders.statusCompleted'),
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
    REJECTED: {
      label: t('orders.statusRejected'),
      bg: 'bg-red-50 text-red-800 border-red-200',
      icon: AlertCircle,
      dot: 'bg-red-500',
    },
    CANCELLED: {
      label: t('orders.statusCancelled'),
      bg: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      icon: XCircle,
      dot: 'bg-neutral-400',
    },
  }[status] || {
    label: status,
    bg: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    icon: Clock,
    dot: 'bg-neutral-400',
  };

  const { icon: Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <Icon size={13} strokeWidth={2.4} />
      <span>{config.label}</span>
    </span>
  );
};
