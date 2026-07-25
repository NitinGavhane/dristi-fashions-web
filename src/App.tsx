import React, { useCallback, useEffect, useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { ToastContainer } from './components/common/ToastContainer';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpPage } from './pages/OtpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ReturnReplacePage } from './pages/ReturnReplacePage';
import { AddressesPage } from './pages/AddressesPage';
import { WalletPage } from './pages/WalletPage';
import { ReferralPage } from './pages/ReferralPage';
import { SettingsPage } from './pages/SettingsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { WishlistPage } from './pages/WishlistPage';
import { BlogPage } from './pages/BlogPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Screens rendered without the storefront chrome. */
const AUTH_PATHS = ['/login', '/register', '/otp-verification', '/forgot-password', '/reset-password'];

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    () => `${window.location.pathname}${window.location.search}` || '/',
  );

  useEffect(() => {
    const handlePopState = () => setCurrentPath(`${window.location.pathname}${window.location.search}`);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const pathname = currentPath.split('?')[0];
  const isAuthPage = AUTH_PATHS.includes(pathname);

  const renderContent = () => {
    switch (pathname) {
      case '':
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/search':
        return <SearchPage currentPath={currentPath} onNavigate={navigate} />;
      case '/login':
        return <LoginPage currentPath={currentPath} onNavigate={navigate} />;
      case '/register':
        return <RegisterPage currentPath={currentPath} onNavigate={navigate} />;
      case '/otp-verification':
        return <OtpPage currentPath={currentPath} onNavigate={navigate} />;
      case '/forgot-password':
        return <ForgotPasswordPage onNavigate={navigate} />;
      case '/reset-password':
        return <ResetPasswordPage currentPath={currentPath} onNavigate={navigate} />;
      case '/cart':
        return <CartPage onNavigate={navigate} />;
      case '/checkout':
        return <CheckoutPage onNavigate={navigate} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} />;
      case '/orders':
        return <OrdersPage onNavigate={navigate} />;
      case '/profile/addresses':
        return <AddressesPage onNavigate={navigate} />;
      case '/profile/wallet':
        return <WalletPage onNavigate={navigate} />;
      case '/profile/referral':
        return <ReferralPage onNavigate={navigate} />;
      case '/profile/settings':
        return <SettingsPage onNavigate={navigate} />;
      case '/profile/change-password':
        return <ChangePasswordPage onNavigate={navigate} />;
      case '/profile/about':
        return <AboutPage onNavigate={navigate} />;
      case '/contact':
        return <ContactPage onNavigate={navigate} />;
      case '/wishlist':
        return <WishlistPage onNavigate={navigate} />;
      case '/blog':
        return <BlogPage onNavigate={navigate} />;
      case '/categories':
        return <CategoriesPage onNavigate={navigate} />;
      default:
        break;
    }

    // Dynamic segments. Keying on the id remounts the page when navigating
    // between two products (or two orders), which resets their local state.
    if (pathname.startsWith('/product/')) {
      const id = pathname.slice('/product/'.length);
      return <ProductDetailPage key={id} productId={id} onNavigate={navigate} />;
    }

    if (pathname.startsWith('/orders/')) {
      const rest = pathname.slice('/orders/'.length);
      const RETURN_SUFFIX = '/return-replace';
      if (rest.endsWith(RETURN_SUFFIX)) {
        const id = rest.slice(0, -RETURN_SUFFIX.length);
        return <ReturnReplacePage key={id} orderId={id} onNavigate={navigate} />;
      }
      return <OrderDetailPage key={rest} orderId={rest} onNavigate={navigate} />;
    }

    return <NotFoundPage onNavigate={navigate} />;
  };

  return (
    <StoreProvider>
      <div className="min-h-screen bg-[#fbf8ff] text-[#181a2d] flex flex-col font-sans antialiased selection:bg-[#fed255] selection:text-[#0d1648]">
        <ToastContainer />

        {!isAuthPage && <Header onNavigate={navigate} currentPath={currentPath} />}

        <main className="flex-1">{renderContent()}</main>

        {!isAuthPage && <Footer onNavigate={navigate} />}
      </div>
    </StoreProvider>
  );
}
