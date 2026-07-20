import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { qrAPI } from '../../utils/api';
import { useWalletStore } from '../../store/walletStore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import './ScanQRDialog.css';

const ScanQRDialog = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const { fetchWallet } = useWalletStore();

    // States
    const [step, setStep] = useState('input'); // 'input', 'confirm', 'pin', 'success'
    const [qrPayload, setQrPayload] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Validated QR data
    const [qrData, setQrData] = useState(null);

    // PIN
    const [pin, setPin] = useState('');

    // Transaction result
    const [result, setResult] = useState(null);

    const handleValidateQR = async () => {
        if (!qrPayload.trim()) {
            setError('Ingresa o pega el código QR');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await qrAPI.validate(qrPayload.trim());

            if (response.data.valid) {
                setQrData(response.data.request);
                setStep('confirm');
            } else {
                setError(response.data.message || 'Código QR inválido');
            }
        } catch (err) {
            console.error('Error validating QR:', err);
            setError(err.response?.data?.message || 'Error al validar QR');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = () => {
        setStep('pin');
    };

    const handlePayQR = async () => {
        if (pin.length < 4) {
            setError('Ingresa tu PIN');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await qrAPI.pay({
                qr_payload: qrPayload.trim(),
                amount_input: qrData.amount,
                pin
            });

            if (response.data.success) {
                setResult(response.data);
                setStep('success');
                // Refresh wallet balance
                fetchWallet();
            } else {
                setError(response.data.message || 'Error al procesar pago');
            }
        } catch (err) {
            console.error('Error paying QR:', err);
            setError(err.response?.data?.message || 'Error al procesar pago');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStep('input');
        setQrPayload('');
        setQrData(null);
        setPin('');
        setError('');
        setResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="📱 Pagar con QR" size="medium">
            <div className="scan-qr-dialog">

                {/* Step 1: Input QR Code */}
                {step === 'input' && (
                    <div className="qr-input-step">
                        <p className="step-description">
                            Pega el código QR que deseas pagar
                        </p>

                        <div className="qr-input-section">
                            <textarea
                                className="qr-textarea"
                                value={qrPayload}
                                onChange={(e) => setQrPayload(e.target.value)}
                                placeholder="Pega aquí el código QR (400020126360014MX...)"
                                rows={4}
                            />
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleValidateQR}
                            loading={loading}
                        >
                            Validar Código
                        </Button>

                        <p className="qr-hint">
                            💡 El destinatario puede compartir su código desde "Recibir Dinero"
                        </p>
                    </div>
                )}

                {/* Step 2: Confirm Payment */}
                {step === 'confirm' && qrData && (
                    <div className="qr-confirm-step">
                        <div className="payment-preview">
                            <div className="preview-header">
                                <span className="preview-icon">👤</span>
                                <h3>Confirmar Pago</h3>
                            </div>

                            <div className="preview-details">
                                <div className="detail-row">
                                    <span className="detail-label">Destinatario:</span>
                                    <span className="detail-value">{qrData.receiver_name}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Teléfono:</span>
                                    <span className="detail-value">{qrData.receiver_phone}</span>
                                </div>
                                {qrData.amount && (
                                    <div className="detail-row amount-row">
                                        <span className="detail-label">Monto:</span>
                                        <span className="detail-value amount-highlight">
                                            {formatCurrencyWhole(qrData.amount, 'MXN')}
                                        </span>
                                    </div>
                                )}
                                {qrData.description && (
                                    <div className="detail-row">
                                        <span className="detail-label">Concepto:</span>
                                        <span className="detail-value">{qrData.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="error-text">{error}</p>}

                        <div className="button-group">
                            <Button variant="ghost" onClick={handleReset}>
                                Cancelar
                            </Button>
                            <Button variant="primary" onClick={handleConfirmPayment}>
                                Continuar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Enter PIN */}
                {step === 'pin' && (
                    <div className="qr-pin-step">
                        <div className="pin-header">
                            <span className="pin-icon">🔐</span>
                            <h3>Ingresa tu PIN</h3>
                            <p>Para confirmar el pago de {formatCurrencyWhole(qrData?.amount || 0, 'MXN')}</p>
                        </div>

                        <Input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••••"
                            maxLength={6}
                            className="pin-input"
                        />

                        {error && <p className="error-text">{error}</p>}

                        <div className="button-group">
                            <Button variant="ghost" onClick={() => setStep('confirm')}>
                                Atrás
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handlePayQR}
                                loading={loading}
                            >
                                Pagar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Success */}
                {step === 'success' && result && (
                    <div className="qr-success-step">
                        <div className="success-animation">
                            <span className="success-icon">✅</span>
                        </div>

                        <h3>¡Pago Exitoso!</h3>

                        <div className="success-details">
                            <div className="detail-row">
                                <span className="detail-label">Enviaste:</span>
                                <span className="detail-value">
                                    ${result.amount_paid_usd?.toFixed(2)} USD
                                </span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Recibió:</span>
                                <span className="detail-value amount-highlight">
                                    {formatCurrencyWhole(result.amount_received_mxn || 0, 'MXN')}
                                </span>
                            </div>
                        </div>

                        <Button variant="primary" fullWidth onClick={handleClose}>
                            Cerrar
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ScanQRDialog;
