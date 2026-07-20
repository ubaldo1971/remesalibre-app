import * as deliveryService from './delivery.service.js';
import { io } from '../../server.js';

// Crear Orden
export const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const orderData = req.body;

        const order = await deliveryService.createDeliveryOrder(userId, orderData);

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Obtener detalles públicos (Tracking)
export const getPublicOrderDetails = async (req, res, next) => {
    try {
        const { trackingNumber } = req.params;
        const order = await deliveryService.getOrderByTracking(trackingNumber);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        // Filtrar datos sensibles para vista pública
        const publicData = {
            trackingNumber: order.tracking_number,
            status: order.status,
            orderType: order.order_type,
            pickup: {
                address: order.pickup_location.address, // Solo dirección general, no nombre/teléfono si es sensible
                lat: order.pickup_location.lat,
                lng: order.pickup_location.lng
            },
            dropoff: {
                address: order.dropoff_location.address,
                lat: order.dropoff_location.lat,
                lng: order.dropoff_location.lng
            },
            driver: order.driver ? {
                name: order.driver.first_name, // Suponiendo join
                vehicle: order.driver.vehicle_type,
                location: { lat: order.driver.current_lat, lng: order.driver.current_lng } // Ubicación real-time inicial
            } : null,
            estimatedTime: '15 min' // Mock, calcular real
        };

        res.json({ success: true, data: publicData });
    } catch (error) {
        next(error);
    }
};

export const getMyOrders = async (req, res, next) => {
    try {
        const orders = await deliveryService.getUserOrders(req.user.id);
        res.json({ success: true, data: orders });
    } catch (error) { next(error); }
};

export const getAvailableOrders = async (req, res, next) => {
    try {
        // En un futuro: filtrar por ubicación del driver (lat/lng)
        const orders = await deliveryService.getPendingOrders();
        res.json({ success: true, data: orders });
    } catch (error) { next(error); }
};

export const acceptOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const driverId = req.user.id; // Asumiendo que el usuario es driver

        const order = await deliveryService.assignDriver(orderId, driverId);

        // Notificar al cliente via Socket
        io.to(`tracking_order_${order.tracking_number}`).emit('order_status_updated', {
            status: 'assigned',
            driverId,
            description: 'Conductor asignado y en camino'
        });

        res.json({ success: true, data: order });
    } catch (error) { next(error); }
};

export const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, location } = req.body;

        const order = await deliveryService.updateStatus(orderId, status, location);

        // Notificar actualización
        io.to(`tracking_order_${order.tracking_number}`).emit('order_status_updated', {
            status,
            updatedAt: new Date()
        });

        res.json({ success: true, data: order });
    } catch (error) { next(error); }
};

export const submitProofOfDelivery = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { photoUrl, signature, receiverName } = req.body;

        const result = await deliveryService.completeDelivery(orderId, { photoUrl, signature, receiverName });

        io.to(`tracking_order_${result.tracking_number}`).emit('order_status_updated', {
            status: 'delivered',
            proof: true
        });

        res.json({ success: true, data: result });
    } catch (error) { next(error); }
};

export const toggleDeliveryMode = async (req, res, next) => {
    try {
        const driverId = req.user.id;
        const { enabled } = req.body;
        const status = await deliveryService.setDriverDeliveryMode(driverId, enabled);
        res.json({ success: true, enabled: status });
    } catch (error) { next(error); }
};
