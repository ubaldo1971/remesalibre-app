import { db } from '../../services/db.service.js';

/**
 * UserDirectory Service (DICT Module)
 * 
 * Manages the directory of users by phone number, similar to Brazil's Pix DICT system.
 * Enables instant lookup of recipients by phone for seamless money transfers.
 */
class UserDirectoryService {

    /**
     * Find user by phone number
     * @param {string} phone - Phone number in international format (e.g., +5215512345678)
     * @returns {Object|null} User if found, null otherwise
     */
    findByPhone(phone) {
        const user = db.findUserByPhone(phone);

        if (!user) {
            return {
                exists: false,
                message: 'Usuario no encontrado'
            };
        }

        return {
            exists: true,
            user: {
                id: user.id,
                phone_number: user.phone_number,
                full_name: user.full_name,
                status: user.status,
                is_pre_registered: user.status === 'pre_registered'
            }
        };
    }

    /**
     * Register a new user in the directory
     * @param {Object} data - User registration data
     * @returns {Object} Created user
     */
    register(data) {
        // Validate required fields
        if (!data.phone_number) {
            throw new Error('Phone number is required');
        }

        if (!data.full_name) {
            throw new Error('Full name is required');
        }

        // Check if user already exists
        const existing = db.findUserByPhone(data.phone_number);
        if (existing && existing.status !== 'pre_registered') {
            throw new Error('User already registered with this phone number');
        }

        // If user was pre-registered, upgrade to active
        if (existing && existing.status === 'pre_registered') {
            const updated = db.updateUserProfile(data.phone_number, {
                full_name: data.full_name,
                email: data.email || '',
                status: 'active',
                cashout_preference: data.cashout_preference || 'wallet',
                bank_account: data.bank_account || null
            });

            // Also create wallet for this user if not exists
            const wallet = db.getWalletByUserId(existing.id);
            if (!wallet) {
                db.wallets.push({
                    id: `wallet-${existing.id}`,
                    user_id: existing.id,
                    balance_mxn: 0.00,
                    balance_usd: 0.00,
                    updated_at: new Date().toISOString()
                });
            }

            return {
                success: true,
                user: updated,
                message: 'Registro completado exitosamente'
            };
        }

        // Create new user
        const user = db.createUserInDirectory({
            phone_number: data.phone_number,
            full_name: data.full_name,
            email: data.email || '',
            country: data.country || 'MX',
            cashout_preference: data.cashout_preference || 'wallet',
            bank_account: data.bank_account || null,
            status: 'active'
        });

        // Create wallet for new user
        db.wallets.push({
            id: `wallet-${user.id}`,
            user_id: user.id,
            balance_mxn: 0.00,
            balance_usd: 0.00,
            updated_at: new Date().toISOString()
        });

        // Also add to legacy users array for compatibility
        db.users.push({
            id: user.id,
            phone_number: user.phone_number,
            first_name: user.full_name.split(' ')[0],
            last_name: user.full_name.split(' ').slice(1).join(' '),
            email: user.email,
            status: user.status,
            created_at: user.created_at
        });

        // Ensure persistence
        db.saveToFile();

        return {
            success: true,
            user,
            message: 'Usuario registrado exitosamente'
        };
    }

    /**
     * Create a pre-registered user (when receiving money before registration)
     * @param {string} phone - Recipient phone number
     * @param {string} referredBy - ID of user who sent money
     * @returns {Object} Pre-registered user
     */
    preRegister(phone, referredBy = null) {
        const user = db.createPreRegisteredUser(phone, referredBy);

        // Create wallet with pending balance
        const existingWallet = db.getWalletByUserId(user.id);
        if (!existingWallet) {
            db.wallets.push({
                id: `wallet-${user.id}`,
                user_id: user.id,
                balance_mxn: 0.00,
                balance_usd: 0.00,
                updated_at: new Date().toISOString()
            });

            // Ensure persistence
            db.saveToFile();
        } else {
            // Even if wallet exists, we save the new user
            db.saveToFile();
        }

        return {
            success: true,
            user,
            is_pre_registered: true,
            message: 'Pre-registro creado. El destinatario debe completar su registro para acceder a los fondos.'
        };
    }

    /**
     * Update user profile
     * @param {string} phone - User phone number
     * @param {Object} updates - Fields to update
     * @returns {Object} Updated user
     */
    updateProfile(phone, updates) {
        // Don't allow updating phone or id
        delete updates.phone_number;
        delete updates.id;

        const user = db.updateUserProfile(phone, updates);
        db.saveToFile();

        return {
            success: true,
            user,
            message: 'Perfil actualizado exitosamente'
        };
    }

    /**
     * Update cashout configuration
     * @param {string} phone - User phone number
     * @param {Object} config - Cashout configuration
     * @returns {Object} Updated user
     */
    updateCashoutConfig(phone, config) {
        const updates = {};

        if (config.method) {
            updates.cashout_preference = config.method;
        }

        if (config.bank_account) {
            updates.bank_account = config.bank_account;
        }

        return this.updateProfile(phone, updates);
    }

    /**
     * Get all users in directory (admin only)
     * @param {Object} filters - Optional filters
     * @returns {Array} List of users
     */
    getAllUsers(filters = {}) {
        let users = [...db.userDirectory];

        // Apply filters
        if (filters.status) {
            users = users.filter(u => u.status === filters.status);
        }

        if (filters.country) {
            users = users.filter(u => u.country === filters.country);
        }

        if (filters.search) {
            const search = filters.search.toLowerCase();
            users = users.filter(u =>
                u.full_name.toLowerCase().includes(search) ||
                u.phone_number.includes(search) ||
                u.email.toLowerCase().includes(search)
            );
        }

        return users;
    }
}

export const userDirectoryService = new UserDirectoryService();
