/**
 * Raite Service - Integration layer for Raite ecosystem
 * Handles driver registration, trip payments with split, and notifications
 */

import { db } from '../../services/db.service.js';
import { paymentEngineService } from '../paymentEngine/paymentEngine.service.js';
import { userDirectoryService } from '../userDirectory/userDirectory.service.js';

// Default split configuration (can be customized per cooperativa)
const DEFAULT_SPLIT = {
    conductor: 0.85,    // 85% to driver
    plataforma: 0.10,   // 10% to platform (Raite)
    cooperativa: 0.05   // 5% to cooperative
};

class RaiteService {

    /**
     * Register a new driver with RemesaLibre wallet
     * @param {Object} driverData - Driver information from Raite
     * @returns {Object} - Registration result with wallet info
     */
    async registerDriver(driverData) {
        const {
            phone_number,
            full_name,
            cooperativa_id,
            cooperativa_nombre,
            email,
            bank_account
        } = driverData;

        // Check if driver already exists
        const existingResult = userDirectoryService.findByPhone(phone_number);
        if (existingResult && existingResult.exists) {
            const existingUser = existingResult.user;
            if (!existingUser.is_pre_registered) {
                return {
                    success: true,
                    message: 'Conductor ya registrado en RemesaLibre',
                    user: existingUser,
                    wallet: db.getWalletByUserId(existingUser.id)
                };
            }
        }

        // Register new user
        const result = userDirectoryService.register({
            phone_number,
            full_name,
            email,
            cashout_preference: bank_account ? 'bank' : 'oxxo',
            bank_account,
            metadata: {
                source: 'raite',
                cooperativa_id,
                cooperativa_nombre,
                registered_at: new Date().toISOString()
            }
        });

        console.log(`[RAITE] Driver registered: ${full_name} (${phone_number}) - Coop: ${cooperativa_nombre}`);

        return {
            success: true,
            message: 'Conductor registrado exitosamente',
            user: result.user,
            wallet: db.getWalletByUserId(result.user.id)
        };
    }

    /**
     * Process a trip payment with automatic 3-way split
     * Now includes passenger wallet debit
     * @param {Object} tripData - Trip payment information
     * @returns {Object} - Payment result with split details
     */
    async processTripPayment(tripData) {
        const {
            trip_id,
            passenger_phone,
            driver_phone,
            cooperativa_phone, // Wallet de la cooperativa
            amount_mxn,
            distance_km,
            duration_min,
            origin,
            destination,
            split_config = DEFAULT_SPLIT
        } = tripData;

        // Validate split configuration
        const splitTotal = split_config.conductor + split_config.plataforma + split_config.cooperativa;
        if (Math.abs(splitTotal - 1.0) > 0.001) {
            throw new Error('La configuración de split debe sumar 100%');
        }

        const timestamp = new Date().toISOString();
        const transactions = [];

        // === STEP 1: DEBIT PASSENGER WALLET ===
        if (passenger_phone) {
            const passengerResult = userDirectoryService.findByPhone(passenger_phone);
            if (!passengerResult || !passengerResult.exists) {
                throw new Error('Pasajero no encontrado en RemesaLibre. Debe registrarse primero.');
            }
            const passengerUser = passengerResult.user;

            const passengerWallet = db.getWalletByUserId(passengerUser.id);
            if (!passengerWallet) {
                throw new Error('Wallet del pasajero no encontrada');
            }

            const currentBalance = parseFloat(passengerWallet.balance_mxn) || 0;
            if (currentBalance < amount_mxn) {
                throw new Error(`Saldo insuficiente. Tienes $${currentBalance.toFixed(2)} MXN, necesitas $${amount_mxn} MXN`);
            }

            // Debit passenger
            passengerWallet.balance_mxn = currentBalance - amount_mxn;
            db.updateWallet(passengerUser.id, passengerWallet);

            // Record passenger debit transaction
            const passengerTx = {
                id: `raite-trip-${trip_id}-passenger`,
                type: 'trip_debit',
                sender_id: passengerUser.id,
                sender_phone: passenger_phone,
                receiver_id: 'RAITE_PLATFORM',
                amount_original: amount_mxn,
                currency_original: 'MXN',
                description: `Pago viaje #${trip_id}: ${origin} → ${destination}`,
                status: 'completed',
                created_at: timestamp,
                metadata: {
                    trip_id,
                    passenger_balance_before: currentBalance,
                    passenger_balance_after: passengerWallet.balance_mxn
                }
            };
            transactions.push(passengerTx);

            console.log(`[RAITE] Passenger ${passenger_phone} debited $${amount_mxn} MXN. New balance: $${passengerWallet.balance_mxn}`);
        }

        // === STEP 2: CALCULATE SPLIT ===
        // Calculate split amounts
        const driverAmount = Math.round(amount_mxn * split_config.conductor * 100) / 100;
        const platformAmount = Math.round(amount_mxn * split_config.plataforma * 100) / 100;
        const coopAmount = Math.round(amount_mxn * split_config.cooperativa * 100) / 100;

        // === STEP 3: DISTRIBUTE PAYMENTS ===
        // 1. Driver payment
        const driverTx = {
            id: `raite-trip-${trip_id}-driver`,
            type: 'trip_payment',
            sender_id: 'RAITE_PLATFORM',
            receiver_phone: driver_phone,
            amount_original: driverAmount,
            currency_original: 'MXN',
            description: `Viaje #${trip_id}: ${origin} → ${destination}`,
            status: 'completed',
            created_at: timestamp,
            metadata: {
                trip_id,
                split_type: 'conductor',
                split_percent: split_config.conductor * 100
            }
        };
        transactions.push(driverTx);

        // 2. Platform fee
        const platformTx = {
            id: `raite-trip-${trip_id}-platform`,
            type: 'platform_fee',
            sender_id: 'RAITE_TRIP',
            receiver_id: 'RAITE_PLATFORM',
            amount_original: platformAmount,
            currency_original: 'MXN',
            description: `Comisión plataforma - Viaje #${trip_id}`,
            status: 'completed',
            created_at: timestamp,
            metadata: {
                trip_id,
                split_type: 'plataforma',
                split_percent: split_config.plataforma * 100
            }
        };
        transactions.push(platformTx);

        // 3. Cooperative fee
        const coopTx = {
            id: `raite-trip-${trip_id}-coop`,
            type: 'cooperative_fee',
            sender_id: 'RAITE_TRIP',
            receiver_phone: cooperativa_phone,
            amount_original: coopAmount,
            currency_original: 'MXN',
            description: `Cuota cooperativa - Viaje #${trip_id}`,
            status: 'completed',
            created_at: timestamp,
            metadata: {
                trip_id,
                split_type: 'cooperativa',
                split_percent: split_config.cooperativa * 100
            }
        };
        transactions.push(coopTx);

        // Update driver wallet
        const driverUser = userDirectoryService.findByPhone(driver_phone);
        if (driverUser) {
            const wallet = db.getWalletByUserId(driverUser.id);
            if (wallet) {
                wallet.balance_mxn = (parseFloat(wallet.balance_mxn) || 0) + driverAmount;
                db.updateWallet(driverUser.id, wallet);
            }
        }

        // Update cooperative wallet
        const coopUser = userDirectoryService.findByPhone(cooperativa_phone);
        if (coopUser) {
            const wallet = db.getWalletByUserId(coopUser.id);
            if (wallet) {
                wallet.balance_mxn = (parseFloat(wallet.balance_mxn) || 0) + coopAmount;
                db.updateWallet(coopUser.id, wallet);
            }
        }

        // Store transactions
        transactions.forEach(tx => db.transactions.push(tx));
        db.saveToFile();

        console.log(`[RAITE] Trip #${trip_id} processed: $${amount_mxn} MXN (Driver: $${driverAmount}, Platform: $${platformAmount}, Coop: $${coopAmount})`);

        return {
            success: true,
            trip_id,
            total_amount: amount_mxn,
            split: {
                conductor: { amount: driverAmount, percent: split_config.conductor * 100 },
                plataforma: { amount: platformAmount, percent: split_config.plataforma * 100 },
                cooperativa: { amount: coopAmount, percent: split_config.cooperativa * 100 }
            },
            transactions: transactions.map(tx => tx.id),
            processed_at: timestamp
        };
    }

    /**
     * Get driver wallet balance
     * @param {string} phone - Driver phone number
     * @returns {Object} - Wallet balance
     */
    getDriverBalance(phone) {
        const user = userDirectoryService.findByPhone(phone);
        if (!user) {
            throw new Error('Conductor no encontrado en RemesaLibre');
        }

        const wallet = db.getWalletByUserId(user.id);
        if (!wallet) {
            throw new Error('Wallet no encontrada');
        }

        return {
            success: true,
            driver: {
                id: user.id,
                name: user.full_name,
                phone: user.phone_number
            },
            balance: {
                mxn: wallet.balance_mxn || 0,
                usd: wallet.balance_usd || 0
            }
        };
    }

    /**
     * Get driver transaction history
     * @param {string} phone - Driver phone number
     * @param {Object} options - Filter options
     * @returns {Array} - Transaction history
     */
    getDriverTransactions(phone, options = {}) {
        const user = userDirectoryService.findByPhone(phone);
        if (!user) {
            throw new Error('Conductor no encontrado');
        }

        let transactions = db.transactions.filter(tx =>
            tx.receiver_phone === phone ||
            tx.sender_phone === phone ||
            tx.receiver_id === user.id ||
            tx.sender_id === user.id
        );

        // Filter by type if specified
        if (options.type) {
            transactions = transactions.filter(tx => tx.type === options.type);
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Limit results
        if (options.limit) {
            transactions = transactions.slice(0, options.limit);
        }

        return {
            success: true,
            driver_phone: phone,
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount_original,
                currency: tx.currency_original,
                description: tx.description,
                status: tx.status,
                date: tx.created_at
            })),
            total: transactions.length
        };
    }

    /**
     * Get statistics for a cooperative
     * @param {string} cooperativaPhone - Cooperative phone number
     * @returns {Object} - Cooperative statistics
     */
    getCooperativaStats(cooperativaPhone) {
        const transactions = db.transactions.filter(tx =>
            tx.receiver_phone === cooperativaPhone && tx.type === 'cooperative_fee'
        );

        const totalEarnings = transactions.reduce((sum, tx) => sum + (tx.amount_original || 0), 0);
        const tripCount = transactions.length;

        return {
            success: true,
            cooperativa_phone: cooperativaPhone,
            stats: {
                total_trips: tripCount,
                total_earnings: totalEarnings,
                average_per_trip: tripCount > 0 ? totalEarnings / tripCount : 0
            }
        };
    }

    // ============================================
    // USER (PASSENGER) FUNCTIONS
    // ============================================

    /**
     * Register a new passenger user with RemesaLibre wallet
     * @param {Object} userData - User information
     * @returns {Object} - Registration result with wallet info
     */
    async registerUser(userData) {
        const {
            phone_number,
            full_name,
            email
        } = userData;

        // Check if user already exists
        const existingResult = userDirectoryService.findByPhone(phone_number);
        if (existingResult && existingResult.exists) {
            const existingUser = existingResult.user;
            if (!existingUser.is_pre_registered) {
                return {
                    success: true,
                    message: 'Usuario ya registrado en RemesaLibre',
                    user: existingUser,
                    wallet: db.getWalletByUserId(existingUser.id)
                };
            }
        }

        // Register new user
        const result = userDirectoryService.register({
            phone_number,
            full_name,
            email,
            cashout_preference: 'none', // Passengers don't usually need cashout
            metadata: {
                source: 'raite_usuario',
                user_type: 'passenger',
                registered_at: new Date().toISOString()
            }
        });

        console.log(`[RAITE] User registered: ${full_name} (${phone_number})`);

        return {
            success: true,
            message: 'Usuario registrado exitosamente',
            user: result.user,
            wallet: db.getWalletByUserId(result.user.id)
        };
    }

    /**
     * Top up user wallet balance
     * @param {Object} topupData - Top up information
     * @returns {Object} - Top up result with new balance
     */
    async topUpWallet(topupData) {
        const {
            phone_number,
            amount,
            currency = 'MXN',
            payment_method, // 'card', 'spei', 'oxxo'
            card_last4,
            reference
        } = topupData;

        // Validate amount
        if (!amount || amount < 10) {
            throw new Error('Monto mínimo: $10 MXN');
        }

        if (amount > 10000) {
            throw new Error('Monto máximo por recarga: $10,000 MXN');
        }

        // Find user
        const userResult = userDirectoryService.findByPhone(phone_number);
        if (!userResult || !userResult.exists) {
            throw new Error('Usuario no encontrado. Debe registrarse primero.');
        }
        const user = userResult.user;

        // Get wallet
        const wallet = db.getWalletByUserId(user.id);
        if (!wallet) {
            throw new Error('Wallet no encontrada');
        }

        const previousBalance = parseFloat(wallet.balance_mxn) || 0;

        // Update balance
        if (currency === 'MXN') {
            wallet.balance_mxn = previousBalance + parseFloat(amount);
        } else if (currency === 'USD') {
            wallet.balance_usd = (parseFloat(wallet.balance_usd) || 0) + parseFloat(amount);
        }

        db.updateWallet(user.id, wallet);

        // Record transaction
        const transaction = {
            id: `raite-topup-${Date.now()}`,
            type: 'topup',
            sender_id: 'PAYMENT_GATEWAY',
            receiver_id: user.id,
            receiver_phone: phone_number,
            amount_original: amount,
            currency_original: currency,
            description: `Recarga de saldo vía ${payment_method}${card_last4 ? ` (*${card_last4})` : ''}`,
            status: 'completed',
            created_at: new Date().toISOString(),
            metadata: {
                payment_method,
                reference,
                balance_before: previousBalance,
                balance_after: wallet.balance_mxn
            }
        };
        db.transactions.push(transaction);
        db.saveToFile();

        console.log(`[RAITE] User ${phone_number} topped up $${amount} ${currency}. New balance: $${wallet.balance_mxn} MXN`);

        return {
            success: true,
            message: 'Saldo agregado exitosamente',
            phone_number,
            amount_added: amount,
            currency,
            new_balance: {
                mxn: wallet.balance_mxn,
                usd: wallet.balance_usd || 0
            },
            transaction_id: transaction.id
        };
    }

    /**
     * Get user wallet balance (for passengers)
     * @param {string} phone - User phone number
     * @returns {Object} - Wallet balance
     */
    getUserBalance(phone) {
        const userResult = userDirectoryService.findByPhone(phone);
        if (!userResult || !userResult.exists) {
            throw new Error('Usuario no encontrado en RemesaLibre');
        }
        const user = userResult.user;

        const wallet = db.getWalletByUserId(user.id);
        if (!wallet) {
            throw new Error('Wallet no encontrada');
        }

        return {
            success: true,
            user: {
                id: user.id,
                name: user.full_name,
                phone: user.phone_number
            },
            balance: {
                mxn: wallet.balance_mxn || 0,
                usd: wallet.balance_usd || 0
            }
        };
    }

    /**
     * Get user transaction history (for passengers)
     * @param {string} phone - User phone number
     * @param {Object} options - Filter options
     * @returns {Object} - Transaction history
     */
    getUserTransactions(phone, options = {}) {
        const userResult = userDirectoryService.findByPhone(phone);
        if (!userResult || !userResult.exists) {
            throw new Error('Usuario no encontrado');
        }
        const user = userResult.user;

        let transactions = db.transactions.filter(tx =>
            tx.receiver_phone === phone ||
            tx.sender_phone === phone ||
            tx.receiver_id === user.id ||
            tx.sender_id === user.id
        );

        // Filter by type if specified
        if (options.type) {
            transactions = transactions.filter(tx => tx.type === options.type);
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Limit results
        if (options.limit) {
            transactions = transactions.slice(0, options.limit);
        }

        return {
            success: true,
            user_phone: phone,
            transactions: transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                amount: tx.amount_original,
                currency: tx.currency_original,
                description: tx.description,
                status: tx.status,
                date: tx.created_at
            })),
            total: transactions.length
        };
    }
    /**
     * Get financial report for a cooperative
     * @param {string} cooperativaId - Cooperative ID
     * @returns {Object} - Financial metrics
     */
    getCooperativeFinancialReport(cooperativaId) {
        // Filter transactions related to this cooperative
        // In a real DB we would query by indexed field. Here we filter in memory.
        const coopTxsc = db.transactions.filter(tx =>
            // Incomes: Commission fees received
            (tx.receiver_id === cooperativaId || tx.receiver_phone === cooperativaId) ||
            // Outflows: Payments to drivers or cashouts
            (tx.sender_id === cooperativaId || tx.sender_phone === cooperativaId)
        );

        const totalIncome = coopTxsc
            .filter(tx => tx.receiver_id === cooperativaId || tx.receiver_phone === cooperativaId)
            .reduce((sum, tx) => sum + (parseFloat(tx.amount_original) || 0), 0);

        const totalOutcome = coopTxsc
            .filter(tx => tx.sender_id === cooperativaId || tx.sender_phone === cooperativaId)
            .reduce((sum, tx) => sum + (parseFloat(tx.amount_original) || 0), 0);

        // Calculate trends (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const lastMonthIncome = coopTxsc
            .filter(tx =>
                (tx.receiver_id === cooperativaId || tx.receiver_phone === cooperativaId) &&
                new Date(tx.created_at) > thirtyDaysAgo
            )
            .reduce((sum, tx) => sum + (parseFloat(tx.amount_original) || 0), 0);

        return {
            success: true,
            cooperative_id: cooperativaId,
            period: 'all_time',
            generated_at: new Date().toISOString(),
            balance: {
                total_income: totalIncome,
                total_outcome: totalOutcome,
                current_net: totalIncome - totalOutcome,
                last_30_days_income: lastMonthIncome
            },
            recent_transactions: coopTxsc.slice(-20).reverse() // Last 20 txs
        };
    }
}

export const raiteService = new RaiteService();

