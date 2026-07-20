import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { playUiSound } from '../../utils/soundUtils';
import './DonationPopup.css';

/**
 * DonationPopup - Shows before confirming a remittance
 * Allows users to optionally donate to the active campaign
 */
const DonationPopup = ({ isOpen, onClose, onConfirm, transferAmount, isDirect = false }) => {
    const [donationConfig, setDonationConfig] = useState(null);
    const [selectedAmount, setSelectedAmount] = useState(null);
    const [showCustom, setShowCustom] = useState(false);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [step, setStep] = useState(1); // 1: Select Amount, 2: Receipt Question, 3: Receipt Form
    const [taxInfo, setTaxInfo] = useState({
        wantsReceipt: false,
        name: '',
        country: 'Mexico',
        rfc: ''
    });

    // Close handler based on mode
    const handleCancel = () => {
        if (isDirect) {
            onClose();
        } else {
            handleSkip();
        }
    };

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDirect, onClose]);

    // Fetch donation config on mount
    useEffect(() => {
        if (isOpen) {
            playUiSound('swish');
            fetchDonationConfig();
            // Reset tax info when opening
            setTaxInfo({
                wantsReceipt: false,
                name: '',
                country: 'Mexico',
                rfc: ''
            });
            setProcessing(false);

            // If direct mode and amount is already set, jump to Step 2 (Receipt Selection)
            if (isDirect && transferAmount > 0) {
                setStep(2);
                setSelectedAmount(transferAmount);
            } else {
                setStep(1);
                setSelectedAmount(isDirect && transferAmount > 0 ? transferAmount : null);
            }
            setShowCustom(false);
        }
    }, [isOpen, isDirect, transferAmount]);

    // Exchange Rate
    const EXCHANGE_RATE = 20.00; // 1 USD = 20 MXN
    const mxnAmount = selectedAmount ? selectedAmount * EXCHANGE_RATE : 0;

    const fetchDonationConfig = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/donation/config');
            const data = await response.json();
            if (data.success) {
                setDonationConfig(data.donation);
            }
        } catch (error) {
            console.error('Error fetching donation config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountSelected = () => {
        setStep(2);
    };

    const handleReceiptChoice = (wants) => {
        playUiSound('click');
        if (wants) {
            setStep(3);
        } else {
            handleFinalConfirm({ wantsReceipt: false }, mxnAmount);
        }
    };

    const handleFinalConfirm = async (info = taxInfo, finalAmount = mxnAmount) => {
        setProcessing(true);
        try {
            playUiSound('donate');
            // Pass: MXN Amount, Tax Info, Original USD Amount
            await onConfirm(finalAmount, info, selectedAmount || 0);
        } catch (error) {
            console.error('Donation confirmation error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleSkip = () => {
        onConfirm(0, null, 0);
    };

    if (!isOpen) return null;

    // Validation for Step 3
    const isTaxFormValid = () => {
        if (!taxInfo.name || taxInfo.name.trim().length < 3) return false;
        if (taxInfo.country === 'Mexico' && (!taxInfo.rfc || taxInfo.rfc.length < 12)) return false;
        return true;
    };

    return (
        <AnimatePresence>
            <motion.div
                className="donation-popup-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="donation-popup"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                >
                    {loading ? (
                        <div className="donation-loading">
                            <div className="spinner"></div>
                            <p>Cargando...</p>
                        </div>
                    ) : step === 1 ? (
                        <>
                            <div className="donation-header">
                                <span className="donation-icon">❤️</span>
                                <h2>{isDirect ? 'Confirmar Donación' : '¡Haz la diferencia!'}</h2>
                                <p className="donation-campaign">
                                    {donationConfig.cause}
                                </p>
                            </div>

                            <div className="donation-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${Math.min((donationConfig.current / donationConfig.goal) * 100, 100)}%`
                                        }}
                                    />
                                </div>
                                <div className="progress-text">
                                    <span>${donationConfig.current.toLocaleString()} MXN</span>
                                    <span>Meta: ${donationConfig.goal.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="donation-message">
                                {isDirect
                                    ? 'Selecciona el monto que deseas donar directamente a la causa:'
                                    : `¿Te gustaría agregar una pequeña donación a tu envío de <strong>$${transferAmount}</strong>?`}
                            </p>
                            <p className="tax-deductible-legend">
                                ⚖️ Donativo deducible de impuestos. Se emite comprobante fiscal.
                            </p>

                            <div className="donation-amounts">
                                {donationConfig.amounts.map((amount) => (
                                    <button
                                        key={amount}
                                        className={`amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                                        onClick={() => {
                                            playUiSound('click');
                                            setSelectedAmount(amount);
                                            setShowCustom(false);
                                        }}
                                    >
                                        ${amount} USD
                                    </button>
                                ))}
                                <button
                                    className={`amount-btn ${showCustom ? 'selected' : ''}`}
                                    onClick={() => {
                                        playUiSound('click');
                                        setShowCustom(true);
                                        setSelectedAmount(null);
                                    }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    Otro
                                </button>
                            </div>

                            {showCustom && (
                                <div className="custom-amount-input">
                                    <input
                                        type="number"
                                        placeholder="Monto en USD (Máx 9,999)"
                                        value={selectedAmount || ''}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (val > 9999) return;
                                            setSelectedAmount(val || 0);
                                        }}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="donation-total">
                                {selectedAmount ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            Monto: ${selectedAmount} USD &times; ${EXCHANGE_RATE.toFixed(2)} MXN
                                        </p>
                                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-teal)' }}>
                                            Total a descontar: ${mxnAmount.toLocaleString()} MXN
                                        </p>
                                        {!isDirect && (
                                            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                (Se sumará al envío)
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p>Selecciona un monto para donar</p>
                                )}
                            </div>

                            <div className="donation-choice">
                                <button
                                    className={`choice-btn choice-donate ${selectedAmount ? 'active' : ''}`}
                                    onClick={() => {
                                        playUiSound('click');
                                        handleAmountSelected();
                                    }}
                                    onMouseEnter={() => playUiSound('hover')}
                                    disabled={!selectedAmount || processing}
                                >
                                    <span className="choice-emoji">😊</span>
                                    <span className="choice-text">
                                        {selectedAmount
                                            ? `¡Sí, donar $${selectedAmount}!`
                                            : 'Ingresa un monto'}
                                    </span>
                                </button>

                                <button
                                    className="choice-btn choice-skip"
                                    onClick={handleCancel}
                                    onMouseEnter={() => playUiSound('hover')}
                                    disabled={processing}
                                >
                                    <span className="choice-emoji">😢</span>
                                    <span className="choice-text">{isDirect ? 'No donar' : 'No gracias'}</span>
                                </button>
                            </div>

                            <p className="donation-footer">
                                💚 100% va directamente a la causa
                            </p>
                        </>
                    ) : step === 2 ? (
                        <div className="receipt-step">
                            <div className="receipt-header">
                                <span className="receipt-icon">📜</span>
                                <h2>¿Necesitas recibo fiscal?</h2>
                                <p className="tax-deductible-legend-large">Donativo deducible de impuestos. Se emite comprobante fiscal.</p>
                                <p>Podemos emitir un recibo deducible (CFDI) por tu donación de <strong>${selectedAmount} USD</strong>.</p>
                            </div>

                            <div className="receipt-options">
                                <button
                                    className="choice-btn choice-receipt"
                                    onClick={() => handleReceiptChoice(true)}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    <span className="choice-emoji">📝</span>
                                    <span className="choice-text">Sí, solicitar recibo</span>
                                </button>
                                <button
                                    className="choice-btn choice-no-receipt"
                                    onClick={() => handleReceiptChoice(false)}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    <span className="choice-emoji">🚀</span>
                                    <span className="choice-text">No, continuar sin recibo</span>
                                </button>
                            </div>

                            <div className="receipt-footer">
                                <button
                                    className="back-link"
                                    onClick={() => {
                                        playUiSound('click');
                                        setStep(1);
                                    }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    Atrás
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="tax-form-step">
                            <div className="form-header">
                                <h2>Datos de Facturación</h2>
                                <p>Ingresa los datos para tu comprobante fiscal.</p>
                            </div>

                            <div className="tax-form">
                                <div className="form-group">
                                    <label>Nombre / Razón Social</label>
                                    <input
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        value={taxInfo.name}
                                        onChange={(e) => setTaxInfo({ ...taxInfo, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>País</label>
                                    <select
                                        value={taxInfo.country}
                                        onChange={(e) => setTaxInfo({ ...taxInfo, country: e.target.value })}
                                    >
                                        <option value="Mexico">México</option>
                                        <option value="USA">Estados Unidos</option>
                                        <option value="Canada">Canadá</option>
                                        <option value="Other">Otro</option>
                                    </select>
                                </div>

                                {taxInfo.country === 'Mexico' && (
                                    <div className="form-group">
                                        <label>RFC</label>
                                        <input
                                            type="text"
                                            placeholder="XXXX000000XXX"
                                            value={taxInfo.rfc}
                                            onChange={(e) => setTaxInfo({ ...taxInfo, rfc: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                )}

                                {taxInfo.country !== 'Mexico' && (
                                    <p className="tax-hint">Se utilizará un RFC genérico para extranjeros.</p>
                                )}
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={() => handleFinalConfirm({ ...taxInfo, wantsReceipt: true })}
                                    disabled={!isTaxFormValid() || processing}
                                >
                                    Finalizar y Donar
                                </Button>
                                <button
                                    className="back-link"
                                    onClick={() => {
                                        playUiSound('click');
                                        setStep(2);
                                    }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    Atrás
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DonationPopup;
