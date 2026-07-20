import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import DonationPopup from './DonationPopup';
import { formatCurrencyWhole, formatCurrency } from '../../utils/formatters';
import { getDefaultCurrency } from '../../utils/locale';
import { transactionAPI } from '../../utils/api';
import confetti from 'canvas-confetti';
import { playUiSound } from '../../utils/soundUtils';
import './SendMoneyDialog.css';

const SendMoneyDialog = ({ isOpen, onClose, onRequireRecharge }) => {
    // Hooks
    const walletStore = useWalletStore();
    const { balance, fetchWallet } = walletStore || { balance: { mxn: 0, usd: 0 }, fetchWallet: () => { } };
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    // State
    const [currency, setCurrency] = useState('MXN'); // Default safe init
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [note, setNote] = useState('');
    const [step, setStep] = useState(1); // 1: input, 2: donation, 3: confirm
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState('');
    const [showDonationPopup, setShowDonationPopup] = useState(false);
    const [donationAmount, setDonationAmount] = useState(0); // In MXN
    const [donationAmountUSD, setDonationAmountUSD] = useState(0); // Original USD
    const [taxInfo, setTaxInfo] = useState(null);

    // Initialize currency safely
    useEffect(() => {
        try {
            setCurrency(getDefaultCurrency());
        } catch (e) {
            console.error('Error setting default currency:', e);
            setCurrency('MXN');
        }
    }, []);

    const EXCHANGE_RATE = 17.50;

    // Safety check for balance
    const safeBalance = balance || { mxn: 0, usd: 0 };

    // Calculate effective balance
    let currentBalance = currency === 'MXN' ? (safeBalance.mxn || 0) : (safeBalance.usd || 0);
    const convertibleBalance = currency === 'MXN'
        ? (safeBalance.usd || 0) * EXCHANGE_RATE
        : (safeBalance.mxn || 0) / EXCHANGE_RATE;

    currentBalance += convertibleBalance;

    const amountNum = parseFloat(amount) || 0;
    const feeAmount = quote?.fee || 0;
    const donationNum = parseFloat(donationAmount) || 0;
    const totalDebit = amountNum + feeAmount + donationNum;

    // Calculate Grand Total in MXN explicitly
    const grandTotalMXN = (() => {
        const val = currency === 'USD'
            ? ((amountNum + feeAmount) * EXCHANGE_RATE) + donationNum
            : (amountNum + feeAmount + donationNum);
        return isNaN(val) ? 0 : val;
    })();

    // Fetch quote
    useEffect(() => {
        const getQuote = async () => {
            if (amountNum > 0) {
                try {
                    const response = await transactionAPI.getQuote({ amount: amountNum, currency, type: 'send' });
                    if (response.data.success) {
                        setQuote(response.data.quote);
                        setError('');
                    }
                } catch (err) {
                    console.error('Error fetching quote:', err);
                }
            } else {
                setQuote(null);
            }
        };

        const timeoutId = setTimeout(getQuote, 500);
        return () => clearTimeout(timeoutId);
    }, [amountNum, currency]);

    const phoneRegex = /^\d{10}$/;
    const purePhone = recipient.replace(/\D/g, '');
    const isPhoneValid = phoneRegex.test(purePhone);
    const isValid = isPhoneValid && amountNum > 0 && amountNum <= currentBalance && !error;

    const handleContinue = () => {
        if (!isPhoneValid) {
            setError(`Número inválido. Se requieren 10 dígitos.`);
            return;
        }
        if (isValid) {
            setShowDonationPopup(true);
        }
    };

    const handleDonationConfirm = (donationMXN, info, donationUSD) => {
        setDonationAmount(donationMXN);
        setDonationAmountUSD(donationUSD);
        setTaxInfo(info);
        setShowDonationPopup(false);
        setStep(2);
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            const response = await transactionAPI.send({
                amount: amountNum,
                currency,
                recipient: `${countryCode}${purePhone}`,
                note,
                donationAmount,
                taxInfo
            });

            if (response.data.success) {
                playUiSound('fireworks');
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                setStep(3);

                setTimeout(() => {
                    addNotification({
                        type: 'operation',
                        icon: '💸',
                        title: '¡Transferencia Exitosa!',
                        message: `Enviaste ${formatCurrency(amountNum, currency)} a ${countryCode}${purePhone}`,
                    });

                    if (donationAmount > 0) {
                        setTimeout(() => {
                            addNotification({
                                type: 'reward',
                                icon: '❤️',
                                title: '¡Gracias por tu donación!',
                                message: `Tu donativo de $${donationAmount} USD ayuda a nuestra comunidad.`,
                            });
                        }, 4500);
                    }
                }, 1000);
            } else {
                if (response.data.error === 'Insufficient balance' && onRequireRecharge) {
                    onRequireRecharge();
                } else {
                    alert(`❌ Error: ${response.data.error || 'No se pudo procesar'}`);
                }
            }
        } catch (err) {
            console.error('Transaction error:', err);
            const errorMsg = err.response?.data?.error || 'Error de conexión';
            if (errorMsg === 'Insufficient balance' && onRequireRecharge) {
                onRequireRecharge();
            } else {
                alert(`❌ ${errorMsg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setAmount('');
        setRecipient('');
        setNote('');
        setQuote(null);
        setError('');
        setDonationAmount(0);
        setDonationAmountUSD(0);
        setTaxInfo(null);
        setShowDonationPopup(false);
        onClose();
        if (step === 3) {
            window.location.reload();
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="📤 Enviar Dinero" size="medium">
            <div className="send-money-dialog">
                {step === 1 ? (
                    <div className="send-form">
                        <div className="balance-display">
                            <p className="balance-label">Saldo disponible</p>
                            <p className="balance-value">
                                {formatCurrencyWhole(currentBalance, currency)}
                            </p>
                        </div>

                        <div className="currency-selector-section">
                            <label className="input-label">Moneda a enviar</label>
                            <div className="currency-selector">
                                <button
                                    className={`currency-btn ${currency === 'MXN' ? 'active' : ''}`}
                                    onClick={() => { playUiSound('click'); setCurrency('MXN'); }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    🇲🇽 MXN
                                </button>
                                <button
                                    className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
                                    onClick={() => { playUiSound('click'); setCurrency('USD'); }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    🇺🇸 USD
                                </button>
                            </div>
                        </div>

                        <div className="amount-input-section">
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                label="Monto a enviar"
                                placeholder="0.00"
                                min="1"
                            />

                            {quote && (
                                <div className="quote-preview">
                                    <div className="quote-row">
                                        <span>Comisión (0.5%):</span>
                                        <span>{formatCurrency(quote.fee, currency)}</span>
                                    </div>
                                    {currency === 'USD' && (
                                        <div className="quote-row">
                                            <span>Tipo de Cambio:</span>
                                            <span>${quote.exchangeRate} MXN/USD</span>
                                        </div>
                                    )}
                                    <div className="quote-row highlight">
                                        <span>Recibe:</span>
                                        <span className="receive-amount">
                                            {formatCurrency(quote.amountReceived, currency === 'USD' ? 'MXN' : currency)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {amountNum > currentBalance && (
                                <p className="error-message">Saldo insuficiente</p>
                            )}
                        </div>

                        <div className="phone-input-section">
                            <label className="input-label">Destinatario</label>
                            <div className="phone-input-container">
                                <div className="country-select-wrapper">
                                    <select
                                        className="country-code-select"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                    >
                                        <option value="+52">🇲🇽 +52</option>
                                        <option value="+1">🇺🇸 +1</option>
                                    </select>
                                </div>
                                <input
                                    type="tel"
                                    className="phone-input-field"
                                    value={recipient}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setRecipient(val);
                                    }}
                                    placeholder="10 dígitos"
                                />
                            </div>
                            <p className="phone-hint">Ingresa los 10 dígitos del celular.</p>
                            {error && <p className="error-message">{error}</p>}
                        </div>

                        <Input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            label="Nota (opcional)"
                            placeholder="¿Para qué es este pago?"
                        />

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleContinue}
                            disabled={!isValid}
                        >
                            Continuar
                        </Button>
                    </div>
                ) : step === 2 ? (
                    <div className="send-confirm">
                        <p className="confirm-title">Confirma los detalles</p>
                        <div className="confirm-details">
                            <div className="detail-card funding-source-card">
                                <p className="detail-label">Método de pago</p>
                                <div className="funding-source-item">
                                    <span className="source-icon">💳</span>
                                    <div className="source-info">
                                        <p className="source-name">Balance General (MXN)</p>
                                        <p className="source-balance">Disponible: {formatCurrency(safeBalance.mxn || 0, 'MXN')}</p>
                                    </div>
                                    <div className="radio-selected"></div>
                                </div>
                            </div>

                            <div className="detail-card">
                                <p className="detail-label">Destinatario</p>
                                <p className="detail-value">{recipient}</p>
                            </div>

                            <div className="detail-card highlight">
                                <p className="detail-label">Tú envías</p>
                                <p className="detail-value-large">
                                    {formatCurrencyWhole(amountNum, currency)}
                                </p>
                            </div>

                            <div className="detail-card total-debit-card">
                                <p className="detail-label">Resumen de cobro</p>
                                <div className="total-breakdown">
                                    <div className="breakdown-row">
                                        <span>Envío ({currency})</span>
                                        <span>{formatCurrency(amountNum, currency)}</span>
                                    </div>
                                    {currency === 'USD' && (
                                        <div className="breakdown-row sub-text">
                                            <span>Tipo de cambio</span>
                                            <span>${EXCHANGE_RATE.toFixed(2)} MXN/USD</span>
                                        </div>
                                    )}
                                    <div className="breakdown-row">
                                        <span>Comisión</span>
                                        <span>{formatCurrency(feeAmount, currency)}</span>
                                    </div>

                                    {donationAmount > 0 && (
                                        <div className="breakdown-row highlight-row">
                                            <span>❤️ Donación (${donationAmountUSD} USD)</span>
                                            <span>{formatCurrency(donationAmount, 'MXN')}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="final-total-section">
                                    <p className="detail-label">Total a debitar (MXN)</p>
                                    <p className="detail-value-total">
                                        {formatCurrency(grandTotalMXN, 'MXN')}
                                    </p>
                                    {currency === 'USD' && (
                                        <p style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                            *Conversión estimada de {formatCurrency(amountNum + feeAmount, 'USD')} USD
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="confirm-actions">
                            <Button variant="secondary" fullWidth onClick={handleBack} disabled={isLoading}>
                                Atrás
                            </Button>
                            <Button variant="primary" fullWidth onClick={handleConfirm} loading={isLoading}>
                                Pagar {formatCurrency(grandTotalMXN, 'MXN')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="success-screen">
                        <div className="success-animation">
                            <div className="checkmark-circle">
                                <div className="checkmark draw"></div>
                            </div>
                        </div>
                        <h2 className="success-title">¡Envío Exitoso!</h2>
                        <p className="success-message">Tu transferencia se ha procesado correctamente.</p>

                        <div className="success-details">
                            <div className="success-row">
                                <span>Destinatario:</span>
                                <span>{recipient}</span>
                            </div>
                            <div className="success-row">
                                <span>Total cobrado:</span>
                                <span>{formatCurrency(totalDebit, currency === 'USD' ? 'USD' : 'MXN')}</span>
                            </div>
                            {donationAmount > 0 && (
                                <div className="detail-row donation-msg">
                                    <div className="donation-row-main">
                                        <span>❤️ Donación:</span>
                                        <span>¡Gracias por donar ${donationAmount} USD!</span>
                                    </div>
                                    {taxInfo?.wantsReceipt && (
                                        <div className="receipt-sent-msg">
                                            📜 Recibo fiscal solicitado. Se enviará a tu número: <strong>{user?.phone || 'registrado'}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <Button variant="primary" fullWidth onClick={handleClose}>
                            Volver al Inicio
                        </Button>
                    </div>
                )}
            </div>

            <DonationPopup
                isOpen={showDonationPopup}
                onClose={() => setShowDonationPopup(false)}
                onConfirm={handleDonationConfirm}
                transferAmount={amountNum}
            />
        </Modal>
    );
};

export default SendMoneyDialog;
