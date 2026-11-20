import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CartItem, CuttingPreference, Product, ProductVariant } from '../types';
import { safeStorage, StorageKeys } from '../services/storage';
import { useShop } from './ShopContext';
import { api } from '../services/api';

interface AddToCartOptions {
  product: Product;
  variant: ProductVariant;
  quantity?: number;
  cuttingPreference: CuttingPreference;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  finalTotal: number;
  isFreeDelivery: boolean;
  freeDeliveryRemaining: number;
  discontinuedItemsRemoved: string[];
  addToCart: (options: AddToCartOptions) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  revalidateCart: () => Promise<{ hasChanges: boolean; removedCount: number }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateCartItemId(
  productId: string,
  variantId: string,
  cuttingPreference: CuttingPreference
): string {
  const skinPart = cuttingPreference.skinType || 'none';
  const specialPart = (cuttingPreference.specialInstructions || '').trim().toLowerCase().slice(0, 15);
  return `${productId}__${variantId}__${cuttingPreference.cutType}__${skinPart}__${specialPart}`;
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useShop();

  const [discontinuedItemsRemoved, setDiscontinuedItemsRemoved] = useState<string[]>([]);

  const [items, setItems] = useState<CartItem[]>(() => {
    const rawSaved = safeStorage.get<any[]>(StorageKeys.CART, []);
    // Initial validation against current confirmed catalogue
    const { validItems, removedNames } = api.validateCartItems(rawSaved);
    if (removedNames.length > 0) {
      safeStorage.set(StorageKeys.CART, validItems);
    }
    return validItems as CartItem[];
  });

  useEffect(() => {
    safeStorage.set(StorageKeys.CART, items);
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Delivery fee logic from shop settings (no hardcoded ₹499 assumption)
  const isFreeDelivery = Boolean(
    settings.freeDeliveryThreshold &&
      settings.freeDeliveryThreshold > 0 &&
      subtotal >= settings.freeDeliveryThreshold
  );
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : settings.deliveryFee;
  const freeDeliveryRemaining =
    settings.freeDeliveryThreshold && settings.freeDeliveryThreshold > 0
      ? Math.max(0, settings.freeDeliveryThreshold - subtotal)
      : 0;
  const packagingFee = 0;
  const finalTotal = subtotal + deliveryFee + packagingFee;

  const addToCart = useCallback((options: AddToCartOptions) => {
    const { product, variant, quantity = 1, cuttingPreference } = options;
    const cartItemId = generateCartItemId(product.id, variant.id, cuttingPreference);

    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(item => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(20, updated[existingIndex].quantity + quantity),
        };
        return updated;
      }

      const newItem: CartItem = {
        cartItemId,
        productId: product.id,
        productNameEn: product.nameEn,
        productNameTa: product.nameTa,
        imageUrl: product.imageUrl,
        variantId: variant.id,
        weightGrams: variant.weightGrams,
        weightLabelEn: variant.weightLabelEn,
        weightLabelTa: variant.weightLabelTa,
        unitPrice: variant.price,
        quantity: Math.min(20, Math.max(1, quantity)),
        cuttingPreference,
      };

      return [newItem, ...prevItems];
    });
  }, []);

  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: Math.min(20, Math.max(1, newQuantity)) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const revalidateCart = useCallback(async (): Promise<{ hasChanges: boolean; removedCount: number }> => {
    try {
      const allProducts = await api.getProducts();
      let hasChanges = false;
      let removedCount = 0;

      const validItems: CartItem[] = [];

      for (const item of items) {
        const product = allProducts.find(p => p.id === item.productId);
        if (!product || !product.isAvailable) {
          hasChanges = true;
          removedCount += item.quantity;
          continue;
        }

        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant || !variant.isAvailable) {
          hasChanges = true;
          removedCount += item.quantity;
          continue;
        }

        if (variant.price !== item.unitPrice) {
          hasChanges = true;
          validItems.push({
            ...item,
            unitPrice: variant.price,
          });
        } else {
          validItems.push(item);
        }
      }

      if (hasChanges) {
        setItems(validItems);
      }

      return { hasChanges, removedCount };
    } catch {
      return { hasChanges: false, removedCount: 0 };
    }
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        deliveryFee,
        packagingFee,
        finalTotal,
        isFreeDelivery,
        freeDeliveryRemaining,
        discontinuedItemsRemoved,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        revalidateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
