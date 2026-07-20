import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

class DbService {
    constructor() {
        // Existing data structures
        this.users = [];
        this.wallets = [];
        this.transactions = [];
        this.ledgerEntries = [];

        // New data structures for Pix-style system
        this.userDirectory = []; // DICT - Directory of users by phone
        this.accounts = []; // Ledger accounts (separated from wallets)
        this.paymentRequests = []; // QR payment requests
        this.cashoutRequests = []; // Cashout/withdrawal requests
        this.otpCodes = []; // OTP codes for auth
        this.pinAttempts = []; // PIN attempt tracking
        this.securityLogs = []; // Security audit logs
        this.votes = []; // Community votes
        this.savedCards = {}; // Saved payment cards by userId

        // Enhanced system configuration
        this.systemConfig = {
            // Exchange rates
            commission_rate: 0.005, // 0.5%
            spread: 0.015, // 1.5%
            exchange_rate_usd_mxn: 19.50,
            exchange_rate_manual_override: false,

            // Transaction limits
            min_transaction_usd: 1,
            max_transaction_usd: 10000,
            daily_limit_default_usd: 5000,

            // Timeouts and expiration
            qr_expiration_seconds: 300, // 5 minutes
            otp_expiration_seconds: 300, // 5 minutes

            // Security
            max_pin_attempts: 3,
            pin_lockout_minutes: 5,

            // Features toggle
            features: {
                qr_payments: true,
                cashout_oxxo: true,
                cashout_bank: true,
                pre_registration: true,
            },

            // Admin Dashboard Configuration
            adminConfig: {
                // Donation Campaign
                donationEnabled: true,
                donationCause: 'Reconstrucción de escuelas en Oaxaca',
                donationGoal: 100000,
                donationCurrent: 45230,

                // Donation preset amounts (USD)
                donationAmounts: [1, 5, 10],

                // Donation wallet address (Polygon USDC)
                donationWalletAddress: process.env.DONATION_WALLET_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1c',

                // Total donations received in USDC
                totalDonationsUSDC: 0,

                // Community Voting
                votingEnabled: true,
                votingQuestion: '¿Qué nueva funcionalidad prefieres?',
                votingOptionA: { text: 'Pagos programados', votes: 234 },
                votingOptionB: { text: 'Cashback en compras', votes: 189 },

                // System settings
                commission: 0.99,
                spread: 1.0
            }
        };

        this.initializeData();
    }

    initializeData() {
        // Create Demo User (Sender)
        const user1 = {
            id: 'user-1',
            phone_number: '+5215512345678',
            first_name: 'Usuario',
            last_name: 'Demo',
            email: 'demo@remesa.com',
            pin: '123456', // Default PIN for testing
            status: 'active',
            created_at: new Date().toISOString()
        };
        this.users.push(user1);

        this.wallets.push({
            id: 'wallet-1',
            user_id: 'user-1',
            balance_mxn: 5000.00,
            balance_usd: 1000.00,
            updated_at: new Date().toISOString()
        });

        // Create Recipient User
        const user2 = {
            id: 'user-2',
            phone_number: '+5215587654321',
            first_name: 'María',
            last_name: 'López',
            email: 'maria@example.com',
            pin: '123456', // Default PIN for testing
            status: 'active',
            created_at: new Date().toISOString()
        };
        this.users.push(user2);

        this.wallets.push({
            id: 'wallet-2',
            user_id: 'user-2',
            balance_mxn: 500.00,
            balance_usd: 1000.00, // Added funds for testing
            updated_at: new Date().toISOString()
        });

        // System Wallet (for fees)
        this.wallets.push({
            id: 'wallet-system',
            user_id: 'system',
            balance_mxn: 0.00,
            balance_usd: 0.00,
            updated_at: new Date().toISOString()
        });

        // Sync users to UserDirectory (DICT)
        this.userDirectory.push({
            id: 'user-1',
            phone_number: '+5215512345678',
            country: 'MX',
            full_name: 'Usuario Demo',
            email: 'demo@remesa.com',
            cashout_preference: 'wallet',
            bank_account: null,
            status: 'active',
            kyc_level: 1,
            daily_limit_usd: 5000,
            created_at: user1.created_at,
            updated_at: new Date().toISOString()
        });

        this.userDirectory.push({
            id: 'user-2',
            phone_number: '+5215587654321',
            country: 'MX',
            full_name: 'María López',
            email: 'maria@example.com',
            cashout_preference: 'bank',
            bank_account: {
                clabe: '012345678901234567',
                bank_name: 'Banco Demo'
            },
            status: 'active',
            kyc_level: 2,
            daily_limit_usd: 10000,
            created_at: user2.created_at,
            updated_at: new Date().toISOString()
        });
    }

    // User Methods
    findUserById(id) {
        return this.users.find(u => u.id === id);
    }

    findUserByPhone(phone) {
        // Look in both users (for PIN/auth) and userDirectory (for Pix info)
        return this.users.find(u => u.phone_number === phone) ||
            this.userDirectory.find(u => u.phone_number === phone);
    }

    // Wallet Methods
    getWalletByUserId(userId) {
        return this.wallets.find(w => w.user_id === userId);
    }

    updateWalletBalance(userId, currency, amount) {
        const wallet = this.getWalletByUserId(userId);
        if (!wallet) throw new Error('Wallet not found');

        const key = `balance_${currency.toLowerCase()}`;
        if (wallet[key] === undefined) throw new Error(`Invalid currency: ${currency}`);

        wallet[key] += amount;
        wallet.updated_at = new Date().toISOString();

        // Ensure persistence
        this.saveToFile();

        return wallet;
    }

    updateWallet(userId, updates) {
        const wallet = this.getWalletByUserId(userId);
        if (!wallet) throw new Error('Wallet not found');

        if (updates.balance_mxn !== undefined) wallet.balance_mxn = updates.balance_mxn;
        if (updates.balance_usd !== undefined) wallet.balance_usd = updates.balance_usd;
        wallet.updated_at = new Date().toISOString();

        // Ensure persistence
        this.saveToFile();

        return wallet;
    }

    // Transaction Methods
    createTransaction(data) {
        // Robust UUID generation with fallback
        const id = (typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const transaction = {
            id: id,
            created_at: new Date().toISOString(),
            status: 'pending',
            ...data
        };
        this.transactions.push(transaction);
        return transaction;
    }

    updateTransactionStatus(id, status) {
        const tx = this.transactions.find(t => t.id === id);
        if (tx) {
            tx.status = status;
            if (status === 'completed') {
                tx.completed_at = new Date().toISOString();
            }
        }
        return tx;
    }

    // Ledger Methods
    createLedgerEntry(data) {
        const entry = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...data
        };
        this.ledgerEntries.push(entry);
        return entry;
    }

    getSystemConfig() {
        return this.systemConfig;
    }

    updateSystemConfig(updates) {
        this.systemConfig = { ...this.systemConfig, ...updates };
        return this.systemConfig;
    }

    // ==================== USER DIRECTORY METHODS (DICT) ====================

    // Consistently use the same findUserByPhone
    // (Removed duplicate to avoid method overriding issues)

    createUserInDirectory(data) {
        const user = {
            id: crypto.randomUUID(),
            phone_number: data.phone_number,
            country: data.country || 'MX',
            full_name: data.full_name || '',
            email: data.email || '',
            cashout_preference: data.cashout_preference || 'wallet',
            bank_account: data.bank_account || null,
            status: data.status || 'active',
            kyc_level: data.kyc_level || 0,
            daily_limit_usd: data.daily_limit_usd || this.systemConfig.daily_limit_default_usd,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        this.userDirectory.push(user);
        return user;
    }

    createPreRegisteredUser(phone, referredBy = null) {
        const existing = this.findUserByPhone(phone);
        if (existing) return existing;

        return this.createUserInDirectory({
            phone_number: phone,
            full_name: `Usuario ${phone.slice(-4)}`,
            status: 'pre_registered',
            metadata: { referred_by: referredBy }
        });
    }

    updateUserProfile(phone, updates) {
        const user = this.findUserByPhone(phone);
        if (!user) throw new Error('User not found');

        Object.assign(user, updates, {
            updated_at: new Date().toISOString()
        });
        return user;
    }

    // ==================== PAYMENT REQUESTS (QR) METHODS ====================

    createPaymentRequest(data) {
        const request = {
            id: crypto.randomUUID(),
            receiver_user_id: data.receiver_user_id,
            receiver_phone: data.receiver_phone,
            amount_mxn: data.amount_mxn || null,
            description: data.description || 'Pago',
            qr_payload: data.qr_payload,
            expires_at: new Date(Date.now() + (data.ttl_seconds || this.systemConfig.qr_expiration_seconds) * 1000).toISOString(),
            status: 'active',
            paid_by: null,
            paid_at: null,
            created_at: new Date().toISOString()
        };
        this.paymentRequests.push(request);
        return request;
    }

    findPaymentRequestById(id) {
        return this.paymentRequests.find(r => r.id === id);
    }

    updatePaymentRequest(id, updates) {
        const request = this.findPaymentRequestById(id);
        if (!request) throw new Error('Payment request not found');
        Object.assign(request, updates);
        return request;
    }

    markPaymentRequestAsPaid(id, paidBy) {
        const request = this.findPaymentRequestById(id);
        if (!request) throw new Error('Payment request not found');

        request.status = 'paid';
        request.paid_by = paidBy;
        request.paid_at = new Date().toISOString();
        return request;
    }

    // ==================== CASHOUT REQUESTS METHODS ====================

    createCashoutRequest(data) {
        const request = {
            id: crypto.randomUUID(),
            user_id: data.user_id,
            amount_mxn: data.amount_mxn,
            method: data.method, // 'bank_spei', 'oxxo', 'wallet'
            destination: data.destination, // { clabe, bank_name } or { oxxo_reference }
            status: 'pending',
            reference_code: this.generateCashoutReference(data.method),
            executed_at: null,
            error_message: null,
            created_at: new Date().toISOString()
        };
        this.cashoutRequests.push(request);
        return request;
    }

    generateCashoutReference(method) {
        if (method === 'oxxo') {
            return 'OXX' + Math.random().toString(36).substr(2, 10).toUpperCase();
        } else if (method === 'bank_spei') {
            return 'SPEI' + Date.now();
        }
        return crypto.randomUUID().substr(0, 8).toUpperCase();
    }

    findCashoutRequestById(id) {
        return this.cashoutRequests.find(r => r.id === id);
    }

    findCashoutRequestsByUserId(userId) {
        return this.cashoutRequests.filter(r => r.user_id === userId);
    }

    updateCashoutRequestStatus(id, status, errorMessage = null) {
        const request = this.findCashoutRequestById(id);
        if (!request) throw new Error('Cashout request not found');

        request.status = status;
        if (status === 'completed') {
            request.executed_at = new Date().toISOString();
        }
        if (errorMessage) {
            request.error_message = errorMessage;
        }
        return request;
    }

    // ==================== OTP METHODS ====================

    createOTPCode(phone, purpose = 'login') {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const otp = {
            id: crypto.randomUUID(),
            phone_number: phone,
            code: code, // In production, hash this
            purpose: purpose, // 'registration', 'login', 'transaction'
            expires_at: new Date(Date.now() + this.systemConfig.otp_expiration_seconds * 1000).toISOString(),
            attempts: 0,
            used: false,
            created_at: new Date().toISOString()
        };
        this.otpCodes.push(otp);
        return otp;
    }

    verifyOTP(phone, code, purpose) {
        const otp = this.otpCodes.find(o =>
            o.phone_number === phone &&
            o.code === code &&
            o.purpose === purpose &&
            !o.used &&
            new Date(o.expires_at) > new Date()
        );

        if (!otp) return false;

        otp.used = true;
        return true;
    }

    // ==================== SECURITY LOGS ====================

    createSecurityLog(data) {
        const log = {
            id: crypto.randomUUID(),
            user_id: data.user_id,
            event_type: data.event_type, // 'login_success', 'login_failed', 'pin_failed', etc
            ip_address: data.ip_address,
            user_agent: data.user_agent,
            metadata: data.metadata || {},
            created_at: new Date().toISOString()
        };
        this.securityLogs.push(log);
        return log;
    }

    // ==================== PIN ATTEMPTS TRACKING ====================

    recordPINAttempt(userId, success) {
        let record = this.pinAttempts.find(p => p.user_id === userId);

        if (!record) {
            record = {
                user_id: userId,
                failed_attempts: 0,
                blocked_until: null,
                last_attempt_at: null
            };
            this.pinAttempts.push(record);
        }

        record.last_attempt_at = new Date().toISOString();

        if (success) {
            record.failed_attempts = 0;
            record.blocked_until = null;
        } else {
            record.failed_attempts++;

            if (record.failed_attempts >= this.systemConfig.max_pin_attempts) {
                const lockoutMs = this.systemConfig.pin_lockout_minutes * 60 * 1000;
                record.blocked_until = new Date(Date.now() + lockoutMs).toISOString();
            }
        }

        return record;
    }

    isPINBlocked(userId) {
        const record = this.pinAttempts.find(p => p.user_id === userId);
        if (!record || !record.blocked_until) return false;

        return new Date(record.blocked_until) > new Date();
    }

    // ==================== ADMIN CONFIG METHODS ====================

    getAdminConfig() {
        return this.systemConfig.adminConfig;
    }

    updateAdminConfig(updates) {
        this.systemConfig.adminConfig = {
            ...this.systemConfig.adminConfig,
            ...updates
        };
        return this.systemConfig.adminConfig;
    }

    // ==================== USER MANAGEMENT METHODS ====================

    getAllUsers() {
        // Combine users with their wallets for full data
        return this.users.map(user => {
            const wallet = this.getWalletByUserId(user.id);
            const directoryInfo = this.userDirectory.find(u => u.id === user.id);
            return {
                ...user,
                balanceMXN: wallet?.balance_mxn || 0,
                balanceUSD: wallet?.balance_usd || 0,
                state: directoryInfo?.state || 'N/A',
                city: directoryInfo?.city || 'N/A',
                country: directoryInfo?.country || 'MX'
            };
        });
    }

    updateUser(userId, updates) {
        const user = this.users.find(u => u.id === userId);
        if (!user) throw new Error('User not found');

        // Update main user record
        const allowedFields = ['first_name', 'last_name', 'email', 'phone_number', 'status'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                user[field] = updates[field];
            }
        });

        // Update directory info
        const directoryUser = this.userDirectory.find(u => u.id === userId);
        if (directoryUser) {
            if (updates.full_name) directoryUser.full_name = updates.full_name;
            if (updates.email) directoryUser.email = updates.email;
            if (updates.phone_number) directoryUser.phone_number = updates.phone_number;
            if (updates.state) directoryUser.state = updates.state;
            if (updates.city) directoryUser.city = updates.city;
            if (updates.country) directoryUser.country = updates.country;
            directoryUser.updated_at = new Date().toISOString();
        }

        this.saveToFile();
        return user;
    }

    // ==================== PERSISTENCE METHODS ====================

    saveToFile() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const data = {
                users: this.users,
                wallets: this.wallets,
                transactions: this.transactions,
                userDirectory: this.userDirectory,
                savedCards: this.savedCards,
                votes: this.votes,
                savedAt: new Date().toISOString()
            };

            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
            console.log('[DB] Data saved to file');
        } catch (error) {
            console.error('[DB] Error saving data:', error.message);
        }
    }

    loadFromFile() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

                // Merge loaded data with demo data
                if (data.users && data.users.length > 0) {
                    // Keep demo users and add loaded users
                    const existingIds = this.users.map(u => u.id);
                    data.users.forEach(user => {
                        if (!existingIds.includes(user.id)) {
                            this.users.push(user);
                        }
                    });
                }

                if (data.wallets && data.wallets.length > 0) {
                    const existingIds = this.wallets.map(w => w.id);
                    data.wallets.forEach(wallet => {
                        if (!existingIds.includes(wallet.id)) {
                            this.wallets.push(wallet);
                        }
                    });
                }

                if (data.transactions) {
                    this.transactions = [...this.transactions, ...data.transactions];
                }

                if (data.userDirectory && data.userDirectory.length > 0) {
                    const existingIds = this.userDirectory.map(u => u.id);
                    data.userDirectory.forEach(user => {
                        if (!existingIds.includes(user.id)) {
                            this.userDirectory.push(user);
                        }
                    });
                }

                if (data.savedCards) {
                    this.savedCards = { ...this.savedCards, ...data.savedCards };
                }

                if (data.votes) {
                    this.votes = [...this.votes, ...data.votes];
                }

                console.log(`[DB] Data loaded from file (${this.users.length} users, ${this.wallets.length} wallets)`);
            }
        } catch (error) {
            console.error('[DB] Error loading data:', error.message);
        }
    }
}

// Singleton instance
export const db = new DbService();

// Load persisted data on startup
db.loadFromFile();

