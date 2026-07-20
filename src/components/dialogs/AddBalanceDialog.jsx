import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { playUiSound } from '../../utils/soundUtils';
import { walletAPI } from '../../utils/api';
import useNotificationStore from '../../store/notificationStore';
import './AddBalanceDialog.css';

const AddBalanceDialog = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: method, 2: amount, 3: card, 4: processing, 5: success
    const [method, setMethod] = useState(null);
    const [amount, setAmount] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('MXN'); // Default currency
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: '',
        saveCard: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { addNotification } = useNotificationStore();

    const presetAmounts = [500, 1000, 2000, 5000];

    const methods = [
        { id: 'card', icon: '💳', name: 'Tarjeta de Débito/Crédito', desc: 'Visa, Mastercard' },
        { id: 'spei', icon: '🏦', name: 'SPEI', desc: 'Transferencia bancaria' },
        { id: 'oxxo', icon: '🏪', name: 'OXXO', desc: 'Pago en efectivo' },
    ];

    const handleMethodSelect = (methodId) => {
        playUiSound('click');
        setMethod(methodId);
        setStep(2);
        setError('');
    };

    const handleAmountContinue = () => {
        if (parseFloat(amount) >= 100) {
            playUiSound('click');
            if (method === 'card') {
                setStep(3);
            } else {
                // For SPEI/OXXO, go directly to processing
                handlePayment();
            }
        }
    };

    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(' ').substring(0, 19) : cleaned;
    };

    const formatExpiry = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        return cleaned;
    };

    const handlePayment = async () => {
        setIsLoading(true);
        setStep(4);
        setError('');

        try {
            // Get last 4 digits of card
            const cardLast4 = method === 'card'
                ? cardData.number.replace(/\s/g, '').slice(-4)
                : null;

            const response = await walletAPI.addBalance({
                amount: parseFloat(amount),
                currency: selectedCurrency,
                paymentMethod: method,
                cardLast4,
                saveCard: cardData.saveCard && method === 'card'
            });

            if (response.data.success) {
                playUiSound('fireworks');
                setStep(5);

                // Send notification
                addNotification({
                    type: 'operation',
                    icon: '💰',
                    title: '¡Saldo agregado!',
                    message: `Se agregaron ${formatCurrency(parseFloat(amount), 'MXN')} a tu cuenta`,
                });
            } else {
                throw new Error(response.data.error || 'Error al procesar el pago');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError(err.response?.data?.error || err.message || 'Error al procesar el pago');
            setStep(3); // Go back to card form
            playUiSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setMethod(null);
        setAmount('');
        setCardData({ number: '', expiry: '', cvv: '', name: '', saveCard: true });
        onClose();
    };

    const handleSuccess = () => {
        if (onSuccess) onSuccess(parseFloat(amount));
        handleClose();
    };

    const isCardValid =
        cardData.number.replace(/\s/g, '').length >= 15 &&
        cardData.expiry.length === 5 &&
        cardData.cvv.length >= 3 &&
        cardData.name.length > 3;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="💰 Agregar Saldo"
            size="medium"
        >
            <div className="add-balance-dialog">
                {step === 1 && (
                    <div className="method-selection">
                        <p className="dialog-subtitle">Selecciona cómo deseas recargar tu cuenta</p>
                        <div className="methods-grid">
                            {methods.map((m) => (
                                <button
                                    key={m.id}
                                    className="method-card"
                                    onClick={() => handleMethodSelect(m.id)}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    <span className="method-icon">{m.icon}</span>
                                    <div className="method-info">
                                        <p className="method-name">{m.name}</p>
                                        <p className="method-desc">{m.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="amount-selection">
                        <button className="back-btn" onClick={() => setStep(1)}>
                            ← Cambiar método
                        </button>
                        <p className="dialog-subtitle">¿Cuánto deseas agregar?</p>

                        {/* Currency Selector */}
                        <div className="currency-selector-recharge">
                            <button
                                className={`currency-option ${selectedCurrency === 'MXN' ? 'active' : ''}`}
                                onClick={() => setSelectedCurrency('MXN')}
                            >
                                🇲🇽 Pesos (MXN)
                            </button>
                            <button
                                className={`currency-option ${selectedCurrency === 'USD' ? 'active' : ''}`}
                                onClick={() => setSelectedCurrency('USD')}
                            >
                                🇺🇸 Dólares (USD)
                            </button>
                        </div>

                        <div className="preset-amounts">
                            {presetAmounts.map((preset) => (
                                <button
                                    key={preset}
                                    className={`preset-btn ${amount === String(preset) ? 'active' : ''}`}
                                    onClick={() => {
                                        playUiSound('click');
                                        setAmount(String(preset));
                                    }}
                                >
                                    {formatCurrency(preset, selectedCurrency)}
                                </button>
                            ))}
                        </div>

                        <Input
                            type="number"
                            label="O ingresa otro monto"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Mínimo $100 ${selectedCurrency}`}
                        />

                        {parseFloat(amount) > 0 && parseFloat(amount) < 100 && (
                            <p className="error-msg">El monto mínimo es $100 MXN</p>
                        )}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleAmountContinue}
                            disabled={parseFloat(amount) < 100}
                        >
                            Continuar con {formatCurrency(parseFloat(amount) || 0, 'MXN')}
                        </Button>
                    </div>
                )}

                {step === 3 && (
                    <div className="card-form">
                        <button className="back-btn" onClick={() => setStep(2)}>
                            ← Cambiar monto
                        </button>
                        <p className="dialog-subtitle">Ingresa los datos de tu tarjeta</p>

                        <div className="card-preview">
                            <div className="card-visual">
                                <div className="card-chip">💳</div>
                                <p className="card-number-preview">
                                    {cardData.number || '•••• •••• •••• ••••'}
                                </p>
                                <div className="card-bottom">
                                    <span>{cardData.name || 'NOMBRE DEL TITULAR'}</span>
                                    <span>{cardData.expiry || 'MM/YY'}</span>
                                </div>
                            </div>
                        </div>

                        <Input
                            label="Número de tarjeta"
                            value={cardData.number}
                            onChange={(e) => setCardData({
                                ...cardData,
                                number: formatCardNumber(e.target.value)
                            })}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                        />

                        <div className="card-row">
                            <Input
                                label="Vencimiento"
                                value={cardData.expiry}
                                onChange={(e) => setCardData({
                                    ...cardData,
                                    expiry: formatExpiry(e.target.value)
                                })}
                                placeholder="MM/YY"
                                maxLength={5}
                            />
                            <Input
                                label="CVV"
                                type="password"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({
                                    ...cardData,
                                    cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                                })}
                                placeholder="•••"
                                maxLength={4}
                            />
                        </div>

                        <Input
                            label="Nombre del titular"
                            value={cardData.name}
                            onChange={(e) => setCardData({
                                ...cardData,
                                name: e.target.value.toUpperCase()
                            })}
                            placeholder="Como aparece en la tarjeta"
                        />

                        <label className="save-card-checkbox">
                            <input
                                type="checkbox"
                                checked={cardData.saveCard}
                                onChange={(e) => setCardData({
                                    ...cardData,
                                    saveCard: e.target.checked
                                })}
                            />
                            <span>Guardar tarjeta para futuros pagos</span>
                        </label>

                        <div className="secure-badge">
                            🔒 Pago seguro con encriptación SSL
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handlePayment}
                            disabled={!isCardValid}
                        >
                            Pagar {formatCurrency(parseFloat(amount), 'MXN')}
                        </Button>
                    </div>
                )}

                {step === 4 && (
                    <div className="processing-screen">
                        <div className="processing-spinner"></div>
                        <h3>Procesando pago...</h3>
                        <p>Por favor espera mientras verificamos tu transacción</p>
                    </div>
                )}

                {step === 5 && (
                    <div className="success-screen">
                        <div className="success-icon">✅</div>
                        <h3>¡Saldo agregado exitosamente!</h3>
                        <p className="success-amount">
                            +{formatCurrency(parseFloat(amount), 'MXN')}
                        </p>
                        <p className="success-msg">
                            Tu saldo está disponible para enviar
                        </p>
                        <Button variant="primary" fullWidth onClick={handleSuccess}>
                            Continuar
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddBalanceDialog;
