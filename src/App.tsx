import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ShopProvider } from './contexts/ShopContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/notifications/ToastContainer';
import { OfflineBanner } from './components/errors/OfflineBanner';
import { ErrorBoundary } from './components/errors/ErrorBoundary';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderStatus } from './pages/OrderStatus';
import { OrderHistory } from './pages/OrderHistory';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <ShopProvider>
            <AuthProvider>
              <CartProvider>
                <BrowserRouter>
                  <div className="flex min-h-screen flex-col bg-stone-50 text-neutral-900 selection:bg-raakky-red/20 selection:text-raakky-red">
                    {/* Main Header (contains ToplineBanner & CartDrawer) */}
                    <Header />

                    {/* Offline Banner Indicator */}
                    <OfflineBanner />

                    {/* Main Routed Page Content */}
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/shop" element={<Shop />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order/:id" element={<OrderStatus />} />
                        <Route path="/orders" element={<OrderHistory />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>

                    {/* Footer */}
                    <Footer />

                    {/* Mobile Bottom Navigation */}
                    <MobileBottomNav />

                    {/* Central Toast Notifications */}
                    <ToastContainer />
                  </div>
                </BrowserRouter>
              </CartProvider>
            </AuthProvider>
          </ShopProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
