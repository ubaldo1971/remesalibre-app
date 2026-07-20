import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../../store/authStore';
import { qrAPI } from '../../utils/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import './ReceiveMoneyDialog.css';

const ReceiveMoneyDialog = ({ isOpen, onClose }) => {
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
        if (qrData?.payload) {
            navigator.clipboard.writeText(qrData.payload);
            alert('Código copiado al portapapeles');
        }
    };

    const handleShare = async () => {
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
        setShowQR(false);
        setQrData(null);
        setAmount('');
        setDescription('');
        setTimeLeft(0);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="📥 Recibir Dinero" size="medium">
            <div className="receive-money-dialog">
                {!showQR ? (
                    <div className="receive-setup">
                        <p className="receive-description">
                            Genera un código QR para que otros puedan enviarte dinero
                        </p>

                        {/* User Info Preview */}
                        <div className="user-info-preview">
                            <div className="user-avatar">
                                {(user?.firstName || 'U')[0].toUpperCase()}
                            </div>
                            <div className="user-details">
                                <p className="user-name-display">
                                    {user?.firstName || 'Usuario'} {user?.lastName || ''}
                                </p>
                                <p className="user-phone-display">
                                    {user?.phone || user?.phoneNumber || ''}
                                </p>
                            </div>
                        </div>

                        {/* Amount (Optional) */}
                        <div className="amount-section">
                            <label className="section-label">Monto a solicitar (opcional)</label>
                            <div className="currency-selector">
                                <button
                                    className={`currency-btn ${currency === 'MXN' ? 'active' : ''}`}
                                    onClick={() => setCurrency('MXN')}
                                >
                                    MXN
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
                                <p className="amount-preview">
                                    Solicitando: {formatCurrencyWhole(parseInt(amount) || 0, currency)}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="description-section">
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
                        >
                            Generar Código QR
                        </Button>
                    </div>
                ) : (
                    <div className="qr-display">
                        <p className="qr-title">Tu Código QR</p>

                        {/* Expiration countdown */}
                        {timeLeft > 0 ? (
                            <p className="qr-expiry">
                                ⏱️ Expira en: <strong>{formatTime(timeLeft)}</strong>
                            </p>
                        ) : (
                            <p className="qr-expired">⚠️ Código expirado - genera uno nuevo</p>
                        )}

                        {/* QR Code */}
                        <div className="qr-code-container">
                            <QRCodeSVG
                                id="qr-code-svg"
                                value={qrData?.payload || ''}
                                size={280}
                                level="H"
                                includeMargin={true}
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                        </div>

                        {/* Request Details */}
                        <div className="request-details">
                            <div className="detail-row">
                                <span className="detail-label">Destinatario:</span>
                                <span className="detail-value">
                                    {user?.firstName || 'Usuario'} {user?.lastName || ''}
                                </span>
                            </div>
                            {qrData?.amount && (
                                <div className="detail-row">
                                    <span className="detail-label">Monto:</span>
                                    <span className="detail-value amount-highlight">
                                        {formatCurrencyWhole(qrData.amount, 'MXN')}
                                    </span>
                                </div>
                            )}
                            {qrData?.description && (
                                <div className="detail-row">
                                    <span className="detail-label">Concepto:</span>
                                    <span className="detail-value">{qrData.description}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="qr-actions">
                            <Button variant="secondary" onClick={handleCopyPayload} fullWidth>
                                📋 Copiar Código
                            </Button>
                            <Button variant="secondary" onClick={handleDownloadQR} fullWidth>
                                📥 Descargar QR
                            </Button>
                            <Button variant="secondary" onClick={handleShare} fullWidth>
                                📤 Compartir
                            </Button>
                            <Button variant="ghost" onClick={handleReset} fullWidth>
                                Generar Nuevo
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ReceiveMoneyDialog;

