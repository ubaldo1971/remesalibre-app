import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { formatCurrencyWhole } from '../../utils/formatters';
import { useWalletStore } from '../../store/walletStore';
import { playUiSound } from '../../utils/soundUtils';
import './ServicePayments.css';

const servicesOptions = [
    { id: 'cfe', name: 'CFE', category: 'Agua y Luz', icon: '💡', color: '#00f2ff' },
    { id: 'agua', name: 'Servicios de Agua', category: 'Agua y Luz', icon: '💧', color: '#0bb8a8' },
    { id: 'predial', name: 'Predial', category: 'Impuestos', icon: '🏛️', color: '#9b59b6' },
    { id: 'telcel', name: 'Telcel', category: 'Telefonía', icon: '📱', color: '#3498db' },
    { id: 'att', name: 'AT&T', category: 'Telefonía', icon: '📶', color: '#2980b9' },
    { id: 'izzi', name: 'Izzi / Totalplay', category: 'Internet', icon: '🌐', color: '#e74c3c' },
];

const categories = [...new Set(servicesOptions.map(s => s.category))];

const ServicePayments = () => {
    const navigate = useNavigate();
    const { balance, fetchWallet } = useWalletStore();
    const [selectedService, setSelectedService] = useState(null);
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const amountNum = parseFloat(amount) || 0;
    const isValid = reference.length > 5 && amountNum > 0 && amountNum <= (balance.mxn || 0);

    const handleConfirm = () => {
        if (!isValid) return;
        playUiSound('click');
        setIsProcessing(true);

        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setSuccess(true);
            playUiSound('success');
            // update local balance ideally, but wait until we connect to a real store function
            fetchWallet();
        }, 1500);
    };

    const resetFlow = () => {
        setSuccess(false);
        setSelectedService(null);
        setReference('');
        setAmount('');
    };

    if (success) {
        return (
            <div className="service-payments-page success-state">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="success-card"
                >
                    <div className="success-icon">✅</div>
                    <h2>¡Pago Exitoso!</h2>
                    <p>Has pagado <strong>{formatCurrencyWhole(amountNum, 'MXN')}</strong> a {selectedService?.name}.</p>
                    <div className="receipt-details">
                        <p><span>Referencia:</span> {reference}</p>
                        <p><span>Fecha:</span> {new Date().toLocaleDateString()}</p>
                        <p><span>Folio:</span> {Math.floor(Math.random() * 1000000000)}</p>
                    </div>
                    <Button variant="primary" fullWidth onClick={() => navigate('/dashboard')}>
                        Volver al Inicio
                    </Button>
                    <Button variant="secondary" fullWidth onClick={resetFlow} style={{ marginTop: '1rem' }}>
                        Pagar otro servicio
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="service-payments-page">
            <header className="page-header">
                <button
                    className="back-btn"
                    onClick={() => {
                        playUiSound('click');
                        selectedService ? setSelectedService(null) : navigate('/dashboard');
                    }}
                >
                    ← Volver
                </button>
                <h1>Pago de Servicios</h1>
            </header>

            <AnimatePresence mode="wait">
                {!selectedService ? (
                    <motion.div
                        key="service-list"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="service-selection"
                    >
                        <p className="subtitle">Selecciona el servicio que deseas pagar</p>
                        
                        {categories.map(category => (
                            <div key={category} className="category-section">
                                <h3>{category}</h3>
                                <div className="services-grid">
                                    {servicesOptions.filter(s => s.category === category).map(service => (
                                        <Card
                                            key={service.id}
                                            variant="glass"
                                            hoverable
                                            className="service-card"
                                            onClick={() => {
                                                playUiSound('click');
                                                setSelectedService(service);
                                            }}
                                        >
                                            <div className="service-icon-large" style={{ color: service.color, backgroundColor: `${service.color}15` }}>
                                                {service.icon}
                                            </div>
                                            <p>{service.name}</p>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="payment-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="payment-form-container"
                    >
                        <Card variant="glass" className="payment-card">
                            <div className="selected-service-header">
                                <div className="service-icon-large" style={{ color: selectedService.color, backgroundColor: `${selectedService.color}15` }}>
                                    {selectedService.icon}
                                </div>
                                <h2>{selectedService.name}</h2>
                            </div>

                            <div className="form-group">
                                <Input
                                    label="Número de Referencia / Contrato"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="Ej. 0123456789"
                                    type="text"
                                />
                            </div>

                            <div className="form-group">
                                <Input
                                    label="Monto a Pagar (MXN)"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    type="number"
                                />
                                <div className="balance-indicator">
                                    Saldo disponible: {formatCurrencyWhole(balance.mxn || 0, 'MXN')}
                                    {amountNum > (balance.mxn || 0) && (
                                        <span className="error-text"> Saldo insuficiente</span>
                                    )}
                                </div>
                            </div>

                            <div className="action-container">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleConfirm}
                                    disabled={!isValid || isProcessing}
                                    className="pay-btn"
                                >
                                    {isProcessing ? 'Procesando...' : `Pagar ${formatCurrencyWhole(amountNum, 'MXN')}`}
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ServicePayments;
