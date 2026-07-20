import { db } from '../../services/db.service.js';

/**
 * Admin Service
 * 
 * Manages system-wide configuration and monitoring.
 * 1. System Configuration (Fees, Limits, Exchange Rates)
 * 2. Dashboard Metrics (Volume, Users, Revenue)
 * 3. User Management
 */
class AdminService {

    /**
     * Get current system configuration
     */
    getConfig() {
        return db.getSystemConfig();
    }

    /**
     * Update system configuration
     * @param {Object} updates - Config fields to update
     */
    updateConfig(updates) {
        // Validate critical fields
        if (updates.commission_rate && (updates.commission_rate < 0 || updates.commission_rate > 1)) {
            throw new Error('Commission rate must be between 0 and 1');
        }

        if (updates.exchange_rate_usd_mxn && updates.exchange_rate_usd_mxn <= 0) {
            throw new Error('Exchange rate must be positive');
        }

        return db.updateSystemConfig(updates);
    }

    /**
     * Get system statistics
     * @param {Object} filters - Date range filters
     */
    getStats(filters = {}) {
        const { from, to } = filters;
        const fromDate = from ? new Date(from) : new Date(0);
        const toDate = to ? new Date(to) : new Date();

        // 1. Transaction Volume
        const transactions = db.transactions.filter(tx => {
            const date = new Date(tx.created_at);
            return date >= fromDate && date <= toDate && tx.status === 'completed';
        });

        const totalVolumeUSD = transactions.reduce((sum, tx) => {
            return sum + (tx.currency_original === 'USD' ? tx.amount_original : 0);
        }, 0);

        const totalTransactions = transactions.length;

        // 2. Revenue (Fees)
        const totalRevenueUSD = transactions.reduce((sum, tx) => sum + (tx.commission || 0), 0);

        // 3. User Growth
        const users = db.users.filter(u => {
            const date = new Date(u.created_at);
            return date >= fromDate && date <= toDate;
        });

        // 4. System Balance (Liquidity)
        // In a real system, this would query the blockchain/bank balances
        const systemWallet = db.getWalletByUserId('system');

        return {
            period: { from: fromDate, to: toDate },
            volume: {
                total_usd: totalVolumeUSD,
                count: totalTransactions
            },
            revenue: {
                total_usd: totalRevenueUSD,
                system_balance_usd: systemWallet ? systemWallet.balance_usd : 0,
                system_balance_mxn: systemWallet ? systemWallet.balance_mxn : 0
            },
            users: {
                new_users: users.length,
                total_users: db.users.length
            }
        };
    }

    /**
     * Get security logs
     */
    getSecurityLogs(limit = 50) {
        return db.securityLogs
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    }
}

export const adminService = new AdminService();
