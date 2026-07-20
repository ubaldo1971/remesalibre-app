import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { authAPI } from '../../utils/api';
import { playUiSound } from '../../utils/soundUtils';
import './Welcome.css';

// Google Client ID - Replace with your actual Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const WelcomeContent = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { addNotification } = useNotificationStore();

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // Decode the JWT token from Google
            const decoded = jwtDecode(credentialResponse.credential);
            console.log('Google user:', decoded);

            // Call backend to check if user exists or login
            const response = await authAPI.googleLogin({
                email: decoded.email,
                googleId: decoded.sub,
                firstName: decoded.given_name,
                lastName: decoded.family_name,
                picture: decoded.picture
            });

            if (response.data.success) {
                if (response.data.isNewUser) {
                    // New user -> Go to registration
                    sessionStorage.setItem('googleUser', JSON.stringify({
                        email: decoded.email,
                        firstName: decoded.given_name,
                        lastName: decoded.family_name,
                        picture: decoded.picture,
                        googleId: decoded.sub,
                    }));
                    navigate('/complete-registration');
                } else {
                    // Existing user -> Login directly
                    const { user, accessToken, refreshToken } = response.data;

                    login({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phoneNumber,
                        picture: user.picture
                    }, {
                        accessToken,
                        refreshToken
                    });

                    // Notification
                    addNotification({
                        type: 'system',
                        icon: '👋',
                        title: `¡Hola de nuevo ${user.firstName}!`,
                        message: 'Inicio de sesión con Google exitoso.',
                    });

                    navigate('/dashboard');
                }
            }
        } catch (error) {
            console.error('Error handling Google login:', error);
        }
    };

    const handleGoogleError = () => {
        console.log('Google login failed');
    };

    return (
        <motion.div
            className="welcome-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="welcome-illustration">
                <div className="welcome-icon gradient-background">💸</div>
            </div>

            <div className="welcome-content">
                <h1 className="welcome-title">
                    Envía dinero <span className="gradient-text">al instante</span>
                </h1>
                <p className="welcome-description">
                    Pagos seguros y remesas internacionales sin complicaciones.
                    Simple como enviar un mensaje.
                </p>

                <div className="welcome-features">
                    <div className="feature-item">
                        <span className="feature-icon">⚡</span>
                        <p>Transferencias instantáneas</p>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🔒</span>
                        <p>100% seguro y encriptado</p>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">💰</span>
                        <p>Comisiones ultra bajas</p>
                    </div>
                </div>
            </div>

            <div className="welcome-actions">
                {/* Google Sign In Button */}
                <div className="google-login-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                        logo_alignment="left"
                        width="100%"
                    />
                </div>

                <div className="divider">
                    <span className="divider-line"></span>
                    <span className="divider-text">o</span>
                    <span className="divider-line"></span>
                </div>

                <Button
                    variant="outline"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/register')}
                >
                    Registrarse con teléfono
                </Button>

                <button
                    className="link-button"
                    onClick={() => {
                        playUiSound('click');
                        navigate('/login');
                    }}
                    onMouseEnter={() => playUiSound('hover')}
                >
                    ¿Ya tienes cuenta? <strong>Iniciar sesión</strong>
                </button>
            </div>
        </motion.div>
    );
};

const Welcome = () => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <WelcomeContent />
        </GoogleOAuthProvider>
    );
};

export default Welcome;
