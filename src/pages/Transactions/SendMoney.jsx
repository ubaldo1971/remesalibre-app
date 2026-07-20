import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DonationPopup from '../../components/dialogs/DonationPopup';
import { formatCurrencyWhole, formatCurrency } from '../../utils/formatters';
import { getDefaultCurrency } from '../../utils/locale';
import { transactionAPI } from '../../utils/api';
import confetti from 'canvas-confetti';
import { playUiSound } from '../../utils/soundUtils';
import './SendMoney.css';

const SendMoney = () => {
    const navigate = useNavigate();
    const { balance, fetchWallet } = useWalletStore();
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    // State
    const [currency, setCurrency] = useState('MXN');
    const [amount, setAmount] = useState('');
    const [recipient, setRecipient] = useState('');
    const [countryCode, setCountryCode] = useState('+52');
    const [note, setNote] = useState('');
    const [step, setStep] = useState(1); // 1: input, 2: donation, 3: success
    const [isLoading, setIsLoading] = useState(false);
    const [quote, setQuote] = useState(null);
    const [error, setError] = useState('');
    const [showDonationPopup, setShowDonationPopup] = useState(false);
    const [donationAmount, setDonationAmount] = useState(0); 
    const [donationAmountUSD, setDonationAmountUSD] = useState(0);
    const [taxInfo, setTaxInfo] = useState(null);

    useEffect(() => {
        try {
            setCurrency(getDefaultCurrency());
        } catch (e) {
            console.error('Error setting default currency:', e);
            setCurrency('MXN');
        }
    }, []);

    const EXCHANGE_RATE = 17.50;
    const safeBalance = balance || { mxn: 0, usd: 0 };

    let currentBalance = currency === 'MXN' ? (safeBalance.mxn || 0) : (safeBalance.usd || 0);
    const convertibleBalance = currency === 'MXN'
        ? (safeBalance.usd || 0) * EXCHANGE_RATE
        : (safeBalance.mxn || 0) / EXCHANGE_RATE;

    currentBalance += convertibleBalance;

    const amountNum = parseFloat(amount) || 0;
    const feeAmount = quote?.fee || 0;
    const donationNum = parseFloat(donationAmount) || 0;
    const totalDebit = amountNum + feeAmount + donationNum;

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
            setError('Número inválido. Se requieren 10 dígitos.');
            return;
        }
        if (isValid) {
            playUiSound('click');
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
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
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
                alert(`❌ Error: ${response.data.error || 'No se pudo procesar'}`);
            }
        } catch (err) {
            console.error('Transaction error:', err);
            alert(`❌ ${err.response?.data?.error || 'Error de conexión'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToDashboard = () => {
        playUiSound('click');
        navigate('/dashboard');
        if (step === 3) fetchWallet(); // refresh balance after success
    };

    return (
        <div className="send-money-page">
            <header className="page-header">
                <button
                    className="back-btn"
                    onClick={() => {
                        playUiSound('click');
                        step === 2 ? setStep(1) : navigate('/dashboard');
                    }}
                >
                    ← Volver
                </button>
                <h1>Enviar Dinero</h1>
            </header>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step-1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="form-container"
                    >
                        <Card variant="glass" className="action-card-main">
                            <div className="balance-display-modern">
                                <p className="balance-label">Saldo disponible</p>
                                <h2 className="balance-value-huge">
                                    {formatCurrencyWhole(currentBalance, currency)}
                                </h2>
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

                            <div className="form-group amount-group">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    label="Monto a enviar"
                                    placeholder="0.00"
                                    min="1"
                                />
                                {amountNum > currentBalance && (
                                    <p className="error-text">Saldo insuficiente</p>
                                )}
                            </div>

                            <div className="form-group phone-group">
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
                                {error && <p className="error-text">{error}</p>}
                            </div>

                            <div className="form-group">
                                <Input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    label="Nota (opcional)"
                                    placeholder="¿Para qué es este dinero?"
                                />
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                onClick={handleContinue}
                                disabled={!isValid}
                                className="continue-btn"
                            >
                                Continuar
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="form-container confirm-container"
                    >
                        <Card variant="glass" className="action-card-main">
                            <h2 className="confirm-title">Confirma tu envío</h2>
                            
                            <div className="confirm-summary-box">
                                <p className="detail-label">Destinatario</p>
                                <p className="detail-value dest-phone">{countryCode} {recipient}</p>
                                
                                <p className="detail-label mt-4">Tú envías</p>
                                <p className="detail-value-huge highlight-text">
                                    {formatCurrencyWhole(amountNum, currency)}
                                </p>
                            </div>

                            <div className="total-breakdown">
                                <div className="breakdown-row">
                                    <span>Envío ({currency})</span>
                                    <span>{formatCurrency(amountNum, currency)}</span>
                                </div>
                                <div className="breakdown-row">
                                    <span>Comisión (0.5%)</span>
                                    <span>{formatCurrency(feeAmount, currency)}</span>
                                </div>
                                {donationAmount > 0 && (
                                    <div className="breakdown-row highlight-row">
                                        <span>❤️ Donativo (${donationAmountUSD} USD)</span>
                                        <span>{formatCurrency(donationAmount, 'MXN')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="grand-total">
                                <p>Total a debitar</p>
                                <h3>{formatCurrency(grandTotalMXN, 'MXN')}</h3>
                            </div>

                            <div className="action-buttons-grid">
                                <Button variant="secondary" onClick={() => setStep(1)} disabled={isLoading}>
                                    Volver
                                </Button>
                                <Button variant="primary" onClick={handleConfirm} loading={isLoading} className="confirm-send-btn">
                                    Enviar Ahora
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step-3"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="success-container"
                    >
                        <Card variant="glass" className="success-card">
                            <div className="success-icon-large">✅</div>
                            <h2 className="success-heading">¡Envío Exitoso!</h2>
                            <p>Has enviado <strong>{formatCurrency(amountNum, currency)}</strong> a {countryCode} {recipient}.</p>
                            
                            {donationAmount > 0 && (
                                <div className="success-donation-msg">
                                    Gracias por tu donativo de ${donationAmountUSD} USD. ❤️
                                </div>
                            )}

                            <Button variant="primary" fullWidth onClick={handleBackToDashboard} className="mt-6">
                                Volver al Inicio
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <DonationPopup
                isOpen={showDonationPopup}
                onClose={() => setShowDonationPopup(false)}
                onConfirm={handleDonationConfirm}
                transferAmount={amountNum}
            />
        </div>
    );
};

export default SendMoney;
