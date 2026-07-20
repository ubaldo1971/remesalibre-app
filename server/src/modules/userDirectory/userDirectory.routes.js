import express from 'express';
import { userDirectoryService } from './userDirectory.service.js';

const router = express.Router();

/**
 * GET /api/user/by-phone
 * Find user by phone number
 */
router.get('/by-phone', (req, res) => {
    try {
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = userDirectoryService.findByPhone(phone);
        res.json(result);
    } catch (error) {
        console.error('Error finding user by phone:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/user/register
 * Register a new user
 */
router.post('/register', (req, res) => {
    try {
        const { phone_number, full_name, email, cashout_preference, bank_account } = req.body;

        const result = userDirectoryService.register({
            phone_number,
            full_name,
            email,
            cashout_preference,
            bank_account
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/user/pre-register
 * Create a pre-registered user (used internally when sending to unregistered number)
 */
router.post('/pre-register', (req, res) => {
    try {
        const { phone, referred_by } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = userDirectoryService.preRegister(phone, referred_by);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error pre-registering user:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', (req, res) => {
    try {
        const { phone, updates } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = userDirectoryService.updateProfile(phone, updates);
        res.json(result);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * PUT /api/user/cashout-config
 * Update cashout configuration
 */
router.put('/cashout-config', (req, res) => {
    try {
        const { phone, method, bank_account } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const result = userDirectoryService.updateCashoutConfig(phone, {
            method,
            bank_account
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating cashout config:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/user/all (Admin only - would need auth middleware in production)
 * Get all users with optional filters
 */
router.get('/all', (req, res) => {
    try {
        const { status, country, search } = req.query;

        const users = userDirectoryService.getAllUsers({
            status,
            country,
            search
        });

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
