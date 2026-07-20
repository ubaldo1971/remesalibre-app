import express from 'express';
import { authService } from './auth.service.js';

const router = express.Router();

/**
 * POST /api/auth/otp/generate
 * Generate OTP for a phone number
 */
router.post('/otp/generate', (req, res) => {
    try {
        const { phone, purpose } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = authService.generateOTP(phone, purpose);
        res.json(result);
    } catch (error) {
        console.error('Error generating OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/auth/otp/verify
 * Verify OTP code
 */
router.post('/otp/verify', (req, res) => {
    try {
        const { phone, code, purpose } = req.body;

        if (!phone || !code) {
            return res.status(400).json({
                success: false,
                message: 'Phone and code are required'
            });
        }

        const result = authService.verifyOTP(phone, code, purpose);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/auth/pin/validate
 * Validate transactional PIN
 */
router.post('/pin/validate', (req, res) => {
    try {
        const { user_id, pin } = req.body;

        if (!user_id || !pin) {
            return res.status(400).json({
                success: false,
                message: 'User ID and PIN are required'
            });
        }

        const result = authService.validatePIN(user_id, pin);

        if (!result.success) {
            return res.status(403).json(result); // 403 Forbidden for bad PIN
        }

        res.json(result);
    } catch (error) {
        console.error('Error validating PIN:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
