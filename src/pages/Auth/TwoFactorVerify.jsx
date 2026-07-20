import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import './TwoFactorVerify.css';

const TwoFactorVerify = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = useRef([]);

    // Get user data from navigation state
    const tempUser = location.state?.user;
    const tempTokens = location.state?.tokens;

    useEffect(() => {
        // If no temp user data, redirect to login
        if (!tempUser) {
            navigate('/login');
        }
        // Focus first input
        inputRefs.current[0]?.focus();
    }, [tempUser, navigate]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (newCode.every(digit => digit !== '') && index === 5) {
            setTimeout(() => handleVerify(newCode.join('')), 100);
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5]?.focus();
            setTimeout(() => handleVerify(pastedData), 100);
        }
    };

    const handleVerify = async (codeString = code.join('')) => {
        if (codeString.length !== 6) {
            setError('Ingresa el código completo de 6 dígitos');
            return;
        }

        setIsVerifying(true);
        setError('');

        // Simulate API verification
        setTimeout(() => {
            // Mock verification - accept any 6-digit code for demo
            if (/^\d{6}$/.test(codeString)) {
                // Complete login
                login(tempUser, tempTokens);
                navigate('/dashboard');
            } else {
                setError('Código inválido. Intenta nuevamente.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
            setIsVerifying(false);
        }, 1500);
    };

    const handleResend = () => {
        setCode(['', '', '', '', '', '']);
        setError('');
        inputRefs.current[0]?.focus();
        // In real app, trigger sending a new code
        alert('Nuevo código generado en tu app de autenticación');
    };

    return (
        <div className="two-factor-verify">
            <motion.div
                className="verify-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card variant="elevated" className="verify-card">
                    <div className="verify-header">
                        <div className="icon-shield">🔐</div>
                        <h1>Verificación de Dos Factores</h1>
                        <p className="verify-subtitle">
                            Ingresa el código de 6 dígitos de tu app de autenticación
                        </p>
                    </div>

                    <div className="code-inputs" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className={`code-digit ${error ? 'error' : ''}`}
                                disabled={isVerifying}
                            />
                        ))}
                    </div>

                    {error && (
                        <motion.div
                            className="error-message"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Demo hint */}
                    <div className="demo-hint">
                        💡 <strong>Demo:</strong> Usa cualquier código de 6 dígitos (ej: 123456)
                    </div>

                    <div className="verify-actions">
                        <Button
                            variant="ghost"
                            size="large"
                            onClick={handleResend}
                            fullWidth
                        >
                            No tengo mi app
                        </Button>
                        <Button
                            variant="primary"
                            size="large"
                            onClick={() => handleVerify()}
                            loading={isVerifying}
                            disabled={code.some(digit => digit === '')}
                            fullWidth
                        >
                            Verificar
                        </Button>
                    </div>

                    <button
                        className="back-to-login"
                        onClick={() => navigate('/login')}
                    >
                        ← Volver al inicio de sesión
                    </button>
                </Card>

                {/* Help Text */}
                <div className="help-text">
                    <p>
                        <strong>¿No ves el código?</strong><br />
                        Abre tu app de autenticación (Google Authenticator, Authy, etc.)
                        y busca la cuenta de RemesaLibre.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default TwoFactorVerify;
