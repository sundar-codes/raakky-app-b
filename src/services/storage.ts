export const StorageKeys = {
  LANGUAGE: 'raakky_lang',
  CART: 'raakky_cart_items',
  CUSTOMER: 'raakky_customer_profile',
  TOKEN: 'raakky_session_token',
  SAVED_ADDRESSES: 'raakky_customer_addresses',
  ACTIVE_ORDER_ID: 'raakky_active_order_id',
  ORDERS: 'raakky_orders_history',
} as const;

export const safeStorage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to persist ${key} to localStorage:`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key} from localStorage:`, e);
    }
  },

  getString(key: string, defaultValue: string = ''): string {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setString(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Failed to persist string ${key} to localStorage:`, e);
    }
  }
};
