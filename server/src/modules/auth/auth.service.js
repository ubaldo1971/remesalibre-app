import { db } from '../../services/db.service.js';

/**
 * Auth Service (Security Module)
 * 
 * Manages security features:
 * 1. OTP (One-Time Password) for login/sensitive actions
 * 2. Transactional PIN validation
 * 3. Security logging
 */
class AuthService {

    /**
     * Generate an OTP code
     * @param {string} phone - User phone number
     * @param {string} purpose - 'login', 'transaction', 'recovery'
     * @returns {Object} OTP details (in production, code is sent via SMS)
     */
    generateOTP(phone, purpose = 'login') {
        const code = db.createOTPCode(phone, purpose);

        // In production: await smsService.send(phone, `Tu código es ${code.code}`);
        console.log(`[AUTH] OTP generated for ${phone} (${purpose}): ${code.code}`);

        return {
            success: true,
            message: 'Código enviado por SMS',
            expires_at: code.expires_at,
            // For prototype/testing only: return code
            debug_code: code.code
        };
    }

    /**
     * Verify an OTP code
     * @param {string} phone - User phone number
     * @param {string} code - Code entered by user
     * @param {string} purpose - Purpose to verify
     * @returns {Object} Verification result
     */
    verifyOTP(phone, code, purpose = 'login') {
        const isValid = db.verifyOTP(phone, code, purpose);

        if (!isValid) {
            // Log failed attempt
            const user = db.findUserByPhone(phone);
            if (user) {
                db.createSecurityLog(user.id, 'otp_failed', { phone, purpose });
            }

            return {
                success: false,
                message: 'Código inválido o expirado'
            };
        }

        return {
            success: true,
            message: 'Código verificado correctamente'
        };
    }

    /**
     * Validate Transactional PIN
     * @param {string} userId - User ID
     * @param {string} pin - 6-digit PIN
     * @returns {Object} Validation result
     */
    validatePIN(userId, pin) {
        // Check if blocked
        if (db.isPINBlocked(userId)) {
            const user = db.findUserById(userId);
            const attempts = db.pinAttempts.find(a => a.user_id === userId);
            return {
                success: false,
                blocked: true,
                message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${db.systemConfig.pin_lockout_minutes} minutos.`
            };
        }

        // For prototype: Hardcoded PIN '123456' for all users
        // In production: Compare with hashed PIN in DB
        const isValid = pin === '123456';

        db.recordPINAttempt(userId, isValid);

        if (!isValid) {
            db.createSecurityLog(userId, 'pin_failed', {});
            return {
                success: false,
                message: 'PIN incorrecto'
            };
        }

        return {
            success: true,
            message: 'PIN correcto'
        };
    }
}

export const authService = new AuthService();
