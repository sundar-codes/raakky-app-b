import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  RotateCw,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Scissors
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useCart } from '../contexts/CartContext';
import { OrderTimeline } from '../components/orders/OrderTimeline';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { api } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatOrderDate, formatWeight } from '../utils/formatters';

export const OrderStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isTamil, language } = useLanguage();
  const { showSuccess, showError, showInfo, showWarning } = useNotification();
  const { addToCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation dialog
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch order data
  const fetchOrder = async (isBackground = false) => {
    if (!id) return;
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const liveOrder = await api.getOrderById(id);
      if (liveOrder) {
        setOrder(liveOrder);
        setError(null);
      } else {
        if (!order) {
          setError(t('orders.orderNotFound'));
        }
      }
    } catch (err: any) {
      if (!order) {
        setError(err.message || t('orders.orderNotFound'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Poll every 5 seconds while order is active
    const interval = setInterval(() => {
      if (order && (order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REJECTED')) {
        return;
      }
      fetchOrder(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [id, order?.status]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await api.cancelOrder(order.id, 'Customer requested cancellation before counter acceptance');
      setOrder(res.order);
      showInfo('Order Cancelled', 'ஆர்டர் ரத்து செய்யப்பட்டது', 'Your order was cancelled successfully', 'உங்கள் ஆர்டர் ரத்து செய்யப்பட்டது');
    } catch (err: any) {
      showError('Cancellation Failed', 'ரத்து தோல்வியுற்றது', err.message || 'Unable to cancel order', err.message);
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
    }
  };

  // Reorder items
  const handleReorder = async () => {
    if (!order) return;
    try {
      const currentProducts = await api.getProducts();

      let addedCount = 0;
      for (const item of order.items) {
        const product = currentProducts.find((p) => p.id === item.productId);
        if (product && product.isAvailable) {
          const variant = product.variants.find((v) => v.id === item.variantId) || product.variants[0];
          if (variant && variant.isAvailable) {
            addToCart({
              product,
              variant,
              quantity: item.quantity,
              cuttingPreference: {
                cutType: item.cutType,
                skinType: item.skinType,
                specialInstructions: item.specialInstructions,
              },
            });
            addedCount++;
          }
        }
      }

      if (addedCount > 0) {
        showSuccess(
          'Items Added to Cart',
          'கூடையில் சேர்க்கப்பட்டன',
          `${addedCount} items re-added to your cart`,
          `${addedCount} பொருட்கள் கூடையில் சேர்க்கப்பட்டன`
        );
        navigate('/cart');
      } else {
        showWarning(
          'Items Unavailable',
          'பொருட்கள் இருப்பில் இல்லை',
          'Previous items are currently out of stock',
          'முந்தைய பொருட்கள் தற்போது இருப்பில் இல்லை'
        );
      }
    } catch (err: any) {
      showError('Reorder Failed', 'மீண்டும் ஆர்டர் தோல்வியுற்றது', err.message || 'Failed to reorder', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-raakky-red border-t-transparent" />
        <span className="text-xs font-bold text-stone-500">
          {isTamil ? 'ஆர்டர் விவரங்கள் பெறப்படுகின்றன...' : 'Loading live order status...'}
        </span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          {t('orders.orderNotFound')}
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          {error || 'Unable to locate this order.'}
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('orders.viewAllOrders')}</span>
        </Link>
      </div>
    );
  }

  const isPending = order.status === 'PENDING';
  const isTerminal = order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4 md:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Refresh */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/orders"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600 transition-colors hover:text-raakky-red"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>{t('orders.viewAllOrders')}</span>
          </Link>

          <button
            onClick={() => fetchOrder(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 shadow-sm hover:bg-stone-50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-raakky-red' : ''}`} />
            <span>{isTamil ? 'புதுப்பிக்க' : 'Refresh'}</span>
          </button>
        </div>

        {/* Order Header Card */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-heading text-2xl font-black text-neutral-900 sm:text-3xl">
                  #{order.orderNumber}
                </span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {isTamil ? 'ஆர்டர் செய்யப்பட்ட நேரம்: ' : 'Placed on '} {formatOrderDate(order.createdAt, language)}
              </p>
            </div>

            {/* Total & Payment Badge */}
            <div className="text-left sm:text-right">
              <div className="font-heading text-2xl font-black text-raakky-red">
                {formatCurrency(order.finalTotal)}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-0.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${
                  order.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {order.paymentStatus === 'PAID'
                    ? (order.paymentMethod.startsWith('UPI_') ? '● Paid via UPI' : '● Paid Online')
                    : '○ Pay on Delivery / Pickup'}
                </span>
                {order.upiTransactionId && (
                  <span className="text-[10px] font-mono text-stone-500">
                    UTR: {order.upiTransactionId}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shop Rejection Reason Alert if rejected */}
          {order.status === 'REJECTED' && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
              <strong className="font-bold">{isTamil ? 'கடை குறிப்பு:' : 'Shop Note:'}</strong>{' '}
              {order.rejectionReason || 'Stock ran out at counter. Please try another cut or reorder later.'}
            </div>
          )}

          {/* Estimated Delivery / Ready Alert */}
          {order.estimatedTime && !isTerminal && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>
                {isTamil ? 'மதிப்பிடப்பட்ட நேரம்' : 'Estimated Time'}: ~{order.estimatedTime}
              </span>
            </div>
          )}
        </div>

        {/* Live Order Timeline */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h2 className="mb-6 font-heading text-lg font-bold text-neutral-900">
            {t('orders.trackOrder')}
          </h2>
          <OrderTimeline order={order} />
        </div>

        {/* Contact Shop & Location Assistance */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Call Counter */}
          <a
            href="tel:+919843599030"
            className="flex items-center gap-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm transition-colors hover:border-raakky-red hover:bg-stone-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-raakky-cream text-raakky-red">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('orders.needHelp')}
              </h4>
              <p className="font-heading text-sm font-black text-neutral-900">
                +91 98435 99030 (Press Colony)
              </p>
            </div>
          </a>

          {/* Shop Location / Directions */}
          <a
            href="https://maps.google.com/?q=81+Thiruvalluvar+Nagar+Press+Colony+Coimbatore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm transition-colors hover:border-raakky-red hover:bg-stone-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {isTamil ? 'கடை முகவரி' : 'Shop Directions'}
                </h4>
                <p className="text-xs font-bold text-neutral-900 line-clamp-1">
                  81, Thiruvalluvar Nagar, Coimbatore
                </p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-stone-400" />
          </a>
        </div>

        {/* Order Items Breakdown */}
        <div className="mb-6 rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-heading text-base font-bold text-neutral-900">
            {isTamil ? 'ஆர்டரில் உள்ள பொருட்கள்' : 'Items in this Order'}
          </h3>

          <div className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between py-3">
                <div>
                  <h4 className="font-heading text-sm font-bold text-neutral-900">
                    {isTamil ? item.productNameTa : item.productNameEn}
                  </h4>
                  <div className="text-xs text-stone-500">
                    {formatWeight(item.weightGrams, language)} × {item.quantity} @ {formatCurrency(item.unitPrice)}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-stone-600 flex items-center gap-1">
                    <Scissors className="h-3 w-3 text-stone-400" />
                    <span>{item.cutType} • {item.skinType}</span>
                    {item.specialInstructions && (
                      <span className="block italic text-stone-500 ml-2">
                        "{item.specialInstructions}"
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-heading text-sm font-black text-neutral-900">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="mt-4 border-t border-stone-100 pt-4 text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>{t('cart.subtotal')}</span>
              <span className="font-bold text-neutral-900">{formatCurrency(order.itemTotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>{t('cart.deliveryFee')}</span>
              <span className="font-bold text-emerald-600">
                {order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-sm font-black">
              <span className="text-neutral-900">{t('common.total')}</span>
              <span className="font-heading text-base text-raakky-red">{formatCurrency(order.finalTotal)}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {isPending && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              className="rounded-2xl border border-red-200 bg-red-50 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-red-600 shadow-sm transition-colors hover:bg-red-100 active:scale-95"
            >
              {t('orders.cancelOrder')}
            </button>
          )}

          {isTerminal && (
            <button
              onClick={handleReorder}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-raakky-red-dark active:scale-95"
            >
              <RotateCw className="h-4 w-4" />
              <span>{t('orders.reorder')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelModal}
        title={t('orders.cancelConfirmTitle')}
        message={t('orders.cancelConfirmMsg')}
        confirmText={t('orders.cancelOrder')}
        cancelText={t('common.back')}
        isDestructive
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};
