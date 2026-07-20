// Enhanced Phone Verification with Ecosystem Detection
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { EcosystemAlert, checkEcosystem } from '../../components/EcosystemAlert';

export const PhoneVerification = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [ecosystemAccount, setEcosystemAccount] = useState(null);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState('');

    const formatPhone = (value) => {
        const digits = value.replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    };

    const handlePhoneChange = async (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhone(value);
        setError('');

        // Check ecosystem when phone is complete
        if (value.length === 10) {
            setChecking(true);
            try {
                const result = await checkEcosystem(value);
                if (result.exists) {
                    setEcosystemAccount(result);
                    console.log('🔗 Ecosystem account found:', result);
                } else {
                    setEcosystemAccount(null);
                }
            } catch (err) {
                console.error('Ecosystem check error:', err);
            } finally {
                setChecking(false);
            }
        } else {
            setEcosystemAccount(null);
        }
    };

    const handleSubmit = () => {
        if (phone.length !== 10) {
            setError('Ingresa un número de 10 dígitos');
            return;
        }
        navigate('/verify-otp');
    };

    return (
        <div style={{
            padding: '2rem',
            maxWidth: '400px',
            margin: '0 auto'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: '36px'
                }}>
                    📱
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Verificación de Teléfono
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Ingresa tu número de celular para continuar
                </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--surface)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: error ? '2px solid #ef4444' : '2px solid transparent'
                }}>
                    <span style={{
                        color: 'var(--text-secondary)',
                        fontWeight: 'bold',
                        marginRight: '12px',
                        fontSize: '18px'
                    }}>
                        +52
                    </span>
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={formatPhone(phone)}
                        onChange={handlePhoneChange}
                        placeholder="123 456 7890"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: 'var(--text-primary)',
                            letterSpacing: '1px'
                        }}
                        autoFocus
                    />
                </div>
                {error && (
                    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
                        {error}
                    </p>
                )}
                {checking && (
                    <p style={{
                        color: 'var(--primary)',
                        fontSize: '12px',
                        marginTop: '8px',
                        textAlign: 'center'
                    }}>
                        ✨ Verificando en ecosistema RAITE...
                    </p>
                )}
            </div>

            {/* Show ecosystem alert if account found */}
            {ecosystemAccount && ecosystemAccount.exists && (
                <EcosystemAlert
                    userName={ecosystemAccount.user?.name}
                    apps={ecosystemAccount.apps}
                    onContinue={() => {
                        // Pre-fill user data if available
                        if (ecosystemAccount.user) {
                            sessionStorage.setItem('ecosystemUser', JSON.stringify(ecosystemAccount.user));
                        }
                    }}
                />
            )}

            <div style={{ marginTop: '2rem' }}>
                <Button
                    onClick={handleSubmit}
                    fullWidth
                    disabled={phone.length < 10}
                >
                    Enviar código
                </Button>
            </div>

            <p style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginTop: '1.5rem',
                lineHeight: 1.5
            }}>
                Al continuar, aceptas nuestros{' '}
                <a href="/terms" style={{ color: 'var(--primary)' }}>Términos de Servicio</a>
                {' '}y{' '}
                <a href="/privacy" style={{ color: 'var(--primary)' }}>Política de Privacidad</a>
            </p>
        </div>
    );
};

export const OTPVerification = () => {
    const navigate = useNavigate();
    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Código de Verificación</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Ingresa el código que enviamos a tu teléfono
            </p>
            <Button onClick={() => navigate('/setup-pin')} fullWidth>
                Verificar
            </Button>
        </div>
    );
};

export const PINSetup = () => {
    const navigate = useNavigate();
    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Crea tu PIN</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Este PIN protegerá tus transacciones
            </p>
            <Button onClick={() => navigate('/setup-profile')} fullWidth>
                Confirmar PIN
            </Button>
        </div>
    );
};

export const ProfileSetup = () => {
    const navigate = useNavigate();
    const { login } = require('../../store/authStore').useAuthStore();

    const handleComplete = () => {
        // Check if we have ecosystem user data
        const ecosystemUser = sessionStorage.getItem('ecosystemUser');
        let userData = { firstName: 'Usuario', lastName: 'Demo', phone: '+52123456789' };

        if (ecosystemUser) {
            try {
                const parsed = JSON.parse(ecosystemUser);
                const nameParts = (parsed.name || '').split(' ');
                userData = {
                    firstName: nameParts[0] || 'Usuario',
                    lastName: nameParts.slice(1).join(' ') || '',
                    phone: '+52123456789'
                };
                sessionStorage.removeItem('ecosystemUser');
            } catch (e) { }
        }

        login(
            userData,
            { accessToken: 'demo-token', refreshToken: 'demo-refresh' }
        );
        navigate('/dashboard');
    };

    return (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Completa tu perfil</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                Necesitamos algunos datos básicos
            </p>
            <Button onClick={handleComplete} fullWidth>
                Completar registro
            </Button>
        </div>
    );
};

export default PhoneVerification;
