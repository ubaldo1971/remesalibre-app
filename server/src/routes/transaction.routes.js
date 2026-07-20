import express from 'express';
import { transactionService } from '../services/transaction.service.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';

export const transactionRouter = express.Router();

/**
 * @route   POST /api/transactions/quote
 * @desc    Get a quote for a transaction (fees, exchange rate)
 * @access  Public (optional auth for personalized rates)
 */
transactionRouter.post('/quote', optionalAuth, async (req, res) => {
    try {
        const { amount, currency, type } = req.body;
        const quote = await transactionService.calculateQuote(amount, currency, type);
        res.json({ success: true, quote });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/transactions/send
 * @desc    Execute a money transfer
 * @access  Private (requires JWT)
 */
transactionRouter.post('/send', authenticate, async (req, res) => {
    try {
        console.log('[DEBUG] Incoming /send request:', req.body);
        const { amount, currency, recipient, note, donationAmount, taxInfo } = req.body;
        // Get sender ID from authenticated JWT token
        const senderId = req.user.id;
        console.log('[DEBUG] Sender ID:', senderId);

        const result = await transactionService.processTransfer({
            senderId,
            recipientPhone: recipient,
            amount,
            currency,
            note,
            donationAmount,
            taxInfo
        });
        res.json(result);
    } catch (error) {
        console.error('Transaction error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/transactions/generate-qr
 * @desc    Generate a QR code for receiving payment
 * @access  Private (requires JWT)
 */
transactionRouter.post('/generate-qr', authenticate, (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    res.json({
        success: true,
        qrCode: 'REF-' + Math.floor(10000 + Math.random() * 90000),
        userId,
        amount,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
    });
});

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details by ID
 * @access  Private (requires JWT)
 */
transactionRouter.get('/:id', authenticate, (req, res) => {
    // In production: verify user has access to this transaction
    res.json({
        success: true,
        id: req.params.id,
        amount: 500,
        status: 'completed',
        createdAt: new Date().toISOString(),
    });
});

export default transactionRouter;

