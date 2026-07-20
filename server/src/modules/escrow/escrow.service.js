import { db } from '../../services/db.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Escrow Service
 * 
 * Maneja fondos retenidos para plataformas externas como Rentalgo.
 * El dinero queda en escrow hasta que el admin lo libera.
 */
class EscrowService {

    /**
     * Crear transacción en escrow
     * El dinero se retiene del comprador hasta confirmación
     */
    createEscrow(data) {
        const {
            order_id,
            order_type,        // 'sale' o 'rental'
            buyer_phone,
            seller_phone,
            amount,
            currency = 'MXN',
            platform_fee_percent = 0.10,
            description,
            platform = 'rentalgo'
        } = data;

        // Validar datos
        if (!order_id || !buyer_phone || !seller_phone || !amount) {
            throw new Error('Datos incompletos para crear escrow');
        }

        // Buscar usuarios
        const buyer = db.findUserByPhone(buyer_phone);
        const seller = db.findUserByPhone(seller_phone);

        if (!buyer) {
            throw new Error('Comprador no encontrado en RemesaLibre');
        }

        if (!seller) {
            // Pre-registrar vendedor si no existe
            const preRegResult = db.createPreRegisteredUser(seller_phone, buyer.id);
            console.log(`[Escrow] Vendedor pre-registrado: ${preRegResult.id}`);
        }

        const sellerUser = db.findUserByPhone(seller_phone);

        // Calcular comisión de plataforma
        const platform_fee = amount * platform_fee_percent;
        const seller_amount = amount - platform_fee;

        // Crear registro de escrow
        const escrow = {
            id: `escrow-${uuidv4()}`,
            order_id,
            order_type,
            platform,
            buyer_id: buyer.id,
            buyer_phone,
            seller_id: sellerUser.id,
            seller_phone,
            amount,
            currency,
            platform_fee_percent,
            platform_fee,
            seller_amount,
            status: 'pending',  // pending -> in_escrow -> released / refunded
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            released_at: null,
            refunded_at: null,
            admin_notes: []
        };

        // Guardar en DB (crear array si no existe)
        if (!db.escrows) {
            db.escrows = [];
        }
        db.escrows.push(escrow);
        db.saveToFile();

        return {
            success: true,
            escrow,
            message: 'Escrow creado exitosamente. Pendiente de fondeo.'
        };
    }

    /**
     * Fondear escrow (cuando el comprador paga)
     * Mueve los fondos del wallet del comprador al escrow
     */
    fundEscrow(escrow_id) {
        const escrow = this.getEscrowById(escrow_id);

        if (!escrow) {
            throw new Error('Escrow no encontrado');
        }

        if (escrow.status !== 'pending') {
            throw new Error(`Escrow no está pendiente. Estado actual: ${escrow.status}`);
        }

        // Obtener wallet del comprador
        const buyerWallet = db.getWalletByUserId(escrow.buyer_id);

        if (!buyerWallet) {
            throw new Error('Wallet del comprador no encontrado');
        }

        // Verificar fondos suficientes
        const balanceField = escrow.currency === 'MXN' ? 'balance_mxn' : 'balance_usd';
        if (buyerWallet[balanceField] < escrow.amount) {
            throw new Error('Fondos insuficientes en wallet del comprador');
        }

        // Deducir del wallet del comprador
        buyerWallet[balanceField] -= escrow.amount;
        buyerWallet.updated_at = new Date().toISOString();

        // Actualizar estado del escrow
        escrow.status = 'in_escrow';
        escrow.funded_at = new Date().toISOString();
        escrow.updated_at = new Date().toISOString();

        // Crear registro en ledger
        if (!db.ledgerEntries) {
            db.ledgerEntries = [];
        }
        db.ledgerEntries.push({
            id: `ledger-${uuidv4()}`,
            type: 'escrow_hold',
            escrow_id,
            user_id: escrow.buyer_id,
            amount: -escrow.amount,
            currency: escrow.currency,
            description: `Fondos retenidos para orden ${escrow.order_id}`,
            created_at: new Date().toISOString()
        });

        db.saveToFile();

        return {
            success: true,
            escrow,
            message: 'Escrow fondeado. Fondos retenidos hasta liberación.'
        };
    }

    /**
     * Liberar pago al vendedor
     */
    releaseEscrow(data) {
        const { escrow_id, order_id, release_type = 'full', amount_to_release, admin_note } = data;

        const escrow = this.getEscrowById(escrow_id);

        if (!escrow) {
            throw new Error('Escrow no encontrado');
        }

        if (escrow.status !== 'in_escrow') {
            throw new Error(`Escrow no puede liberarse. Estado: ${escrow.status}`);
        }

        // Obtener wallet del vendedor
        let sellerWallet = db.getWalletByUserId(escrow.seller_id);

        if (!sellerWallet) {
            // Crear wallet si no existe
            sellerWallet = {
                id: `wallet-${escrow.seller_id}`,
                user_id: escrow.seller_id,
                balance_mxn: 0,
                balance_usd: 0,
                updated_at: new Date().toISOString()
            };
            db.wallets.push(sellerWallet);
        }

        // Calcular montos
        let amountToSeller, platformFee;
        if (release_type === 'partial' && amount_to_release) {
            amountToSeller = amount_to_release * (1 - escrow.platform_fee_percent);
            platformFee = amount_to_release * escrow.platform_fee_percent;
        } else {
            amountToSeller = escrow.seller_amount;
            platformFee = escrow.platform_fee;
        }

        // Acreditar al vendedor
        const balanceField = escrow.currency === 'MXN' ? 'balance_mxn' : 'balance_usd';
        sellerWallet[balanceField] += amountToSeller;
        sellerWallet.updated_at = new Date().toISOString();

        // Actualizar escrow
        escrow.status = 'released';
        escrow.released_at = new Date().toISOString();
        escrow.updated_at = new Date().toISOString();
        escrow.amount_released = amountToSeller;
        escrow.final_platform_fee = platformFee;

        if (admin_note) {
            escrow.admin_notes.push({
                note: admin_note,
                action: 'released',
                timestamp: new Date().toISOString()
            });
        }

        // Registrar en ledger
        db.ledgerEntries.push(
            {
                id: `ledger-${uuidv4()}`,
                type: 'escrow_release',
                escrow_id,
                user_id: escrow.seller_id,
                amount: amountToSeller,
                currency: escrow.currency,
                description: `Pago liberado por orden ${escrow.order_id}`,
                created_at: new Date().toISOString()
            },
            {
                id: `ledger-${uuidv4()}`,
                type: 'platform_fee',
                escrow_id,
                user_id: 'platform',
                amount: platformFee,
                currency: escrow.currency,
                description: `Comisión de plataforma (${escrow.platform_fee_percent * 100}%)`,
                created_at: new Date().toISOString()
            }
        );

        db.saveToFile();

        return {
            success: true,
            escrow,
            seller_received: amountToSeller,
            platform_fee: platformFee,
            message: `Pago de $${amountToSeller.toFixed(2)} ${escrow.currency} liberado al vendedor.`
        };
    }

    /**
     * Reembolsar escrow al comprador
     */
    refundEscrow(data) {
        const { escrow_id, order_id, refund_type = 'full', amount_to_refund, reason } = data;

        const escrow = this.getEscrowById(escrow_id);

        if (!escrow) {
            throw new Error('Escrow no encontrado');
        }

        if (escrow.status !== 'in_escrow') {
            throw new Error(`Escrow no puede reembolsarse. Estado: ${escrow.status}`);
        }

        // Obtener wallet del comprador
        const buyerWallet = db.getWalletByUserId(escrow.buyer_id);

        if (!buyerWallet) {
            throw new Error('Wallet del comprador no encontrado');
        }

        // Calcular monto de reembolso
        let refundAmount;
        if (refund_type === 'partial' && amount_to_refund) {
            refundAmount = amount_to_refund;
        } else {
            refundAmount = escrow.amount;
        }

        // Devolver al comprador
        const balanceField = escrow.currency === 'MXN' ? 'balance_mxn' : 'balance_usd';
        buyerWallet[balanceField] += refundAmount;
        buyerWallet.updated_at = new Date().toISOString();

        // Actualizar escrow
        escrow.status = 'refunded';
        escrow.refunded_at = new Date().toISOString();
        escrow.updated_at = new Date().toISOString();
        escrow.refund_amount = refundAmount;
        escrow.refund_reason = reason;

        escrow.admin_notes.push({
            note: reason,
            action: 'refunded',
            timestamp: new Date().toISOString()
        });

        // Registrar en ledger
        db.ledgerEntries.push({
            id: `ledger-${uuidv4()}`,
            type: 'escrow_refund',
            escrow_id,
            user_id: escrow.buyer_id,
            amount: refundAmount,
            currency: escrow.currency,
            description: `Reembolso por orden ${escrow.order_id}: ${reason}`,
            created_at: new Date().toISOString()
        });

        db.saveToFile();

        return {
            success: true,
            escrow,
            refund_amount: refundAmount,
            message: `Reembolso de $${refundAmount.toFixed(2)} ${escrow.currency} procesado.`
        };
    }

    /**
     * Obtener escrow por ID
     */
    getEscrowById(escrow_id) {
        if (!db.escrows) return null;
        return db.escrows.find(e => e.id === escrow_id);
    }

    /**
     * Obtener escrow por order_id
     */
    getEscrowByOrderId(order_id) {
        if (!db.escrows) return null;
        return db.escrows.find(e => e.order_id === order_id);
    }

    /**
     * Listar escrows (para admin)
     */
    listEscrows(filters = {}) {
        if (!db.escrows) return [];

        let escrows = [...db.escrows];

        if (filters.status) {
            escrows = escrows.filter(e => e.status === filters.status);
        }

        if (filters.platform) {
            escrows = escrows.filter(e => e.platform === filters.platform);
        }

        if (filters.seller_id) {
            escrows = escrows.filter(e => e.seller_id === filters.seller_id);
        }

        if (filters.buyer_id) {
            escrows = escrows.filter(e => e.buyer_id === filters.buyer_id);
        }

        // Ordenar por fecha
        escrows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return escrows;
    }

    /**
     * Obtener estadísticas de escrow
     */
    getStats() {
        if (!db.escrows) {
            return {
                total: 0,
                pending: 0,
                in_escrow: 0,
                released: 0,
                refunded: 0,
                total_volume: 0,
                total_fees: 0
            };
        }

        const stats = {
            total: db.escrows.length,
            pending: db.escrows.filter(e => e.status === 'pending').length,
            in_escrow: db.escrows.filter(e => e.status === 'in_escrow').length,
            released: db.escrows.filter(e => e.status === 'released').length,
            refunded: db.escrows.filter(e => e.status === 'refunded').length,
            total_volume: db.escrows.reduce((sum, e) => sum + e.amount, 0),
            total_fees: db.escrows
                .filter(e => e.status === 'released')
                .reduce((sum, e) => sum + (e.final_platform_fee || 0), 0)
        };

        return stats;
    }
}

export const escrowService = new EscrowService();
