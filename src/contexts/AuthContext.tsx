import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Customer, CustomerAddress } from '../types';
import { api } from '../services/api';
import { safeStorage, StorageKeys } from '../services/storage';

interface AuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isPhoneVerified: boolean;
  token: string | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  updateProfile: (name: string, email?: string) => Promise<void>;
  saveAddress: (address: Omit<CustomerAddress, 'id'>, editId?: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    return safeStorage.get<Customer | null>(StorageKeys.CUSTOMER, null);
  });
  const [token, setToken] = useState<string | null>(() => {
    return safeStorage.getString(StorageKeys.TOKEN, '');
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (customer) {
      safeStorage.set(StorageKeys.CUSTOMER, customer);
    } else {
      safeStorage.remove(StorageKeys.CUSTOMER);
    }
  }, [customer]);

  useEffect(() => {
    if (token) {
      safeStorage.setString(StorageKeys.TOKEN, token);
    } else {
      safeStorage.remove(StorageKeys.TOKEN);
    }
  }, [token]);

  const sendOtp = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, otp);
      if (res.success && res.customer) {
        setCustomer(res.customer);
        setToken(res.token);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      const googleUser: Customer = {
        id: `google-user-${Date.now()}`,
        phone: customer?.phone || '',
        name: 'Google Customer',
        email: 'customer@gmail.com',
        isPhoneVerified: !!customer?.isPhoneVerified,
        addresses: customer?.addresses || [],
        createdAt: new Date().toISOString(),
      };
      setCustomer(googleUser);
      setToken(`token_google_${Date.now()}`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [customer]);

  const logout = useCallback(() => {
    setCustomer(null);
    setToken(null);
    safeStorage.remove(StorageKeys.CUSTOMER);
    safeStorage.remove(StorageKeys.TOKEN);
  }, []);

  const updateProfile = useCallback(async (name: string, email?: string) => {
    if (!customer) return;
    const updated = await api.updateCustomerProfile({ name, email });
    setCustomer(updated);
  }, [customer]);

  const saveAddress = useCallback(async (addressData: Omit<CustomerAddress, 'id'>, editId?: string) => {
    if (!customer) return;

    let updatedAddresses = [...customer.addresses];

    if (editId) {
      updatedAddresses = updatedAddresses.map(addr =>
        addr.id === editId ? { ...addressData, id: editId } : addr
      );
    } else {
      const newAddress: CustomerAddress = {
        ...addressData,
        id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      if (addressData.isDefault || updatedAddresses.length === 0) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
        newAddress.isDefault = true;
      }
      updatedAddresses.push(newAddress);
    }

    const defaultAddr = updatedAddresses.find(a => a.isDefault) || updatedAddresses[0];

    const updatedCustomer: Customer = {
      ...customer,
      addresses: updatedAddresses,
      defaultAddressId: defaultAddr?.id,
    };

    setCustomer(updatedCustomer);
    await api.updateCustomerProfile(updatedCustomer);
  }, [customer]);

  const deleteAddress = useCallback(async (addressId: string) => {
    if (!customer) return;
    const updatedAddresses = customer.addresses.filter(a => a.id !== addressId);
    const updatedCustomer: Customer = {
      ...customer,
      addresses: updatedAddresses,
      defaultAddressId: customer.defaultAddressId === addressId ? updatedAddresses[0]?.id : customer.defaultAddressId,
    };
    setCustomer(updatedCustomer);
    await api.updateCustomerProfile(updatedCustomer);
  }, [customer]);

  const setDefaultAddress = useCallback(async (addressId: string) => {
    if (!customer) return;
    const updatedAddresses = customer.addresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    const updatedCustomer: Customer = {
      ...customer,
      addresses: updatedAddresses,
      defaultAddressId: addressId,
    };
    setCustomer(updatedCustomer);
    await api.updateCustomerProfile(updatedCustomer);
  }, [customer]);

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isPhoneVerified: !!customer?.isPhoneVerified && !!customer.phone,
        token,
        loading,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        logout,
        updateProfile,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
