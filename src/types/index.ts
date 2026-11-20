export type Language = 'en' | 'ta';

export type ShopStatusState = 'open' | 'closed' | 'paused';

export interface ShopSettings {
  isOpen: boolean;
  orderAcceptancePaused: boolean;
  pauseReasonEn: string;
  pauseReasonTa: string;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number; // Optional if configured by shop, never hardcoded
  storePhone: string;
  storeAddressEn: string;
  storeAddressTa: string;
  storeMapUrl: string;
  estimatedDeliveryMins: number;
  estimatedPickupMins: number;
  bannerMessageEn?: string;
  bannerMessageTa?: string;
  openingHours: {
    weekdays: string;
    sunday: string;
  };
}

export type DeliveryLocalityId =
  | 'press-colony'
  | 'veerapandi-pirivu'
  | 'periyanaickenpalayam'
  | 'mathampalayam';

export interface DeliveryLocality {
  id: DeliveryLocalityId;
  nameEn: string;
  nameTa: string;
  isAvailable: boolean;
  defaultPincode: string;
}

export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameTa: string;
  descriptionEn: string;
  descriptionTa: string;
  iconName: string;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  weightGrams: number;
  weightLabelEn: string;
  weightLabelTa: string;
  price: number;
  isAvailable: boolean;
  stockCount?: number;
}

export type CutType =
  | 'curry_medium'
  | 'curry_small'
  | 'chukka_cut'
  | 'fry_bite_size'
  | 'drumstick_cut'
  | 'wings_cut'
  | 'thigh_bone_in'
  | 'thigh_boneless'
  | 'boneless_cubes'
  | 'standard_cut';

export type SkinType = 'skin_off' | 'skin_on';

export interface CuttingPreference {
  cutType: CutType;
  skinType?: SkinType;
  specialInstructions?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  nameEn: string;
  nameTa: string;
  slug: string;
  shortDescEn: string;
  shortDescTa: string;
  descriptionEn: string;
  descriptionTa: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isPopular?: boolean;
  variants: ProductVariant[];
  supportedCuts: CutType[];
  allowSkinSelection: boolean; // default false
  defaultSkinType?: SkinType;
  bonelessType?: 'breast' | 'thigh' | 'mixed';
  approxWeightPerPiece?: {
    minGrams: number;
    maxGrams: number;
    noteEn?: string;
    noteTa?: string;
  };
  approxPieceCount?: {
    [weightGrams: number]: { min: number; max: number };
  };
  searchAliases: string[];
  storageTipsEn?: string;
  storageTipsTa?: string;
  netWeightNoteEn?: string;
  netWeightNoteTa?: string;
}

export interface CartItem {
  cartItemId: string; // Unique combination of product + variant + cut preferences
  productId: string;
  productNameEn: string;
  productNameTa: string;
  imageUrl: string;
  variantId: string;
  weightGrams: number;
  weightLabelEn: string;
  weightLabelTa: string;
  unitPrice: number;
  quantity: number;
  cuttingPreference: CuttingPreference;
}

export type OrderType = 'DELIVERY' | 'PICKUP';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH_ON_DELIVERY'
  | 'PAY_AT_STORE'
  | 'PAY_ONLINE'
  | 'UPI_GPAY'
  | 'UPI_PHONEPE'
  | 'UPI_PAYTM'
  | 'UPI_QR'
  | 'UPI_ID';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CustomerAddress {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  recipientName: string;
  recipientPhone: string;
  localityId?: DeliveryLocalityId;
  localityName?: string;
  flatNumber: string;
  streetAddress: string;
  landmark: string;
  pincode: string;
  deliveryNotes?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  email?: string;
  isPhoneVerified: boolean;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  createdAt: string;
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  variantId: string;
  productNameEn: string;
  productNameTa: string;
  imageUrl: string;
  weightGrams: number;
  weightLabelEn: string;
  weightLabelTa: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  cutType: CutType;
  skinType?: SkinType;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  status: OrderStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  deliveryAddress?: CustomerAddress;
  items: OrderItemRecord[];
  itemTotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  upiTransactionId?: string;
  upiApp?: string;
  estimatedTime?: string;
  createdAt: string;
  updatedAt: string;
  statusTimeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  titleEn: string;
  titleTa: string;
  messageEn?: string;
  messageTa?: string;
  duration?: number;
  action?: {
    labelEn: string;
    labelTa: string;
    onClick: () => void;
  };
}
