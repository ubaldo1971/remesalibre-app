import express from 'express';
import * as deliveryController from './delivery.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// ==========================================
// CLIENT ROUTES (Requieren Auth)
// ==========================================
// Crear una nueva orden de envío (Cotización + Creación)
router.post('/orders', protect, deliveryController.createOrder);

// Ver mis órdenes activas
router.get('/orders/my-orders', protect, deliveryController.getMyOrders);

// ==========================================
// PUBLIC TRACKING ROUTES (Sin Auth estricta)
// ==========================================
// Obtener detalles de orden por tracking ID (Para compartir por WhatsApp)
router.get('/track/:trackingNumber', deliveryController.getPublicOrderDetails);

// ==========================================
// DRIVER ROUTES (Requieren Auth + Rol Driver)
// ==========================================
// Ver órdenes disponibles cercanas ("Radar")
router.get('/driver/available', protect, deliveryController.getAvailableOrders);

// Aceptar una orden
router.post('/driver/accept/:orderId', protect, deliveryController.acceptOrder);

// Actualizar estado (Recogido, Entregado, etc.)
router.post('/driver/status/:orderId', protect, deliveryController.updateOrderStatus);

// Subir prueba de entrega (Foto/Firma)
router.post('/driver/pod/:orderId', protect, deliveryController.submitProofOfDelivery);

// Toggle modo envíos
router.post('/driver/toggle', protect, deliveryController.toggleDeliveryMode);

export default router;
