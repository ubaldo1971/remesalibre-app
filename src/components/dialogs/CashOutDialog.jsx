import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import { useWalletStore } from '../../store/walletStore';
import { cashoutAPI } from '../../utils/api';
import './CashOutDialog.css';

const CashOutDialog = ({ isOpen, onClose }) => {
    const { balance, fetchWallet } = useWalletStore();
    const [step, setStep] = useState('form'); // 'form', 'processing', 'success'
    const [method, setMethod] = useState('bank_spei'); // bank_spei, oxxo
    const [amount, setAmount] = useState('');
    const [bankName, setBankName] = useState('');
    const [clabe, setClabe] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const amountNum = parseInt(amount) || 0;
    const isValid = amountNum > 0 && amountNum <= balance.mxn;
    const isSpeiValid = method !== 'bank_spei' || (bankName && clabe.length === 18);

    const handleConfirm = async () => {
        if (!isValid || !isSpeiValid) return;

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
                // Refresh wallet to show new balance
                fetchWallet();
            } else {
                setError(response.data.message || 'Error procesando retiro');
                setStep('form');
            }
        } catch (err) {
            console.error('Cashout error:', err);
            setError(err.response?.data?.message || 'Error de conexión');
            setStep('form');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStep('form');
        setAmount('');
        setBankName('');
        setClabe('');
        setPin('');
        setError('');
        setResult(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="💵 Retirar Dinero" size="medium">
            <div className="cashout-dialog">

                {/* Form Step */}
                {step === 'form' && (
                    <>
                        {/* Method Selection */}
                        <div className="method-section">
                            <label className="section-label">Método de retiro</label>
                            <div className="method-selector">
                                <button
                                    className={`method-btn ${method === 'bank_spei' ? 'active' : ''}`}
                                    onClick={() => setMethod('bank_spei')}
                                >
                                    🏦 SPEI
                                </button>
                                <button
                                    className={`method-btn ${method === 'oxxo' ? 'active' : ''}`}
                                    onClick={() => setMethod('oxxo')}
                                >
                                    🏪 OXXO
                                </button>
                            </div>
                        </div>

                        {/* Amount */}
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            label={`Monto a retirar (Disponible: ${formatCurrencyWhole(balance.mxn, 'MXN')})`}
                            placeholder="0"
                            min="1"
                            step="1"
                        />

                        {/* SPEI Details */}
                        {method === 'bank_spei' && (
                            <>
                                <Input
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    label="Banco"
                                    placeholder="Nombre del banco"
                                />
                                <Input
                                    value={clabe}
                                    onChange={(e) => setClabe(e.target.value)}
                                    label="CLABE"
                                    placeholder="18 dígitos"
                                    maxLength={18}
                                />
                            </>
                        )}

                        {/* OXXO Info */}
                        {method === 'oxxo' && (
                            <div className="info-box">
                                <p>📋 Recibirás un código para retirar en cualquier OXXO</p>
                                <p className="info-note">Máximo $8,000 MXN por retiro</p>
                            </div>
                        )}

                        {/* PIN */}
                        <Input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            label="PIN de seguridad"
                            placeholder="••••••"
                            maxLength={6}
                        />

                        {error && <p className="error-text">{error}</p>}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleConfirm}
                            disabled={!isValid || !isSpeiValid || !pin}
                            loading={loading}
                        >
                            Confirmar Retiro
                        </Button>
                    </>
                )}

                {/* Processing Step */}
                {step === 'processing' && (
                    <div className="processing-step">
                        <div className="spinner"></div>
                        <p>Procesando tu retiro...</p>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && result && (
                    <div className="success-step">
                        <div className="success-icon">✅</div>
                        <h3>¡Retiro Procesado!</h3>

                        <div className="result-details">
                            <div className="detail-row">
                                <span>Monto:</span>
                                <strong>{formatCurrencyWhole(result.request?.amount_mxn || amountNum, 'MXN')}</strong>
                            </div>
                            <div className="detail-row">
                                <span>Método:</span>
                                <strong>{method === 'bank_spei' ? 'SPEI' : 'OXXO'}</strong>
                            </div>
                            {result.request?.reference_code && (
                                <div className="reference-box">
                                    <p className="reference-label">Código de referencia:</p>
                                    <p className="reference-code">{result.request.reference_code}</p>
                                    <p className="reference-note">Presenta este código en cualquier OXXO</p>
                                </div>
                            )}
                            <div className="detail-row">
                                <span>Nuevo saldo:</span>
                                <strong>{formatCurrencyWhole(result.new_balance_mxn || 0, 'MXN')}</strong>
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

export default CashOutDialog;

