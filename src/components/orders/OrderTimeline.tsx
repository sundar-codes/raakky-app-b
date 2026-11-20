import React from 'react';
import { Check, Clock, Package, Truck, AlertCircle, XCircle } from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatOrderDate } from '../../utils/formatters';

interface OrderTimelineProps {
  order: Order;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const { t, language } = useLanguage();

  const isDelivery = order.orderType === 'DELIVERY';

  const steps: { status: OrderStatus; title: string; subtitle: string; icon: any }[] = [
    {
      status: 'PENDING',
      title: t('orders.statusPending'),
      subtitle: 'Order submitted to shop counter for verification',
      icon: Clock,
    },
    {
      status: 'ACCEPTED',
      title: t('orders.statusAccepted'),
      subtitle: 'Shop accepted your order. Counter prep queued.',
      icon: Check,
    },
    {
      status: 'PREPARING',
      title: t('orders.statusPreparing'),
      subtitle: 'Washing, trimming, and custom fresh cuts in progress',
      icon: Package,
    },
    isDelivery
      ? {
          status: 'OUT_FOR_DELIVERY',
          title: t('orders.statusOutForDelivery'),
          subtitle: 'Rider is on the way with your fresh chicken packet',
          icon: Truck,
        }
      : {
          status: 'READY_FOR_PICKUP',
          title: t('orders.statusReadyForPickup'),
          subtitle: 'Packed and stored in cooler at Press Colony counter',
          icon: Package,
        },
    {
      status: 'COMPLETED',
      title: t('orders.statusCompleted'),
      subtitle: 'Enjoy your fresh chicken meal!',
      icon: Check,
    },
  ];

  const getStepIndex = (s: OrderStatus) => {
    switch (s) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  const currentStepIndex = getStepIndex(order.status);
  const isRejected = order.status === 'REJECTED';
  const isCancelled = order.status === 'CANCELLED';

  if (isRejected || isCancelled) {
    return (
      <div className="bg-red-50/90 rounded-3xl p-5 border border-red-200 space-y-3">
        <div className="flex items-center gap-2.5 text-red-900 font-bold text-sm">
          {isRejected ? <AlertCircle size={20} className="text-raakky-red" /> : <XCircle size={20} className="text-neutral-600" />}
          <span>{isRejected ? t('orders.statusRejected') : t('orders.statusCancelled')}</span>
        </div>
        <p className="text-xs text-red-800 leading-relaxed">
          {isRejected
            ? `${t('orders.rejectionReason')}: ${order.rejectionReason || 'Item shortage at shop counter'}`
            : `${order.cancellationReason || 'Order was cancelled'}`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-100 shadow-card space-y-6">
      <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-sans">
        {t('orders.timelineTitle')}
      </h3>

      <div className="relative pl-6 sm:pl-8 space-y-6">
        <div className="absolute top-3 bottom-3 left-3 sm:left-4 w-0.5 bg-neutral-200 -translate-x-1/2">
          <div
            className="w-full bg-raakky-red transition-all duration-500"
            style={{
              height: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const isDone = currentStepIndex > idx;
          const isCurrent = currentStepIndex === idx;
          const { icon: StepIcon } = step;

          const logEntry = order.statusTimeline?.find(l => l.status === step.status);

          return (
            <div key={step.status} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 sm:-left-8 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-raakky-red text-white ring-4 ring-raakky-red/20 shadow-spicy scale-110'
                    : 'bg-white border-2 border-neutral-300 text-neutral-400'
                }`}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : <StepIcon size={12} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isCurrent
                        ? 'text-raakky-red text-sm font-extrabold'
                        : isDone
                        ? 'text-neutral-900'
                        : 'text-neutral-400'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {logEntry && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {formatOrderDate(logEntry.timestamp, language)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
