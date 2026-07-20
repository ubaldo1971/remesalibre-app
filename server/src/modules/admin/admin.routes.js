import express from 'express';
import { adminService } from './admin.service.js';

const router = express.Router();

// Middleware to check admin privileges (Placeholder)
const requireAdmin = (req, res, next) => {
    // In production: Check JWT role === 'admin'
    // For prototype: Allow all
    next();
};

/**
 * GET /api/admin/config
 * Get system configuration
 */
router.get('/config', requireAdmin, (req, res) => {
    try {
        const config = adminService.getConfig();
        res.json({
            success: true,
            config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * PUT /api/admin/config
 * Update system configuration
 */
router.put('/config', requireAdmin, (req, res) => {
    try {
        const updates = req.body;
        const config = adminService.updateConfig(updates);
        res.json({
            success: true,
            message: 'Configuration updated',
            config
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/admin/stats
 * Get system statistics
 */
router.get('/stats', requireAdmin, (req, res) => {
    try {
        const { from, to } = req.query;
        const stats = adminService.getStats({ from, to });
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/admin/security-logs
 * Get security audit logs
 */
router.get('/security-logs', requireAdmin, (req, res) => {
    try {
        const { limit } = req.query;
        const logs = adminService.getSecurityLogs(limit ? parseInt(limit) : 50);
        res.json({
            success: true,
            logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;
