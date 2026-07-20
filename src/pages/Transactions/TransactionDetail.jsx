import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatCurrencyWhole, formatDate } from '../../utils/formatters';
import { playUiSound } from '../../utils/soundUtils';
import './TransactionDetail.css';

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { transactions, fetchWallet } = useWalletStore();
    const [transaction, setTransaction] = useState(null);

    useEffect(() => {
        if (transactions.length === 0) {
            fetchWallet();
        }
    }, [fetchWallet, transactions.length]);

    useEffect(() => {
        if (transactions.length > 0) {
            const found = transactions.find(t => t.id === id);
            setTransaction(found);
        }
    }, [id, transactions]);

    const handleBack = () => {
        playUiSound('click');
        navigate(-1); // Go back to previous page
    };

    if (!transaction) {
        return (
            <div className="transaction-detail-page loading">
                <div className="spinner"></div>
                <p>Cargando detalle...</p>
            </div>
        );
    }

    const { type, amount, status, date, description, currency, reference } = transaction;
    const isDeposit = type === 'deposit';

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'deposit': return '⬇️';
            case 'withdrawal': return '⬆️';
            case 'transfer': return '↔️';
            case 'payment': return '🧾';
            default: return '📄';
        }
    };

    return (
        <div className="transaction-detail-page">
            <header className="page-header">
                <button className="back-btn" onClick={handleBack}>
                    ← Volver
                </button>
                <h1>Detalle de Movimiento</h1>
            </header>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="detail-container"
            >
                <Card variant="glass" className="detail-card">
                    <div className="detail-header">
                        <div className="detail-icon">
                            {getTransactionIcon(type)}
                        </div>
                        <h2>{description}</h2>
                        <h1 className={`detail-amount ${isDeposit ? 'positive' : 'negative'}`}>
                            {isDeposit ? '+' : '-'}{formatCurrencyWhole(amount, currency || 'MXN')}
                        </h1>
                        <span className={`status-badge large ${status}`}>
                            {status === 'completed' ? 'Completado' : status === 'pending' ? 'Pendiente' : 'Fallido'}
                        </span>
                    </div>

                    <div className="detail-info-list">
                        <div className="info-row">
                            <span className="info-label">Fecha y Hora</span>
                            <span className="info-value">{formatDate(date)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ID de Transacción</span>
                            <span className="info-value mono">{id}</span>
                        </div>
                        {reference && (
                            <div className="info-row">
                                <span className="info-label">Referencia</span>
                                <span className="info-value mono">{reference}</span>
                            </div>
                        )}
                        <div className="info-row">
                            <span className="info-label">Tipo</span>
                            <span className="info-value capitalize">{type === 'deposit' ? 'Depósito' : type === 'withdrawal' ? 'Retiro' : 'Pago/Transferencia'}</span>
                        </div>
                    </div>

                    <div className="detail-actions">
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => {
                                playUiSound('click');
                                alert('Recibo descargado (simulación)');
                            }}
                            className="download-btn"
                        >
                            Descargar Recibo HTTP
                        </Button>
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => {
                                playUiSound('click');
                                alert('Soporte contactado (simulación)');
                            }}
                            className="support-btn"
                        >
                            Reportar un Probleme
                        </Button>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default TransactionDetail;
