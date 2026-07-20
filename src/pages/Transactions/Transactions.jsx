import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWalletStore } from '../../store/walletStore';
import Card from '../../components/ui/Card';
import { formatCurrencyWhole, formatDate } from '../../utils/formatters';
import { playUiSound } from '../../utils/soundUtils';
import './Transactions.css';

const Transactions = () => {
    const navigate = useNavigate();
    const { transactions, fetchWallet, loading } = useWalletStore();

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const handleBack = () => {
        playUiSound('click');
        navigate('/dashboard');
    };

    const handleTransactionClick = (tx) => {
        playUiSound('click');
        navigate(`/transaction/${tx.id}`);
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'deposit': return '⬇️';
            case 'withdrawal': return '⬆️';
            case 'transfer': return '↔️';
            case 'payment': return '🧾';
            default: return '📄';
        }
    };

    const getAmountColor = (type, amount) => {
        if (type === 'deposit') return 'var(--success, #2ecc71)';
        return 'var(--on-background, #dee3eb)';
    };

    const formatAmount = (type, amount, currency) => {
        const prefix = type === 'deposit' ? '+' : '-';
        return `${prefix}${formatCurrencyWhole(amount, currency || 'MXN')}`;
    };

    return (
        <div className="transactions-page">
            <header className="page-header sticky-header">
                <button className="back-btn" onClick={handleBack}>
                    ← Volver
                </button>
                <h1>Historial de Movimientos</h1>
            </header>

            <div className="transactions-container">
                <Card variant="glass" className="history-card">
                    {loading && transactions.length === 0 ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Cargando movimientos...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>Sin movimientos</h3>
                            <p>Tus transacciones aparecerán aquí.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <div className="full-transaction-list">
                                {transactions.map((tx, index) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="transaction-item"
                                        onClick={() => handleTransactionClick(tx)}
                                    >
                                        <div className="tx-icon">
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div className="tx-details">
                                            <h4>{tx.description}</h4>
                                            <p>{formatDate(tx.date)}</p>
                                        </div>
                                        <div className="tx-amount">
                                            <span style={{ color: getAmountColor(tx.type, tx.amount) }}>
                                                {formatAmount(tx.type, tx.amount, tx.currency)}
                                            </span>
                                            <small className={`status-badge ${tx.status}`}>
                                                {tx.status === 'completed' ? 'Completado' : tx.status === 'pending' ? 'Pendiente' : 'Fallido'}
                                            </small>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Transactions;
