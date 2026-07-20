import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { formatCurrencyWhole } from '../../utils/formatters';
import './PayServicesDialog.css';

const PayServicesDialog = ({ isOpen, onClose }) => {
    const [service, setService] = useState('');
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');

    const services = [
        { id: 'cfe', name: 'CFE', icon: '💡' },
        { id: 'telmex', name: 'Telmex', icon: '📞' },
        { id: 'agua', name: 'Agua', icon: '💧' },
        { id: 'gas', name: 'Gas Natural', icon: '🔥' },
        { id: 'internet', name: 'Internet', icon: '🌐' },
        { id: 'cable', name: 'TV Cable', icon: '📺' }
    ];

    const selectedServiceData = services.find(s => s.id === service);
    const amountNum = parseInt(amount) || 0;
    const isValid = service && reference && amountNum > 0;

    const handleConfirm = () => {
        console.log('Paying service:', { service, reference, amount: amountNum });
        alert(`Pago procesado: ${formatCurrencyWhole(amountNum, 'MXN')} a ${selectedServiceData?.name}`);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🏪 Pagar Servicios" size="medium">
            <div className="pay-services-dialog">
                {/* Service Selection */}
                <div className="services-section">
                    <label className="section-label">Selecciona el servicio</label>
                    <div className="services-grid">
                        {services.map((s) => (
                            <button
                                key={s.id}
                                className={`service-btn ${service === s.id ? 'active' : ''}`}
                                onClick={() => setService(s.id)}
                            >
                                <span className="service-icon">{s.icon}</span>
                                <span className="service-name">{s.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reference Number */}
                {service && (
                    <>
                        <Input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            label="Número de servicio / Referencia"
                            placeholder={`Ej: ${service === 'cfe' ? '1234567890' : '0123456789'}`}
                        />

                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            label="Monto a pagar"
                            placeholder="0"
                            min="1"
                            step="1"
                        />

                        {amountNum > 0 && (
                            <div className="payment-preview">
                                <p className="preview-label">Total a pagar</p>
                                <p className="preview-amount">
                                    {formatCurrencyWhole(amountNum, 'MXN')}
                                </p>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleConfirm}
                            disabled={!isValid}
                        >
                            Pagar {selectedServiceData?.name}
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PayServicesDialog;
