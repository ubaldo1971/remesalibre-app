import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import './TwoFactorSetup.css';

const TwoFactorSetup = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        // Generate a mock secret key (in real app, this comes from server)
        const mockSecret = generateMockSecret();
        setSecret(mockSecret);
    }, []);

    const generateMockSecret = () => {
        // Generate a random 32-character secret
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleVerify = async () => {
        setError('');

        if (!verificationCode || verificationCode.length !== 6) {
            setError('Ingresa un código de 6 dígitos');
            return;
        }

        setIsVerifying(true);

        // Simulate API call
        setTimeout(() => {
            // Mock verification - accept any 6-digit code for demo
            if (/^\d{6}$/.test(verificationCode)) {
                // Save 2FA as enabled in localStorage
                localStorage.setItem('2fa_enabled', 'true');
                localStorage.setItem('2fa_secret', secret);

                alert('¡2FA configurado exitosamente!');
                navigate('/dashboard');
            } else {
                setError('Código inválido. Usa cualquier código de 6 dígitos para la demo.');
            }
            setIsVerifying(false);
        }, 1500);
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    // Generate OTP URI for QR code
    const otpUri = `otpauth://totp/RemesaLibre:${user?.email || 'usuario@ejemplo.com'}?secret=${secret}&issuer=RemesaLibre`;

    return (
        <div className="two-factor-setup">
            <motion.div
                className="setup-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card variant="elevated" className="setup-card">
                    <div className="setup-header">
                        <div className="icon-2fa">🔐</div>
                        <h1>Configurar Autenticación de Dos Factores</h1>
                        <p className="setup-subtitle">
                            Aumenta la seguridad de tu cuenta con 2FA
                        </p>
                    </div>

                    <div className="setup-steps">
                        {/* Step 1: Download App */}
                        <div className="setup-step">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Descarga una app de autenticación</h3>
                                <p>Usa Google Authenticator, Authy, o similar</p>
                                <div className="app-badges">
                                    <span className="app-badge">Google Authenticator</span>
                                    <span className="app-badge">Authy</span>
                                    <span className="app-badge">Microsoft Authenticator</span>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Scan QR Code */}
                        <div className="setup-step">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Escanea este código QR</h3>
                                <p>Abre tu app de autenticación y escanea el código</p>
                                <div className="qr-container">
                                    <QRCodeSVG
                                        value={otpUri}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <div className="secret-key">
                                    <p className="secret-label">O ingresa esta clave manualmente:</p>
                                    <code className="secret-code">{secret}</code>
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Verify Code */}
                        <div className="setup-step">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Verifica el código</h3>
                                <p>Ingresa el código de 6 dígitos de tu app</p>
                                <Input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 6) {
                                            setVerificationCode(value);
                                            setError('');
                                        }
                                    }}
                                    placeholder="000000"
                                    error={error}
                                    maxLength={6}
                                    className="code-input"
                                />

                                {/* Demo hint */}
                                <div className="demo-hint">
                                    💡 <strong>Demo:</strong> Ingresa cualquier código de 6 dígitos
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="setup-actions">
                        <Button
                            variant="ghost"
                            size="large"
                            onClick={handleSkip}
                        >
                            Omitir por ahora
                        </Button>
                        <Button
                            variant="primary"
                            size="large"
                            onClick={handleVerify}
                            loading={isVerifying}
                            disabled={verificationCode.length !== 6}
                        >
                            Activar 2FA
                        </Button>
                    </div>
                </Card>

                {/* Security Benefits */}
                <div className="security-benefits">
                    <h4>🛡️ ¿Por qué activar 2FA?</h4>
                    <ul>
                        <li>✅ Protección adicional contra accesos no autorizados</li>
                        <li>✅ Código único cada 30 segundos</li>
                        <li>✅ Funciona sin conexión a internet</li>
                        <li>✅ Estándar de seguridad bancaria</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
};

export default TwoFactorSetup;
