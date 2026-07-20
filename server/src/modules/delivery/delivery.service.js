import crypto from 'crypto';
import { db } from '../../services/db.service.js';

// Simulando tablas adicionales en memoria (en producción irían a Postgres)
const deliveryOrders = [];
const deliveryDrivers = []; // { driverId, userId, isActive, ... }
const deliveryPricing = {
    baseFeePoints: { small: 35, medium: 45, large: 60 },
    pricePerKm: 8,
    platformFeePercent: 0.25
};

class DeliveryService {

    // ==========================================
    // ORDER MANAGEMENT
    // ==========================================

    async createDeliveryOrder(userId, orderData) {
        // 1. Calcular precio
        const { pickup, dropoff, packageSize, description } = orderData;

        // Mock de distancia (debería llamar a Google Maps API)
        const distanceKm = this.calculateDistance(pickup, dropoff) || 5.0;

        const baseFee = deliveryPricing.baseFeePoints[packageSize] || 45;
        const distanceFee = distanceKm * deliveryPricing.pricePerKm;
        const totalPrice = baseFee + distanceFee;

        const driverEarnings = totalPrice * (1 - deliveryPricing.platformFeePercent);
        const platformFee = totalPrice * deliveryPricing.platformFeePercent;

        // 2. Crear Orden
        const order = {
            id: crypto.randomUUID(),
            tracking_number: `RTE-${Math.floor(1000 + Math.random() * 90000)}`, // RTE-5839
            customer_id: userId,
            driver_id: null,
            status: 'created', // created, assigned, picked_up, delivered
            order_type: 'on_demand',

            // Details
            package_size: packageSize,
            description,
            pickup_location: pickup, // { lat, lng, address }
            dropoff_location: dropoff,

            // Financials
            base_fee: baseFee,
            distance_km: distanceKm,
            total_price: parseFloat(totalPrice.toFixed(2)),
            driver_earnings: parseFloat(driverEarnings.toFixed(2)),
            platform_fee: parseFloat(platformFee.toFixed(2)),

            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        deliveryOrders.push(order);
        // Persistir en JSON si fuera necesario (aquí es memoria volátil para MVP rápido)

        return order;
    }

    async getOrderByTracking(trackingNumber) {
        return deliveryOrders.find(o => o.tracking_number === trackingNumber);
    }

    async getUserOrders(userId) {
        return deliveryOrders.filter(o => o.customer_id === userId).reverse();
    }

    // ==========================================
    // DRIVER LOGIC
    // ==========================================

    async getPendingOrders() {
        return deliveryOrders.filter(o => o.status === 'created');
    }

    async assignDriver(orderId, driverId) {
        const order = deliveryOrders.find(o => o.id === orderId);
        if (!order) throw new Error('Orden no encontrada');
        if (order.status !== 'created') throw new Error('Orden ya no está disponible');

        // Buscar información del conductor
        const driverUser = db.findUserById(driverId);

        order.driver_id = driverId;
        order.driver = { // Snapshot para tracking rápido
            first_name: driverUser?.first_name || 'Conductor',
            current_lat: 0, // Mock
            current_lng: 0
        };
        order.status = 'assigned';
        order.assigned_at = new Date().toISOString();

        return order;
    }

    async updateStatus(orderId, status, location) {
        const order = deliveryOrders.find(o => o.id === orderId);
        if (!order) throw new Error('Orden no encontrada');

        order.status = status;
        order.updated_at = new Date().toISOString();

        if (location && order.driver) {
            order.driver.current_lat = location.lat;
            order.driver.current_lng = location.lng;
        }

        if (status === 'picked_up') order.picked_up_at = new Date().toISOString();
        if (status === 'delivered') order.delivered_at = new Date().toISOString();

        return order;
    }

    async completeDelivery(orderId, proofData) {
        const order = deliveryOrders.find(o => o.id === orderId);
        if (!order) throw new Error('Orden no encontrada');

        order.status = 'delivered';
        order.proof = proofData; // { photoUrl, signature }
        order.delivered_at = new Date().toISOString();

        // AQUÍ SE DEBERÍA PROCESAR EL PAGO AL CONDUCTOR
        // db.updateWallet(order.driver_id, { credit: order.driver_earnings })

        return order;
    }

    // ==========================================
    // HELPERS
    // ==========================================

    // Fórmula Haversine simple para distancia línea recta (Mock)
    calculateDistance(loc1, loc2) {
        if (!loc1 || !loc2) return 5;
        const R = 6371; // Radio tierra km
        const dLat = this.deg2rad(loc2.lat - loc1.lat);
        const dLon = this.deg2rad(loc2.lng - loc1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(loc1.lat)) * Math.cos(this.deg2rad(loc2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return parseFloat(d.toFixed(1));
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

export const deliveryService = new DeliveryService();
export { deliveryOrders }; // Exportar para debug si es necesario
