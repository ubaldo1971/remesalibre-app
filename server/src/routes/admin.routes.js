import express from 'express';
import { db } from '../services/db.service.js';
import { exchangeRateService } from '../services/exchangeRate.service.js';

export const adminRouter = express.Router();

// ==================== AUTH ====================
adminRouter.post('/login', (req, res) => {
    res.json({
        success: true,
        token: 'admin_token',
        user: { username: 'admin', role: 'admin' },
    });
});

// ==================== DASHBOARD STATS ====================
adminRouter.get('/dashboard', async (req, res) => {
    try {
        const users = db.getAllUsers();
        const transactions = db.transactions || [];
        const cashouts = db.cashoutRequests || [];
        const wallets = db.wallets || [];

        // Get real exchange rate
        const exchangeRate = await exchangeRateService.getUSDMXN();

        // Calculate total volume
        const totalVolumeMXN = transactions.reduce((sum, tx) => sum + (tx.amount_mxn || 0), 0);
        const totalVolumeUSD = transactions.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);

        // Calculate total liquidity (sum of all wallet balances)
        const liquidityMXN = wallets.reduce((sum, w) => sum + (w.balance_mxn || 0), 0);
        const liquidityUSD = wallets.reduce((sum, w) => sum + (w.balance_usd || 0), 0);

        // Count transactions by status
        const completedTx = transactions.filter(tx => tx.status === 'completed').length;
        const pendingTx = transactions.filter(tx => tx.status === 'pending').length;

        // Cashout stats
        const totalCashouts = cashouts.length;
        const cashoutVolume = cashouts.reduce((sum, c) => sum + (c.amount_mxn || 0), 0);

        res.json({
            success: true,
            stats: {
                // Users
                totalUsers: users.length,
                activeUsers: users.filter(u => u.status === 'active').length,

                // Transactions
                totalTransactions: transactions.length,
                completedTransactions: completedTx,
                pendingTransactions: pendingTx,

                // Volume
                totalVolumeMXN,
                totalVolumeUSD,

                // Liquidity
                liquidityMXN,
                liquidityUSD,

                // Cashouts
                totalCashouts,
                cashoutVolume,

                // Exchange Rate (REAL from API)
                commissionRate: db.systemConfig.commission_rate,
                spread: db.systemConfig.spread,
                exchangeRate,

                // Donation Stats
                totalDonationsUSDC: db.systemConfig.adminConfig.totalDonationsUSDC || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== ADMIN CONFIG ====================
adminRouter.get('/config', (req, res) => {
    try {
        const config = db.getAdminConfig();
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

adminRouter.put('/config', (req, res) => {
    try {
        const updates = req.body;
        const config = db.updateAdminConfig(updates);
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== DONATION CAMPAIGN ====================
adminRouter.get('/donation', (req, res) => {
    try {
        const config = db.getAdminConfig();
        res.json({
            success: true,
            enabled: config.donationEnabled,
            cause: config.donationCause,
            goal: config.donationGoal,
            current: config.donationCurrent,
            amounts: config.donationAmounts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

adminRouter.put('/donation', (req, res) => {
    try {
        const { enabled, cause, goal, current, amounts } = req.body;
        const updates = {};
        if (enabled !== undefined) updates.donationEnabled = enabled;
        if (cause !== undefined) updates.donationCause = cause;
        if (goal !== undefined) updates.donationGoal = goal;
        if (current !== undefined) updates.donationCurrent = current;
        if (amounts !== undefined) updates.donationAmounts = amounts;

        const config = db.updateAdminConfig(updates);
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== COMMUNITY VOTING ====================
adminRouter.get('/voting', (req, res) => {
    try {
        const config = db.getAdminConfig();
        res.json({
            success: true,
            enabled: config.votingEnabled,
            question: config.votingQuestion,
            optionA: config.votingOptionA,
            optionB: config.votingOptionB
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

adminRouter.put('/voting', (req, res) => {
    try {
        const { enabled, question, optionA, optionB } = req.body;
        const updates = {};
        if (enabled !== undefined) updates.votingEnabled = enabled;
        if (question !== undefined) updates.votingQuestion = question;
        if (optionA !== undefined) updates.votingOptionA = optionA;
        if (optionB !== undefined) updates.votingOptionB = optionB;

        const config = db.updateAdminConfig(updates);
        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== USER MANAGEMENT ====================
adminRouter.get('/users', (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

adminRouter.put('/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = db.updateUser(id, updates);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== LEGACY ENDPOINTS ====================
adminRouter.get('/transactions', (req, res) => {
    res.json([]);
});

adminRouter.post('/fees', (req, res) => {
    const { commission } = req.body;
    if (commission !== undefined) {
        db.updateAdminConfig({ commission });
    }
    res.json({ success: true, message: 'Fees updated' });
});

adminRouter.post('/spread', (req, res) => {
    const { spread } = req.body;
    if (spread !== undefined) {
        db.updateAdminConfig({ spread });
    }
    res.json({ success: true, message: 'Spread updated' });
});

adminRouter.get('/liquidity', (req, res) => {
    res.json({ mxn: 1000000, usd: 50000, peso: 1000000 });
});

adminRouter.get('/fraud-alerts', (req, res) => {
    res.json([]);
});

adminRouter.get('/analytics', (req, res) => {
    res.json({ daily: [], weekly: [], monthly: [] });
});

export default adminRouter;

