import React, { useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { isAdmin } from './utils/adminAccess';


import PassengerDemo from './pages/RaiteIntegration/PassengerDemo';
import SplashScreen from './components/ui/SplashScreen';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auto-logout timeout (5 minutes in milliseconds)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

// Auth Pages
import Welcome from './pages/Onboarding/Welcome';
import CompleteRegistration from './pages/Onboarding/CompleteRegistration';
import { PhoneVerification, OTPVerification, PINSetup, ProfileSetup } from './pages/Onboarding';
import Login from './pages/Auth/Login';
import TwoFactorSetup from './pages/Auth/TwoFactorSetup';

// Tracking Page
import TrackingPage from './pages/Tracking/TrackingPage';

// Main Pages
import Dashboard from './pages/Home/Dashboard';
import Profile from './pages/Profile/Profile';
import ServicePayments from './pages/Services/ServicePayments';
import SendMoney from './pages/Transactions/SendMoney';
import ReceiveMoney from './pages/Transactions/ReceiveMoney';
import CashOut from './pages/Transactions/CashOut';
import Transactions from './pages/Transactions/Transactions';
import TransactionDetail from './pages/Transactions/TransactionDetail';
import AdminInterfaces from './pages/Admin/AdminInterfaces';
import AdminPayChat from './pages/Admin/AdminPayChat';
import PayChat from './pages/PayChat/PayChat';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/welcome" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  return isAdmin(user) ? children : <Navigate to="/dashboard" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  const { theme } = useUIStore();
  const { isAuthenticated, logout } = useAuthStore();
  const [appInitializing, setAppInitializing] = React.useState(true);
  const timeoutRef = useRef(null);

  // Stop Splash Screen after initial load simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppInitializing(false);
    }, 3500); // Wait 3.5 seconds to show splash animation
    return () => clearTimeout(timer);
  }, []);

  // Reset inactivity timer
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (isAuthenticated) {
      timeoutRef.current = setTimeout(() => {
        console.log('[App] Auto-logout due to inactivity');
        logout();
        window.location.href = '/login';
      }, INACTIVITY_TIMEOUT);
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Setup inactivity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, resetTimer]);


  if (appInitializing) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Tracking Route (Link de WhatsApp) */}
        <Route
          path="/track/:trackingNumber"
          element={<TrackingPage />}
        />

        {/* Public Routes - Onboarding */}
        <Route
          path="/welcome"
          element={
            <PublicRoute>
              <AuthLayout>
                <Welcome />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/raite-demo"
          element={
            <AuthLayout>
              <PassengerDemo />
            </AuthLayout>
          }
        />
        <Route
          path="/complete-registration"
          element={
            <PublicRoute>
              <AuthLayout>
                <CompleteRegistration />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <AuthLayout>
                <PhoneVerification />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-phone"
          element={
            <PublicRoute>
              <AuthLayout>
                <PhoneVerification />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <AuthLayout>
                <OTPVerification />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/setup-pin"
          element={
            <PublicRoute>
              <AuthLayout>
                <PINSetup />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/setup-profile"
          element={
            <PublicRoute>
              <AuthLayout>
                <ProfileSetup />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthLayout>
                <Login />
              </AuthLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/2fa-setup"
          element={
            <AuthLayout>
              <TwoFactorSetup />
            </AuthLayout>
          }
        />
        {/*
          <Route
            path="/2fa-verify"
            element={
              <AuthLayout>
                <TwoFactorVerify />
              </AuthLayout>
            }
          />
        */}

        {/* Protected Routes - Main App */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/send"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SendMoney />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/receive"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ReceiveMoney />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashout"
          element={
            <ProtectedRoute>
              <MainLayout>
                <CashOut />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ServicePayments />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Transactions />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <TransactionDetail />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/paychat"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PayChat />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/paychat"
          element={
            <AdminRoute>
              <AdminPayChat />
            </AdminRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminInterfaces />
            </AdminRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
