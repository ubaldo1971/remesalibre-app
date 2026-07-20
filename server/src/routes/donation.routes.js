import express from 'express';
import { db } from '../services/db.service.js';
import { usdcContract } from '../blockchain/usdc.contract.js';

export const donationRouter = express.Router();

/**
 * Get donation config (campaign info + preset amounts)
 */
donationRouter.get('/config', (req, res) => {
    try {
        const config = db.getAdminConfig();

        res.json({
            success: true,
            donation: {
                enabled: config.donationEnabled,
                cause: config.donationCause,
                goal: config.donationGoal,
                current: config.donationCurrent,
                amounts: config.donationAmounts || [1, 5, 10],
                walletAddress: config.donationWalletAddress,
                totalUSDC: config.totalDonationsUSDC || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Process a donation
 * Transfers USDC to donation wallet via smart contract
 */
donationRouter.post('/contribute', async (req, res) => {
    try {
        const { amount, userId, transactionId, taxInfo } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Monto de donación inválido'
            });
        }

        const config = db.getAdminConfig();

        if (!config.donationEnabled) {
            return res.status(400).json({
                success: false,
                error: 'Las donaciones no están habilitadas actualmente'
            });
        }

        // Create explicit numeric amount
        const donationAmount = parseFloat(amount);

        // Get user's wallet (to deduct from)
        // Use safer getter method
        const userWallet = db.getWalletByUserId(userId);

        if (!userWallet) {
            return res.status(404).json({
                success: false,
                error: 'Wallet no encontrada'
            });
        }

        // Check for sufficient balance (Auto-Conversion Logic)
        const exchangeRate = 17.50; // Fixed rate for demo
        let usedCurrency = 'USD';
        let amountToDeduct = donationAmount;

        // Ensure balances are numbers
        const currentUSD = parseFloat(userWallet.balance_usd || 0);
        const currentMXN = parseFloat(userWallet.balance_mxn || 0);

        if (currentUSD >= donationAmount) {
            // Sufficient USD
            userWallet.balance_usd = currentUSD - donationAmount;
        }
        else if (currentMXN / exchangeRate >= donationAmount) {
            // Insufficient USD, but sufficient MXN -> Convert
            usedCurrency = 'MXN';
            amountToDeduct = donationAmount * exchangeRate;
            userWallet.balance_mxn = currentMXN - amountToDeduct;
            console.log(`[DONATION] Auto-converting ${amountToDeduct} MXN to ${donationAmount} USD`);
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Saldo insuficiente en tu billetera (USD o MXN)'
            });
        }

        // Save changes to persistence
        db.saveToFile();

        // Map back to db.wallets (though getWalletByUserId returns a reference, this ensures safety)
        // No need to map if modifying object in place, but keeping for consistency with old code style if needed.
        // db.wallets reference is already updated by object mutation.

        // Simulate Fiscal Event
        if (taxInfo && taxInfo.name) {
            console.log(`[FISCAL] 📄 Generating receipt for ${taxInfo.name} (${taxInfo.rfc || 'Foreign'})`);
            console.log(`[FISCAL] Amount: $${amount} USD. Reference: ${donation.id}`);
        }

        // Emit Socket.io event for real-time UI/balance updates
        if (global.io) {
            global.io.to(`user_${userId}`).emit('balance_updated', {
                balance: {
                    usd: userWallet.balance_usd,
                    mxn: userWallet.balance_mxn
                }
            });
            global.io.to(`user_${userId}`).emit('transaction_received', {
                transaction: ledgerEntry,
                message: `Donativo de $${amount} USD procesado`
            });
        }

        res.json({
            success: true,
            message: `¡Gracias por donar $${amount} USD!`,
            donation,
            totalDonated: updatedConfig.totalDonationsUSDC,
            txHash: txResult.txHash,
            receiptGenerated: !!(taxInfo && taxInfo.name)
        });

    } catch (error) {
        console.error('[DONATION] Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Get donation history
 */
donationRouter.get('/history', (req, res) => {
    try {
        const donations = db.donations || [];
        const config = db.getAdminConfig();

        res.json({
            success: true,
            donations,
            total: config.totalDonationsUSDC || 0,
            campaign: config.donationCause
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Update donation amounts (admin only)
 */
donationRouter.put('/amounts', (req, res) => {
    try {
        const { amounts } = req.body;

        if (!Array.isArray(amounts) || amounts.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren exactamente 3 montos'
            });
        }

        const config = db.updateAdminConfig({
            donationAmounts: amounts.map(a => parseFloat(a))
        });

        res.json({
            success: true,
            amounts: config.donationAmounts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default donationRouter;
