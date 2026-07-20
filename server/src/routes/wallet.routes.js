import express from 'express';
import { db } from '../services/db.service.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const walletRouter = express.Router();

// Apply authentication to all wallet routes
walletRouter.use(authenticate);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance for authenticated user
 * @access  Private (requires JWT)
 */
walletRouter.get('/balance', (req, res) => {
    try {
        // Get user ID from authenticated JWT token
        const userId = req.user.id;
        const wallet = db.getWalletByUserId(userId);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        res.json({
            success: true,
            mxn: wallet.balance_mxn,
            usd: wallet.balance_usd,
            peso: wallet.balance_mxn // Legacy support
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transaction history for authenticated user
 * @access  Private (requires JWT)
 */
walletRouter.get('/transactions', (req, res) => {
    try {
        // Get user ID from authenticated JWT token
        const userId = req.user.id;

        // Filter transactions where user is sender or receiver
        const userTransactions = db.transactions.filter(t =>
            t.sender_id === userId || t.receiver_id === userId
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json({
            success: true,
            transactions: userTransactions.map(t => ({
                id: t.id,
                type: t.sender_id === userId ? 'send' : 'receive',
                description: t.description,
                amount: t.amount_original,
                currency_original: t.currency_original, // Add currency info
                createdAt: t.created_at,
                status: t.status
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/wallet/add-balance
 * @desc    Add balance to wallet (card payment, SPEI, OXXO)
 * @access  Private (requires JWT)
 */
walletRouter.post('/add-balance', (req, res) => {
    try {
        const userId = req.user.id;
        const { amount, currency = 'MXN', paymentMethod, cardLast4, saveCard } = req.body;

        // Validate amount
        if (!amount || amount < 100) {
            return res.status(400).json({
                success: false,
                error: 'Monto mínimo: $100 MXN'
            });
        }

        // Get current wallet
        const wallet = db.getWalletByUserId(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: 'Wallet not found'
            });
        }

        // Update balance based on currency
        if (currency === 'MXN') {
            wallet.balance_mxn = (parseFloat(wallet.balance_mxn) || 0) + parseFloat(amount);
        } else {
            wallet.balance_usd = (parseFloat(wallet.balance_usd) || 0) + parseFloat(amount);
        }

        // Save updated wallet
        db.updateWallet(userId, wallet);

        // Log transaction
        const transaction = {
            id: `txn-topup-${Date.now()}`,
            type: 'topup',
            sender_id: 'SYSTEM',
            receiver_id: userId,
            amount_original: amount,
            currency_original: currency,
            description: `Recarga de saldo via ${paymentMethod}${cardLast4 ? ` (*${cardLast4})` : ''}`,
            status: 'completed',
            created_at: new Date().toISOString()
        };
        db.transactions.push(transaction);

        // Save card if requested (simplified - in production use encryption)
        if (saveCard && cardLast4) {
            const userCards = db.savedCards || {};
            if (!userCards[userId]) userCards[userId] = [];

            // Check if card already saved
            const exists = userCards[userId].some(c => c.last4 === cardLast4);
            if (!exists) {
                userCards[userId].push({
                    id: `card-${Date.now()}`,
                    last4: cardLast4,
                    brand: cardLast4.startsWith('4') ? 'Visa' : 'Mastercard',
                    savedAt: new Date().toISOString()
                });
                db.savedCards = userCards;
            }
        }

        // Save to persistent storage
        db.saveToFile();

        console.log(`[WALLET] User ${userId} added ${amount} ${currency} via ${paymentMethod}`);

        res.json({
            success: true,
            message: 'Saldo agregado exitosamente',
            newBalance: {
                mxn: wallet.balance_mxn,
                usd: wallet.balance_usd
            },
            transactionId: transaction.id
        });

    } catch (error) {
        console.error('[WALLET] Add balance error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   GET /api/wallet/saved-cards
 * @desc    Get user's saved payment cards
 * @access  Private (requires JWT)
 */
walletRouter.get('/saved-cards', (req, res) => {
    try {
        const userId = req.user.id;
        const userCards = db.savedCards?.[userId] || [];

        res.json({
            success: true,
            cards: userCards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default walletRouter;


