import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import AuthGate from './pages/AuthGate';
import OTPVerify from './pages/OTPVerify';
import BasicProfile from './pages/BasicProfile';

// SEND FLOW
import AmountInput from './pages/flow/send/AmountInput';
import RecipientSelection from './pages/flow/send/RecipientSelection';
import PaymentMethod from './pages/flow/send/PaymentMethod';
import Review from './pages/flow/send/Review';
import Success from './pages/flow/send/Success';

// RECEIVE FLOW
import BalanceHome from './pages/flow/receive/BalanceHome';
import Withdraw from './pages/flow/receive/Withdraw';
import Pay from './pages/flow/receive/Pay';

// IDENTITY FLOW
import TrustPrompt from './pages/flow/identity/TrustPrompt';
import DocumentCapture from './pages/flow/identity/DocumentCapture';
import SelfieCheck from './pages/flow/identity/SelfieCheck';
import Processing from './pages/flow/identity/Processing';

// SETTINGS FLOW
import SettingsHome from './pages/flow/settings/SettingsHome';
import Profile from './pages/flow/settings/Profile';
import Security from './pages/flow/settings/Security';
import PaymentMethods from './pages/flow/settings/PaymentMethods';
import Notifications from './pages/flow/settings/Notifications';
import Limits from './pages/flow/settings/Limits';
import Help from './pages/flow/settings/Help';
import Legal from './pages/flow/settings/Legal';
import ErrorScreen from './pages/feedback/ErrorScreen';
import ProcessingScreen from './pages/feedback/ProcessingScreen';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth/login" element={<AuthGate />} />
                    <Route path="/auth/otp" element={<OTPVerify />} />
                    <Route path="/auth/profile" element={<BasicProfile />} />

                    {/* SEND FLOW ROUTES */}
                    <Route path="/flow/send/amount" element={<AmountInput />} />
                    <Route path="/flow/send/recipient" element={<RecipientSelection />} />
                    <Route path="/flow/send/payment" element={<PaymentMethod />} />
                    <Route path="/flow/send/review" element={<Review />} />
                    <Route path="/flow/send/success" element={<Success />} />

                    {/* RECEIVE FLOW ROUTES */}
                    <Route path="/flow/receive/balance" element={<BalanceHome />} />
                    <Route path="/flow/receive/withdraw" element={<Withdraw />} />
                    <Route path="/flow/receive/pay" element={<Pay />} />

                    {/* IDENTITY FLOW ROUTES */}
                    <Route path="/flow/identity/trust" element={<TrustPrompt />} />
                    <Route path="/flow/identity/document" element={<DocumentCapture />} />
                    <Route path="/flow/identity/selfie" element={<SelfieCheck />} />
                    <Route path="/flow/identity/processing" element={<Processing />} />

                    {/* SETTINGS FLOW ROUTES */}
                    <Route path="/flow/settings" element={<SettingsHome />} />
                    <Route path="/flow/settings/profile" element={<Profile />} />
                    <Route path="/flow/settings/security" element={<Security />} />
                    <Route path="/flow/settings/payments" element={<PaymentMethods />} />
                    <Route path="/flow/settings/notifications" element={<Notifications />} />
                    <Route path="/flow/settings/limits" element={<Limits />} />
                    <Route path="/flow/settings/help" element={<Help />} />
                    <Route path="/flow/settings/legal" element={<Legal />} />

                    {/* FEEDBACK ROUTES */}
                    <Route path="/feedback/error" element={<ErrorScreen />} />
                    <Route path="/feedback/processing" element={<ProcessingScreen />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
