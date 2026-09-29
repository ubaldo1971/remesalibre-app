import express from 'express';
import crypto from 'crypto';
import { jwtService } from '../services/jwt.service.js';
import { db } from '../services/db.service.js';
import { authRateLimit } from '../middleware/auth.middleware.js';
import { smsService } from '../services/sms.service.js';
import { authenticateDemoAdmin } from '../services/demoAdmin.service.js';
import { authenticateDemoChannelUser } from '../services/demoChannelUser.service.js';

const router = express.Router();

// In-memory stores (in production, use PostgreSQL/Redis)
const otpCodes = new Map();
const pendingRegistrations = new Map();

// =============================================================================
// OTP ENDPOINTS
// =============================================================================

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Send OTP to phone number for verification
 * @access  Public
 */
router.post('/verify-phone', authRateLimit, async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Phone number is required'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

        otpCodes.set(phoneNumber, {
            otp,
            expiresAt,
            attempts: 0
        });

        // Send SMS via Twilio (or log in dev mode)
        const smsResult = await smsService.sendOTP(phoneNumber, otp);

        if (!smsResult.success) {
            console.error('[Auth] SMS send failed:', smsResult.error);
            // Don't fail the request - OTP is still stored and logged
        }

        res.json({
            success: true,
            message: smsService.isConfigured() ? 'Código enviado por SMS' : 'Código generado (modo desarrollo)',
            expiresIn: 300,
            smsMode: smsResult.mode || 'unknown',
            // Development only: return OTP for testing
            ...(process.env.NODE_ENV !== 'production' && { debug_otp: otp }),
        });
    } catch (error) {
        console.error('[Auth] verify-phone error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and OTP are required'
            });
        }

        const stored = otpCodes.get(phoneNumber);

        if (!stored) {
            return res.status(400).json({
                success: false,
                error: 'No OTP found for this number. Request a new one.'
            });
        }

        // Check expiration
        if (Date.now() > stored.expiresAt) {
            otpCodes.delete(phoneNumber);
            return res.status(400).json({
                success: false,
                error: 'OTP expired. Request a new one.'
            });
        }

        // Check attempts
        if (stored.attempts >= 3) {
            otpCodes.delete(phoneNumber);
            return res.status(400).json({
                success: false,
                error: 'Too many attempts. Request a new OTP.'
            });
        }

        // Verify OTP
        if (stored.otp !== otp) {
            stored.attempts++;
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP',
                attemptsRemaining: 3 - stored.attempts
            });
        }

        // OTP verified - clean up
        otpCodes.delete(phoneNumber);

        // Generate a temporary token for registration
        const tempToken = crypto.randomUUID();
        pendingRegistrations.set(tempToken, {
            phoneNumber,
            expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
        });

        res.json({
            success: true,
            message: 'OTP verified successfully',
            tempToken,
        });
    } catch (error) {
        console.error('[Auth] verify-otp error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Register new user after OTP verification
 * @access  Public (requires tempToken from OTP verification)
 */
router.post('/register', async (req, res) => {
    try {
        const { tempToken, phoneNumber, pin, firstName, lastName, email } = req.body;

        // Validate required fields
        if (!phoneNumber || !pin || !firstName) {
            return res.status(400).json({
                success: false,
                error: 'Phone number, PIN, and first name are required'
            });
        }

        // Verify temp token if provided (from OTP flow)
        if (tempToken) {
            const pending = pendingRegistrations.get(tempToken);
            if (!pending || pending.phoneNumber !== phoneNumber || Date.now() > pending.expiresAt) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid or expired registration token'
                });
            }
            pendingRegistrations.delete(tempToken);
        }

        // Check if user already exists
        const existingUser = db.users.find(u => u.phone_number === phoneNumber);
        if (existingUser && existingUser.status !== 'pre_registered') {
            return res.status(400).json({
                success: false,
                error: 'Este número de teléfono ya está registrado'
            });
        }

        // Check if email already exists (if email is provided)
        if (email) {
            const existingEmail = db.users.find(u => u.email === email);
            if (existingEmail && existingEmail.status !== 'pre_registered') {
                return res.status(400).json({
                    success: false,
                    error: 'Este correo electrónico ya está registrado'
                });
            }
        }

        // Create user in database
        const userId = crypto.randomUUID();
        const user = {
            id: userId,
            phone_number: phoneNumber,
            first_name: firstName,
            last_name: lastName || '',
            email: email || '',
            pin: pin, // In production: hash with bcrypt!
            status: 'active',
            created_at: new Date().toISOString()
        };

        // Add to users array
        db.users.push(user);

        // Create wallet for user
        db.wallets.push({
            id: `wallet-${userId}`,
            user_id: userId,
            balance_mxn: 0,
            balance_usd: 0,
            updated_at: new Date().toISOString()
        });

        // Add to user directory
        db.userDirectory.push({
            id: userId,
            phone_number: phoneNumber,
            country: 'MX',
            full_name: `${firstName} ${lastName || ''}`.trim(),
            email: email || '',
            status: 'active',
            kyc_level: 0,
            daily_limit_usd: 5000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        // Generate JWT tokens
        const tokens = jwtService.generateTokenPair(user);

        // Log registration
        db.createSecurityLog({
            user_id: userId,
            event_type: 'registration',
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
            metadata: { method: 'phone' }
        });

        // Save to persistent storage
        db.saveToFile();

        console.log(`[Auth] New user registered: ${phoneNumber} (${userId})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user.id,
                phoneNumber: user.phone_number,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        console.error('[Auth] register error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// LOGIN
// =============================================================================

/**
 * @route   POST /api/auth/login
 * @desc    Login with phone and PIN
 * @access  Public
 */
router.post('/login', authRateLimit, async (req, res) => {
    try {
        const { phoneNumber, pin } = req.body;

        if (!phoneNumber || !pin) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and PIN are required'
            });
        }

        // Demo identities are ephemeral and never persisted to db.json.
        const demoAdmin = authenticateDemoAdmin({ phoneNumber, pin });
        const demoChannelUser = authenticateDemoChannelUser({ phoneNumber, pin });
        const ephemeralDemoUser = demoAdmin || demoChannelUser;
        const user = ephemeralDemoUser || db.users.find(u => u.phone_number === phoneNumber);

        if (!user) {
            // Log failed attempt
            db.createSecurityLog({
                user_id: null,
                event_type: 'login_failed',
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
                metadata: { reason: 'user_not_found', phone: phoneNumber }
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if account is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                error: 'Account is blocked. Contact support.'
            });
        }

        // Verify PIN (in production: use bcrypt.compare)
        if (!ephemeralDemoUser && user.pin !== pin) {
            db.createSecurityLog({
                user_id: user.id,
                event_type: 'login_failed',
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
                metadata: { reason: 'invalid_pin' }
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Generate JWT tokens
        const tokens = jwtService.generateTokenPair(user);

        // Avoid recording ephemeral channel identities in the legacy local store.
        if (!ephemeralDemoUser) {
            db.createSecurityLog({
                user_id: user.id,
                event_type: 'login_success',
                ip_address: req.ip,
                user_agent: req.get('user-agent'),
                metadata: {}
            });
        }

        console.log(`[Auth] User logged in: ${phoneNumber} (${user.id})`);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                phoneNumber: user.phone_number,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role || 'user'
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        console.error('[Auth] login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// TOKEN REFRESH
// =============================================================================

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }

        // Verify and refresh
        const result = jwtService.refreshTokens(refreshToken);

        if (!result) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired refresh token',
                code: 'REFRESH_TOKEN_INVALID'
            });
        }

        res.json({
            success: true,
            accessToken: result.accessToken,
        });
    } catch (error) {
        console.error('[Auth] refresh error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// =============================================================================
// GOOGLE LOGIN
// =============================================================================

/**
 * @route   POST /api/auth/google-login
 * @desc    Check if Google user exists and login, or signal new user
 * @access  Public
 */
router.post('/google-login', async (req, res) => {
    try {
        const { email, googleId, picture, firstName, lastName } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required'
            });
        }

        // Find user by email
        const user = db.users.find(u => u.email === email);

        if (!user) {
            // User does not exist, return flag to proceed with registration
            return res.json({
                success: true,
                isNewUser: true,
                message: 'User not found, proceed to registration'
            });
        }

        // Check if account is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                error: 'Account is blocked. Contact support.'
            });
        }

        // Generate JWT tokens
        const tokens = jwtService.generateTokenPair(user);

        // Update user picture if provided and not set
        if (picture && !user.picture) {
            user.picture = picture;
            // Also update directory
            const dirUser = db.userDirectory.find(u => u.id === user.id);
            if (dirUser) dirUser.picture = picture;
            db.saveToFile();
        }

        // Log successful login
        db.createSecurityLog({
            user_id: user.id,
            event_type: 'login_success',
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
            metadata: { method: 'google' }
        });

        console.log(`[Auth] User logged in via Google: ${email} (${user.id})`);

        res.json({
            success: true,
            isNewUser: false,
            message: 'Login successful',
            user: {
                id: user.id,
                phoneNumber: user.phone_number,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                picture: user.picture
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });

    } catch (error) {
        console.error('[Auth] google-login error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// LOGOUT
// =============================================================================

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate refresh token
 * @access  Public
 */
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Revoke the refresh token
            jwtService.revokeRefreshToken(refreshToken);
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('[Auth] logout error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =============================================================================
// TOKEN INFO (for debugging)
// =============================================================================

/**
 * @route   GET /api/auth/token-info
 * @desc    Get info about a token (development only)
 * @access  Public
 */
if (process.env.NODE_ENV !== 'production') {
    router.post('/token-info', (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        const info = jwtService.getTokenInfo(token);
        res.json(info || { error: 'Invalid token' });
    });
}

export default router;
