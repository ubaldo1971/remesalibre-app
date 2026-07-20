import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { authAPI } from '../../utils/api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { playUiSound } from '../../utils/soundUtils';
import './Login.css';

// Google Client ID - Replace with your actual Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginContent = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const { addNotification } = useNotificationStore();
    const [phone, setPhone] = useState('');
    const [countryPrefix, setCountryPrefix] = useState('+52 1');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Phone prefix options
    const prefixOptions = [
        { value: '+52 1', label: '🇲🇽 +52 1' },
        { value: '+1', label: '🇺🇸 +1' }
    ];

    // Format phone number for API
    const formatPhoneNumber = (phone, prefix) => {
        const cleaned = phone.replace(/\D/g, '');
        const prefixClean = prefix.replace(/\s/g, '');
        return prefixClean + cleaned;
    };

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
            setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
        }
    };

    const handleGoogleError = () => {
        console.log('Google login failed');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone.trim()) {
            setError('Ingresa tu número de teléfono');
            return;
        }

        if (!pin.trim()) {
            setError('Ingresa tu PIN');
            return;
        }

        setLoading(true);

        try {
            const formattedPhone = formatPhoneNumber(phone, countryPrefix);
            const response = await authAPI.login(formattedPhone, pin);

            const { user, accessToken, refreshToken } = response.data;

            // Store user and tokens
            const userData = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phoneNumber,
                email: user.email,
            };

            const tokens = {
                accessToken,
                refreshToken,
            };

            // Check if user has 2FA enabled
            const has2FA = localStorage.getItem('2fa_enabled') === 'true';

            if (has2FA) {
                // Redirect to 2FA verification
                navigate('/2fa-verify', {
                    state: { user: userData, tokens },
                });
            } else {
                // Complete login
                login(userData, tokens);

                // Send welcome notification
                setTimeout(() => {
                    addNotification({
                        type: 'system',
                        icon: '👋',
                        title: `¡Hola ${user.firstName}!`,
                        message: 'Bienvenido de vuelta a RemesaLibre. ¿Qué te gustaría hacer hoy?',
                    });
                }, 1500);

                // Check if should setup 2FA
                const shouldSetup2FA = !localStorage.getItem('2fa_setup_skipped');
                if (shouldSetup2FA) {
                    navigate('/2fa-setup');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            console.error('Login error:', err);

            if (err.response?.status === 401) {
                setError('Teléfono o PIN incorrectos');
            } else if (err.response?.status === 403) {
                setError('Cuenta bloqueada. Contacta soporte.');
            } else if (err.response?.status === 429) {
                const retryAfter = err.response.data?.retryAfter || 15;
                setError(`Demasiados intentos. Espera ${retryAfter} minutos.`);
            } else if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError('Error de conexión. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <Card variant="elevated" className="login-card">
                <div className="auth-branding-inline" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="auth-logo gradient-text" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>RemesaLibre</h1>
                    <p className="auth-tagline" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pagos instantáneos sin fronteras</p>
                </div>

                <div className="login-header">
                    <h2>Iniciar Sesión</h2>
                    <p>Ingresa tus credenciales</p>
                </div>

                {/* Google Sign In Button */}
                <div className="google-login-wrapper" style={{ marginBottom: '1.5rem', width: '100%' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_blue"
                        size="large"
                        text="signin_with"
                        shape="rectangular"
                        logo_alignment="left"
                        width="100%"
                    />
                </div>

                <div className="divider" style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                    <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>o con teléfono</span>
                    <span style={{ flex: 1, borderBottom: '1px solid var(--border-color)' }}></span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <Input
                        type="tel"
                        label="Número de teléfono"
                        prefixOptions={prefixOptions}
                        selectedPrefix={countryPrefix}
                        onPrefixChange={setCountryPrefix}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="5512345678"
                        maxLength={10}
                    />

                    <Input
                        type="password"
                        label="PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••••"
                        maxLength={6}
                    />

                    {error && <div className="error-text">{error}</div>}

                    <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        size="large"
                        loading={loading}
                    >
                        Ingresar
                    </Button>
                </form>

                <div className="login-footer">
                    <button
                        className="link-button"
                        onClick={() => {
                            playUiSound('click');
                            navigate('/welcome');
                        }}
                        onMouseEnter={() => playUiSound('hover')}
                    >
                        Volver al inicio
                    </button>
                    <span className="separator">•</span>
                    <button
                        className="link-button"
                        onClick={() => {
                            playUiSound('click');
                            navigate('/register');
                        }}
                        onMouseEnter={() => playUiSound('hover')}
                    >
                        Crear cuenta
                    </button>
                </div>

                {/* Demo info */}
                <div className="demo-info">
                    💡 <strong>Demo:</strong> Usa 5512345678 con PIN 123456
                </div>
            </Card>
        </div>
    );
};


const Login = () => {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
};

export default Login;
