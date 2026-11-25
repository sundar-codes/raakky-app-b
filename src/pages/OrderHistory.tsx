import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  RotateCw,
  Package,
  Calendar,
  Lock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge';
import { api } from '../services/api';
import { Order } from '../types';
import { formatCurrency, formatOrderDate, formatWeight } from '../utils/formatters';

export const OrderHistory: React.FC = () => {
  const { t, isTamil, language } = useLanguage();
  const navigate = useNavigate();
  const {
    customer,
    isAuthenticated,
    isEmailVerified,
    isPhoneVerified,
    loading: authLoading,
    openAuthModal,
  } = useAuth();
  const { addToCart } = useCart();
  const { showSuccess, showError, showWarning } = useNotification();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !isEmailVerified || !isPhoneVerified) {
      setOrders([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const list = await api.getCustomerOrders();
        setOrders(list);
      } catch (err: any) {
        setLoadError(err?.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [authLoading, isAuthenticated, isEmailVerified, isPhoneVerified, customer?.id]);

  const handleReorder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
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
          'Reordered Items Added',
          'கூடையில் சேர்க்கப்பட்டது',
          `${addedCount} items added to your cart`,
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
      showError('Reorder Failed', 'மீண்டும் ஆர்டர் தோல்வியுற்றது', err.message || 'Unable to reorder items', err.message);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const isActive = order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && order.status !== 'REJECTED';
    if (filter === 'active') return isActive;
    if (filter === 'past') return !isActive;
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4 md:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Title & Filter Tabs */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-raakky-red/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-raakky-red">
              <Package className="h-3.5 w-3.5" />
              <span>{t('orders.myOrders')}</span>
            </div>
            <h1 className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {t('orders.myOrders')}
            </h1>
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
            {[
              { id: 'all' as const, label: isTamil ? 'அனைத்தும்' : 'All' },
              { id: 'active' as const, label: isTamil ? 'செயலில் உள்ளவை' : 'Active' },
              { id: 'past' as const, label: isTamil ? 'முந்தையவை' : 'Past' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
                  filter === tab.id
                    ? 'bg-raakky-red text-white shadow-sm'
                    : 'text-stone-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Listing */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-32 animate-pulse rounded-3xl bg-stone-200" />
            ))}
          </div>
        ) : !isAuthenticated || !isEmailVerified || !isPhoneVerified ? (
          <div className="my-12 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-raakky-cream text-raakky-red">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-neutral-900">
              {isTamil ? 'ஆர்டர்களைக் காண உள்நுழையவும்' : 'Sign in to view your orders'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              {isTamil
                ? 'உங்கள் ஆர்டர்கள் உங்கள் சரிபார்க்கப்பட்ட Google கணக்கு மற்றும் மொபைல் எண்ணுடன் பாதுகாப்பாக இணைக்கப்பட்டுள்ளன.'
                : 'Your orders are linked securely to your verified Google account and mobile number.'}
            </p>
            <button
              onClick={() => openAuthModal()}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
            >
              <Lock className="h-4 w-4" />
              <span>{isTamil ? 'சரிபார்க்கப்பட்ட கணக்கில் உள்நுழைக' : 'Sign in & Verify Phone'}</span>
            </button>
          </div>
        ) : loadError ? (
          <div className="my-12 rounded-3xl border border-red-200 bg-white p-10 text-center">
            <h3 className="font-heading text-lg font-bold text-neutral-900">
              {isTamil ? 'ஆர்டர்களைப் பெற முடியவில்லை' : 'Unable to Load Orders'}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-red-600">{loadError}</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order/${order.id}`)}
                className="group cursor-pointer rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all hover:border-raakky-red/40 hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-lg font-black text-neutral-900">
                        #{order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatOrderDate(order.createdAt, language)}</span>
                      <span>•</span>
                      <span>{order.orderType === 'DELIVERY' ? (isTamil ? 'வீட்டு டெலிவரி' : 'Delivery') : (isTamil ? 'கடையில் பெறுதல்' : 'Pickup')}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end sm:gap-6">
                    <div className="text-left sm:text-right">
                      <div className="font-heading text-xl font-black text-neutral-900">
                        {formatCurrency(order.finalTotal)}
                      </div>
                      <span className="text-xs text-stone-500">
                        {order.items.length} {isTamil ? 'பொருட்கள்' : 'items'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleReorder(order, e)}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-stone-600 transition-colors hover:border-raakky-red hover:bg-white hover:text-raakky-red"
                        title={t('orders.reorder')}
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                      <div className="rounded-xl bg-stone-100 p-2.5 text-stone-600 transition-colors group-hover:bg-raakky-red group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items preview snippet */}
                <div className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-600 line-clamp-1">
                  {order.items
                    .map(
                      (item) =>
                        `${isTamil ? item.productNameTa : item.productNameEn} (${formatWeight(
                          item.weightGrams,
                          language
                        )})`
                    )
                    .join(', ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="my-12 rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-raakky-cream text-raakky-orange">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-bold text-neutral-900">
              {t('orders.noOrders')}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-600">
              {isTamil
                ? 'நீங்கள் இன்னும் எந்த ஆர்டரையும் செய்யவில்லை. எங்களின் புதிய பண்ணை இறைச்சிகளை சுவைத்துப் பாருங்கள்!'
                : "You haven't placed any orders yet. Discover our fresh chicken cuts and order today!"}
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-raakky-red px-6 py-3 font-heading text-xs font-black uppercase tracking-wider text-white shadow-md hover:bg-raakky-red-dark"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{t('cart.startShopping')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
