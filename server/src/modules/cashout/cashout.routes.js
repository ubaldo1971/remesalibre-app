import express from 'express';
import { cashoutService } from './cashout.service.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/cashout/request
 * Request a withdrawal
 * @access Private - requires JWT
 */
router.post('/request', authenticate, async (req, res) => {
    try {
        const { amount_mxn, method, destination, pin } = req.body;

        // Use authenticated user's ID from JWT
        const user_id = req.user.id;

        const result = await cashoutService.requestCashout({
            user_id,
            amount_mxn,
            method,
            destination,
            pin
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error requesting cashout:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/cashout/history
 * Get withdrawal history for authenticated user
 * @access Private - requires JWT
 */
router.get('/history', authenticate, (req, res) => {
    try {
        // Use authenticated user's ID from JWT
        const user_id = req.user.id;

        const history = cashoutService.getHistory(user_id);
        res.json({
            success: true,
            history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;

