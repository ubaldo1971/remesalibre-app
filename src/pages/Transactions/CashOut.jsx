import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';
import { cashoutAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import { playUiSound } from '../../utils/soundUtils';
import './CashOut.css';

const CashOut = () => {
    const navigate = useNavigate();
    const { balance, fetchWallet } = useWalletStore();
    const [step, setStep] = useState('form'); // 'form', 'processing', 'success'
    const [method, setMethod] = useState('bank_spei'); // 'bank_spei', 'oxxo'
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [clabe, setClabe] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const amountNum = parseInt(amount) || 0;
    const isValid = amountNum > 0 && amountNum <= (balance.mxn || 0);
    const isSpeiValid = method !== 'bank_spei' || (bankName && clabe.length === 18);

    const handleConfirm = async () => {
        if (!isValid || !isSpeiValid || !pin) return;

        playUiSound('click');
        setLoading(true);
        setError('');
        setStep('processing');

        try {
            const requestData = {
                amount_mxn: amountNum,
                method,
                pin,
                destination: method === 'bank_spei' ? {
                    clabe,
                    bank_name: bankName
                } : undefined
            };

            const response = await cashoutAPI.request(requestData);

            if (response.data.success) {
                setResult(response.data);
                setStep('success');
                playUiSound('success');
                fetchWallet();
            } else {
                setError(response.data.message || 'Error procesando retiro');
                playUiSound('error');
                setStep('form');
            }
        } catch (err) {
            console.error('Cashout error:', err);
            setError(err.response?.data?.message || 'Error de conexión');
            playUiSound('error');
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        playUiSound('click');
        navigate('/dashboard');
    };

    return (
        <div className="cashout-page">
            <header className="page-header">
                <button
                    className="back-btn"
                    onClick={handleBack}
                    disabled={loading || step === 'processing'}
                >
                    ← Volver
                </button>
                <h1>Retirar Dinero</h1>
            </header>

            <AnimatePresence mode="wait">
                {step === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="form-container"
                    >
                        <Card variant="glass" className="cashout-card">
                            <div className="balance-display-modern">
                                <p className="balance-label">Saldo MXN Disponible</p>
                                <h2 className="balance-value-huge">
                                    {formatCurrencyWhole(balance.mxn || 0, 'MXN')}
                                </h2>
                            </div>

                            <div className="method-section">
                                <label className="input-label">Método de retiro</label>
                                <div className="method-selector">
                                    <button
                                        className={`method-btn ${method === 'bank_spei' ? 'active' : ''}`}
                                        onClick={() => { playUiSound('hover'); setMethod('bank_spei'); }}
                                    >
                                        🏦 Transferencia SPEI
                                    </button>
                                    <button
                                        className={`method-btn ${method === 'oxxo' ? 'active' : ''}`}
                                        onClick={() => { playUiSound('hover'); setMethod('oxxo'); }}
                                    >
                                        🏪 Retiro en OXXO
                                    </button>
                                </div>
                            </div>

                            <div className="form-group amount-group">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    label="Monto a retirar"
                                    placeholder="0"
                                    min="1"
                                    step="1"
                                />
                                {amountNum > (balance.mxn || 0) && (
                                    <p className="error-text">Saldo insuficiente</p>
                                )}
                            </div>

                            {method === 'bank_spei' && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="spei-details-group"
                                    >
                                        <div className="form-group">
                                            <Input
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                                label="Banco Destino"
                                                placeholder="Ej. BBVA, Santander, Banorte"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <Input
                                                value={clabe}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 18) setClabe(val);
                                                }}
                                                label="CLABE Interbancaria"
                                                placeholder="18 dígitos"
                                            />
                                            {clabe.length > 0 && clabe.length < 18 && (
                                                <p className="hint-text">Te faltan {18 - clabe.length} dígitos</p>
                                            )}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            {method === 'oxxo' && (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="info-box"
                                    >
                                        <div className="info-icon">📋</div>
                                        <div className="info-text">
                                            <p>Recibirás un código de referencia para retirar efectivo en cualquier sucursal OXXO.</p>
                                            <p className="info-note">Límite: $8,000 MXN por transacción.</p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            )}

                            <div className="form-group pin-group">
                                <Input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 6) setPin(val);
                                    }}
                                    label="PIN de Seguridad"
                                    placeholder="Ingresa tu PIN de 6 dígitos"
                                />
                            </div>

                            {error && <div className="error-box">{error}</div>}

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleConfirm}
                                disabled={!isValid || !isSpeiValid || pin.length < 4}
                                className="confirm-btn mt-4"
                            >
                                Confirmar Retiro
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {step === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="processing-container"
                    >
                        <Card variant="glass" className="processing-card">
                            <div className="loading-spinner-large"></div>
                            <h2>Procesando tu retiro...</h2>
                            <p>Esto puede tomar unos segundos</p>
                        </Card>
                    </motion.div>
                )}

                {step === 'success' && result && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="success-container"
                    >
                        <Card variant="glass" className="success-cashout-card">
                            <div className="success-icon-large">✅</div>
                            <h2 className="success-title">¡Retiro Exitoso!</h2>
                            
                            <p className="success-subtitle">
                                Tu solicitud de retiro ha sido procesada.
                            </p>

                            <div className="receipt-box">
                                <div className="detail-row">
                                    <span>Monto a retirar:</span>
                                    <span className="value-highlight">{formatCurrencyWhole(result.request?.amount_mxn || amountNum, 'MXN')}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Método de retiro:</span>
                                    <span>{method === 'bank_spei' ? 'Transferencia SPEI' : 'Retiro en OXXO'}</span>
                                </div>
                                
                                {method === 'oxxo' && result.request?.reference_code && (
                                    <div className="reference-code-box">
                                        <p className="ref-label">Código de Referencia OXXO</p>
                                        <h1 className="ref-code">{result.request.reference_code}</h1>
                                        <p className="ref-instructions">Presenta este código al cajero para recibir tu efectivo.</p>
                                    </div>
                                )}

                                {method === 'bank_spei' && (
                                    <>
                                        <div className="detail-row">
                                            <span>Banco Destino:</span>
                                            <span>{bankName}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span>CLABE:</span>
                                            <span>{clabe}</span>
                                        </div>
                                        <p className="spei-note mt-2">Los fondos se reflejarán en tu cuenta interbancaria en breve.</p>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={() => { playUiSound('click'); window.location.reload(); }}
                                className="mt-4"
                            >
                                Finalizar y Volver
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CashOut;
