import express from 'express';
import { escrowService } from './escrow.service.js';

const router = express.Router();

/**
 * Escrow Routes
 * 
 * API para gestionar fondos retenidos para plataformas externas.
 */

/**
 * POST /api/escrow/create
 * Crear nuevo escrow para una orden
 */
router.post('/create', (req, res) => {
    try {
        const result = escrowService.createEscrow(req.body);
        res.json(result);
    } catch (error) {
        console.error('[Escrow] Error creating:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/escrow/fund
 * Fondear escrow (mover fondos del comprador al escrow)
 */
router.post('/fund', (req, res) => {
    try {
        const { escrow_id } = req.body;

        if (!escrow_id) {
            return res.status(400).json({
                success: false,
                error: 'escrow_id es requerido'
            });
        }

        const result = escrowService.fundEscrow(escrow_id);
        res.json(result);
    } catch (error) {
        console.error('[Escrow] Error funding:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/escrow/release
 * Liberar pago al vendedor
 */
router.post('/release', (req, res) => {
    try {
        const { escrow_id, order_id, release_type, amount_to_release, admin_note } = req.body;

        if (!escrow_id) {
            return res.status(400).json({
                success: false,
                error: 'escrow_id es requerido'
            });
        }

        const result = escrowService.releaseEscrow({
            escrow_id,
            order_id,
            release_type,
            amount_to_release,
            admin_note
        });
        res.json(result);
    } catch (error) {
        console.error('[Escrow] Error releasing:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/escrow/refund
 * Reembolsar al comprador
 */
router.post('/refund', (req, res) => {
    try {
        const { escrow_id, order_id, refund_type, amount_to_refund, reason } = req.body;

        if (!escrow_id) {
            return res.status(400).json({
                success: false,
                error: 'escrow_id es requerido'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'reason es requerido para reembolsos'
            });
        }

        const result = escrowService.refundEscrow({
            escrow_id,
            order_id,
            refund_type,
            amount_to_refund,
            reason
        });
        res.json(result);
    } catch (error) {
        console.error('[Escrow] Error refunding:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/escrow/:id
 * Obtener estado de un escrow
 */
router.get('/:id', (req, res) => {
    try {
        const escrow = escrowService.getEscrowById(req.params.id);

        if (!escrow) {
            return res.status(404).json({
                success: false,
                error: 'Escrow no encontrado'
            });
        }

        res.json({ success: true, escrow });
    } catch (error) {
        console.error('[Escrow] Error getting:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/escrow/order/:orderId
 * Obtener escrow por order_id
 */
router.get('/order/:orderId', (req, res) => {
    try {
        const escrow = escrowService.getEscrowByOrderId(req.params.orderId);

        if (!escrow) {
            return res.status(404).json({
                success: false,
                error: 'Escrow no encontrado para esta orden'
            });
        }

        res.json({ success: true, escrow });
    } catch (error) {
        console.error('[Escrow] Error getting by order:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/escrow/list
 * Listar escrows con filtros (admin)
 */
router.get('/list', (req, res) => {
    try {
        const { status, platform, seller_id, buyer_id } = req.query;

        const escrows = escrowService.listEscrows({
            status,
            platform,
            seller_id,
            buyer_id
        });

        res.json({
            success: true,
            escrows,
            count: escrows.length
        });
    } catch (error) {
        console.error('[Escrow] Error listing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/escrow/stats
 * Obtener estadísticas de escrow (admin)
 */
router.get('/stats', (req, res) => {
    try {
        const stats = escrowService.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('[Escrow] Error getting stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
