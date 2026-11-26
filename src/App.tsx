import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ShopProvider } from './contexts/ShopContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/notifications/ToastContainer';
import { AuthModal } from './components/dialogs/AuthModal';
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
import { InstallApp } from './pages/InstallApp';
import { NotFound } from './pages/NotFound';

const AuthRedirectHandler: React.FC = () => {
  const { pendingRedirectPath, clearPendingRedirectPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (pendingRedirectPath) {
      const target = pendingRedirectPath;
      clearPendingRedirectPath();
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [pendingRedirectPath, clearPendingRedirectPath, navigate, location.pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <NotificationProvider>
          <ShopProvider>
            <AuthProvider>
              <CartProvider>
                <BrowserRouter>
                  <AuthRedirectHandler />
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
                        <Route path="/install" element={<InstallApp />} />
                        <Route path="/download" element={<InstallApp />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>

                    {/* Footer */}
                    <Footer />

                    {/* Mobile Bottom Navigation */}
                    <MobileBottomNav />

                    {/* Central Toast Notifications */}
                    <ToastContainer />

                    {/* Global Customer Authentication & Phone Linking Modal */}
                    <AuthModal />
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
