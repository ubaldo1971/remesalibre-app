/**
 * Raite Routes - API endpoints for Raite integration
 * These endpoints are called by Raite apps (Chofer, Cooperativa, Admin)
 */

import express from 'express';
import { raiteService } from './raite.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/raite/driver/register
 * Register a new driver with RemesaLibre wallet
 * @access Protected - requires API key or JWT
 */
router.post('/driver/register', async (req, res) => {
    try {
        const {
            phone_number,
            full_name,
            cooperativa_id,
            cooperativa_nombre,
            email,
            bank_account
        } = req.body;

        // Validate required fields
        if (!phone_number || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'phone_number y full_name son requeridos'
            });
        }

        const result = await raiteService.registerDriver({
            phone_number,
            full_name,
            cooperativa_id,
            cooperativa_nombre,
            email,
            bank_account
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('[RAITE] Error registering driver:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/raite/trip/payment
 * Process a trip payment with automatic 3-way split
 * @access Protected - requires API key
 */
router.post('/trip/payment', async (req, res) => {
    try {
        const {
            trip_id,
            passenger_phone,
            driver_phone,
            cooperativa_phone,
            amount_mxn,
            distance_km,
            duration_min,
            origin,
            destination,
            split_config
        } = req.body;

        // Validate required fields
        if (!trip_id || !driver_phone || !amount_mxn) {
            return res.status(400).json({
                success: false,
                error: 'trip_id, driver_phone y amount_mxn son requeridos'
            });
        }

        const result = await raiteService.processTripPayment({
            trip_id,
            passenger_phone,
            driver_phone,
            cooperativa_phone,
            amount_mxn: parseFloat(amount_mxn),
            distance_km,
            duration_min,
            origin,
            destination,
            split_config
        });

        res.json(result);
    } catch (error) {
        console.error('[RAITE] Error processing trip payment:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/driver/balance/:phone
 * Get driver wallet balance by phone number
 * @access Protected - requires JWT
 */
router.get('/driver/balance/:phone', authenticate, (req, res) => {
    try {
        const { phone } = req.params;
        const result = raiteService.getDriverBalance(phone);
        res.json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/driver/transactions/:phone
 * Get driver transaction history
 * @access Protected - requires JWT
 */
router.get('/driver/transactions/:phone', authenticate, (req, res) => {
    try {
        const { phone } = req.params;
        const { type, limit } = req.query;

        const result = raiteService.getDriverTransactions(phone, {
            type,
            limit: limit ? parseInt(limit) : 20
        });

        res.json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/cooperativa/stats/:phone
 * Get cooperative statistics
 * @access Protected - requires JWT
 */
router.get('/cooperativa/stats/:phone', authenticate, (req, res) => {
    try {
        const { phone } = req.params;
        const result = raiteService.getCooperativaStats(phone);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/cooperativa/financial-report/:id
 * Get advanced financial report for a cooperative
 * @access Protected - requires JWT
 */
router.get('/cooperativa/financial-report/:id', authenticate, (req, res) => {
    try {
        const { id } = req.params;
        const result = raiteService.getCooperativeFinancialReport(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/health
 * Health check for Raite integration
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'raite-integration',
        status: 'operational',
        timestamp: new Date().toISOString(),
        endpoints: {
            driver: [
                'POST /driver/register',
                'GET /driver/balance/:phone',
                'GET /driver/transactions/:phone'
            ],
            user: [
                'POST /user/register',
                'POST /user/topup',
                'GET /user/balance/:phone',
                'GET /user/transactions/:phone'
            ],
            trip: [
                'POST /trip/payment'
            ],
            cooperativa: [
                'GET /cooperativa/stats/:phone'
            ]
        }
    });
});

// ============================================
// USER (PASSENGER) ROUTES
// ============================================

/**
 * POST /api/raite/user/register
 * Register a new passenger user with wallet
 * @access Public
 */
router.post('/user/register', async (req, res) => {
    try {
        const { phone_number, full_name, email } = req.body;

        if (!phone_number || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'phone_number y full_name son requeridos'
            });
        }

        const result = await raiteService.registerUser({
            phone_number,
            full_name,
            email
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('[RAITE] Error registering user:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/raite/user/topup
 * Add balance to user wallet
 * @access Protected - requires JWT
 */
router.post('/user/topup', async (req, res) => {
    try {
        const {
            phone_number,
            amount,
            currency,
            payment_method,
            card_last4,
            reference
        } = req.body;

        if (!phone_number || !amount || !payment_method) {
            return res.status(400).json({
                success: false,
                error: 'phone_number, amount y payment_method son requeridos'
            });
        }

        const result = await raiteService.topUpWallet({
            phone_number,
            amount: parseFloat(amount),
            currency: currency || 'MXN',
            payment_method,
            card_last4,
            reference
        });

        res.json(result);
    } catch (error) {
        console.error('[RAITE] Error topping up wallet:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/user/balance/:phone
 * Get user wallet balance by phone number
 * @access Protected - requires JWT
 */
router.get('/user/balance/:phone', authenticate, (req, res) => {
    try {
        const { phone } = req.params;
        const result = raiteService.getUserBalance(phone);
        res.json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/raite/user/transactions/:phone
 * Get user transaction history
 * @access Protected - requires JWT
 */
router.get('/user/transactions/:phone', authenticate, (req, res) => {
    try {
        const { phone } = req.params;
        const { type, limit } = req.query;

        const result = raiteService.getUserTransactions(phone, {
            type,
            limit: limit ? parseInt(limit) : 20
        });

        res.json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

export default router;

