import express from 'express';
import { qrService } from './qr.service.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/qr/generate
 * Generate a dynamic QR code for receiving payment
 * @access Private - requires JWT
 */
router.post('/generate', authenticate, (req, res) => {
    try {
        const { amount_mxn, description, ttl_seconds } = req.body;

        // Use authenticated user's ID from JWT
        const receiver_id = req.user.id;

        const result = qrService.generateQR({
            receiver_id,
            amount_mxn,
            description,
            ttl_seconds
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error generating QR:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/qr/validate
 * Validate a scanned QR code
 * @access Public - anyone can validate
 */
router.post('/validate', (req, res) => {
    try {
        const { qr_payload } = req.body;

        if (!qr_payload) {
            return res.status(400).json({
                success: false,
                message: 'QR payload is required'
            });
        }

        const result = qrService.validateQR(qr_payload);
        res.json(result);
    } catch (error) {
        console.error('Error validating QR:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/qr/pay
 * Pay a QR code
 * @access Private - requires JWT
 */
router.post('/pay', authenticate, async (req, res) => {
    try {
        const { qr_payload, amount_input, pin } = req.body;

        // Use authenticated user's ID as payer
        const payer_id = req.user.id;

        const result = await qrService.payQR({
            payer_id,
            qr_payload,
            amount_input,
            pin
        });

        res.json(result);
    } catch (error) {
        console.error('Error paying QR:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

export default router;

