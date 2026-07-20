import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../store/authStore';
import { qrAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import { playUiSound } from '../../utils/soundUtils';
import './ReceiveMoney.css';

const ReceiveMoney = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('MXN');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // QR State
    const [qrData, setQrData] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    // Countdown timer for QR expiration
    useEffect(() => {
        if (!qrData || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [qrData, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGenerateQR = async () => {
        playUiSound('click');
        setLoading(true);
        setError('');

        try {
            const response = await qrAPI.generate({
                amount_mxn: amount ? parseFloat(amount) : null,
                description: description || 'Transferencia QR',
                ttl_seconds: 300 // 5 minutes
            });

            if (response.data.success) {
                setQrData(response.data.qr_code);
                setTimeLeft(300); // 5 minutes
                setShowQR(true);
                playUiSound('success');
            } else {
                setError(response.data.message || 'Error al generar QR');
            }
        } catch (err) {
            console.error('Error generating QR:', err);
            setError(err.response?.data?.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = () => {
        playUiSound('click');
        const canvas = document.getElementById('qr-code-svg');
        if (!canvas) return;

        const svgData = new XMLSerializer().serializeToString(canvas);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `remesa-qr-${new Date().getTime()}.svg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
    };

    const handleCopyPayload = () => {
        playUiSound('click');
        if (qrData?.payload) {
            navigator.clipboard.writeText(qrData.payload);
            // Replace with a proper toast optionally
            alert('Código copiado al portapapeles');
        }
    };

    const handleShare = async () => {
        playUiSound('click');
        if (navigator.share && qrData) {
            try {
                await navigator.share({
                    title: 'Mi código QR de Remesa',
                    text: `Escanea o pega este código para enviarme dinero:\n\n${qrData.payload}`,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            handleCopyPayload();
        }
    };

    const handleReset = () => {
        playUiSound('click');
        setShowQR(false);
        setQrData(null);
        setAmount('');
        setDescription('');
        setTimeLeft(0);
    };

    return (
        <div className="receive-money-page">
            <header className="page-header">
                <button
                    className="back-btn"
                    onClick={() => {
                        playUiSound('click');
                        showQR ? handleReset() : navigate('/dashboard');
                    }}
                >
                    ← Volver
                </button>
                <h1>Recibir Dinero</h1>
            </header>

            <AnimatePresence mode="wait">
                {!showQR ? (
                    <motion.div
                        key="receive-setup"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="form-container"
                    >
                        <Card variant="glass" className="receive-card">
                            <p className="receive-description">
                                Genera un código QR para que otros puedan enviarte dinero fácilmente.
                            </p>

                            <div className="user-profile-preview">
                                <div className="user-avatar-large">
                                    {(user?.firstName || 'U')[0].toUpperCase()}
                                </div>
                                <div className="user-details-preview">
                                    <h3>{user?.firstName || 'Usuario'} {user?.lastName || ''}</h3>
                                    <p>{user?.phone || user?.phoneNumber || ''}</p>
                                </div>
                            </div>

                            <div className="form-group amount-section">
                                <label className="input-label">Monto a solicitar (opcional)</label>
                                <div className="currency-selector">
                                    <button
                                        className={`currency-btn ${currency === 'MXN' ? 'active' : ''}`}
                                        onClick={() => setCurrency('MXN')}
                                    >
                                        🇲🇽 MXN
                                    </button>
                                </div>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Ingresa el monto"
                                    min="0"
                                    step="1"
                                />
                                {amount && (
                                    <p className="amount-preview-text">
                                        Solicitando: {formatCurrencyWhole(parseInt(amount) || 0, currency)}
                                    </p>
                                )}
                            </div>

                            <div className="form-group description-section">
                                <Input
                                    label="Descripción (opcional)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ej: Pago de cena"
                                />
                            </div>

                            {error && <p className="error-text">{error}</p>}

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleGenerateQR}
                                loading={loading}
                                className="generate-btn mt-4"
                            >
                                Generar Código QR
                            </Button>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="qr-display"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="qr-container"
                    >
                        <Card variant="glass" className="qr-card">
                            <h2 className="qr-title">Tu Código QR</h2>

                            <div className="countdown-timer">
                                {timeLeft > 0 ? (
                                    <p className="qr-expiry">
                                        ⏱️ Expira en: <strong className={timeLeft < 60 ? 'text-urgent' : ''}>{formatTime(timeLeft)}</strong>
                                    </p>
                                ) : (
                                    <p className="qr-expired">⚠️ Código expirado - genera uno nuevo</p>
                                )}
                            </div>

                            <div className={`qr-code-wrapper ${timeLeft === 0 ? 'expired-blur' : ''}`}>
                                <QRCodeSVG
                                    id="qr-code-svg"
                                    value={qrData?.payload || ''}
                                    size={240}
                                    level="H"
                                    includeMargin={true}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    className="qr-svg"
                                />
                            </div>

                            <div className="request-details-box">
                                <div className="detail-row">
                                    <span>Destinatario:</span>
                                    <span>{user?.firstName || 'Usuario'}</span>
                                </div>
                                {qrData?.amount && (
                                    <div className="detail-row highlight-amount">
                                        <span>Monto:</span>
                                        <span>{formatCurrencyWhole(qrData.amount, 'MXN')}</span>
                                    </div>
                                )}
                                {qrData?.description && (
                                    <div className="detail-row">
                                        <span>Concepto:</span>
                                        <span>{qrData.description}</span>
                                    </div>
                                )}
                            </div>

                            <div className="qr-actions-grid">
                                <Button variant="secondary" onClick={handleCopyPayload} fullWidth>
                                    📋 Copiar
                                </Button>
                                <Button variant="secondary" onClick={handleDownloadQR} fullWidth>
                                    📥 Guardar
                                </Button>
                                <Button variant="primary" onClick={handleShare} fullWidth className="full-span-btn">
                                    📤 Compartir Código
                                </Button>
                                <Button variant="ghost" onClick={handleReset} fullWidth className="full-span-btn mt-2">
                                    Generar Nuevo QR
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReceiveMoney;
