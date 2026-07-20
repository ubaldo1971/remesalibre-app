/**
 * Transaction Service
 * Manages balance, transfers, and history.
 */
import { api } from './api';
import { authService } from './auth.service';

const TXN_KEY = 'remesa_txns';
const BALANCE_KEY = 'remesa_balance';

export const txnService = {

    getBalance: async () => {
        // In real app, fetching from API
        await new Promise(r => setTimeout(r, 600));
        const balance = localStorage.getItem(BALANCE_KEY);
        // Default balance for demo if new user
        if (!balance) {
            localStorage.setItem(BALANCE_KEY, '1250.50');
            return { data: 1250.50, error: null };
        }
        return { data: parseFloat(balance), error: null };
    },

    getHistory: async () => {
        const { data } = await api.get('txns');
        if (!data) return { data: [], error: null };
        return { data: data.sort((a, b) => b.date - a.date), error: null };
    },

    sendMoney: async (amount, recipient) => {
        // Check balance
        const currentBalance = parseFloat(localStorage.getItem(BALANCE_KEY) || '0');

        // Simulate Limit Error
        if (amount > 5000) {
            return {
                data: null,
                error: {
                    code: 'LIMIT_EXCEEDED',
                    title: 'Límite Excedido',
                    message: 'Por seguridad, no puedes enviar más de $5,000 USD en una sola transacción.'
                }
            };
        }

        if (currentBalance < amount) {
            return { data: null, error: 'Fondos insuficientes' };
        }

        // Create Transaction
        const txn = {
            id: `txn_${Date.now()}`,
            type: 'sent',
            amount: amount,
            recipient: recipient.name,
            status: 'completed',
            date: Date.now()
        };

        // Update Balance
        const newBalance = currentBalance - amount;
        localStorage.setItem(BALANCE_KEY, newBalance.toString());

        // Save Txn
        await api.post('txns/create', txn);

        return { data: { success: true, txn, newBalance }, error: null };
    },

    receiveMoney: async (amount, method) => {
        // Simulate external deposit
        await new Promise(r => setTimeout(r, 1000));

        const currentBalance = parseFloat(localStorage.getItem(BALANCE_KEY) || '0');
        const newBalance = currentBalance + parseFloat(amount);

        localStorage.setItem(BALANCE_KEY, newBalance.toString());

        const txn = {
            id: `txn_${Date.now()}`,
            type: 'received',
            amount: parseFloat(amount),
            sender: 'Transferencia Bancaria',
            method: method,
            status: 'completed',
            date: Date.now()
        };

        await api.post('txns/create', txn);

        return { data: { success: true, newBalance }, error: null };
    },

    getRates: async () => {
        // Mock Live Rate
        return { data: { usdToMxn: 19.42, lastUpdate: Date.now() }, error: null };
    }
};
