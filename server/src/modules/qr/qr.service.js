import { db } from '../../services/db.service.js';
import { paymentEngineService } from '../paymentEngine/paymentEngine.service.js';
import crypto from 'crypto';

/**
 * QR Service (Pix-style Dynamic QRs)
 * 
 * Manages generation and validation of dynamic QR codes for payments.
 * Generates "Copy & Paste" payloads similar to Pix.
 */
class QrService {

    /**
     * Generate a dynamic QR code for receiving payment
     * @param {Object} params - QR parameters
     * @returns {Object} Created payment request with QR payload
     */
    generateQR(params) {
        const {
            receiver_id,
            amount_mxn,
            description,
            ttl_seconds = 300 // Default 5 minutes
        } = params;

        console.log('Generating QR for receiver:', receiver_id);
        const user = db.findUserById(receiver_id);
        console.log('User found:', user ? user.id : 'null');

        if (!user) {
            throw new Error('User not found');
        }

        // Generate a Pix-like payload string
        // Format: 000201[MERCHANT_INFO][AMOUNT][TXID]CRC16
        const payloadId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();

        const fullName = user.full_name || `${user.first_name} ${user.last_name}`;

        const qrPayload = `00020126360014MX.REMESA.APP0114${user.phone_number}520400005303484540${amount_mxn ? amount_mxn.toFixed(2) : '0.00'}5802MX5913${fullName.substring(0, 20)}6009MEXICO CITY62${payloadId.length + 4}05${payloadId}6304${timestamp.toString().substring(9)}`;

        const request = db.createPaymentRequest({
            receiver_user_id: user.id,
            receiver_phone: user.phone_number,
            amount_mxn: amount_mxn ? parseFloat(amount_mxn) : null,
            description: description || 'Transferencia QR',
            qr_payload: qrPayload,
            ttl_seconds
        });

        return {
            success: true,
            qr_code: {
                id: request.id,
                payload: request.qr_payload,
                amount: request.amount_mxn,
                expires_at: request.expires_at,
                description: request.description
            }
        };
    }

    /**
     * Decode and validate a QR payload
     * @param {string} payload - The QR string scanned
     * @returns {Object} Payment request details
     */
    validateQR(payload) {
        // In a real implementation, we would parse the EMVCo standard string.
        // For this prototype, we look up by the exact payload string.

        const request = db.paymentRequests.find(r => r.qr_payload === payload);

        if (!request) {
            return {
                valid: false,
                message: 'Código QR inválido o no encontrado'
            };
        }

        if (request.status !== 'active') {
            return {
                valid: false,
                message: 'Este código QR ya fue pagado o cancelado'
            };
        }

        if (new Date() > new Date(request.expires_at)) {
            return {
                valid: false,
                message: 'El código QR ha expirado'
            };
        }

        const receiver = db.findUserById(request.receiver_user_id);

        return {
            valid: true,
            request: {
                id: request.id,
                receiver_name: receiver ? receiver.full_name : 'Usuario Remesa',
                receiver_phone: request.receiver_phone,
                amount: request.amount_mxn,
                description: request.description,
                expires_at: request.expires_at
            }
        };
    }

    /**
     * Process payment for a QR code
     * @param {Object} params - Payment parameters
     * @returns {Promise<Object>} Transaction result
     */
    async payQR(params) {
        const {
            payer_id,
            qr_payload,
            amount_input, // Required if QR has no fixed amount
            pin
        } = params;

        // 1. Validate QR
        const validation = this.validateQR(qr_payload);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const request = db.paymentRequests.find(r => r.qr_payload === qr_payload);

        // 2. Determine Amount
        // If QR has fixed amount, use it. Otherwise use input amount.
        const amountToPayMXN = request.amount_mxn || parseFloat(amount_input);

        if (!amountToPayMXN || amountToPayMXN <= 0) {
            throw new Error('Monto inválido');
        }

        if (request.amount_mxn && Math.abs(parseFloat(amount_input) - request.amount_mxn) > 0.01) {
            throw new Error(`El monto debe ser exactamente $${request.amount_mxn} MXN`);
        }

        // 3. Prevent self-payment
        if (request.receiver_user_id === payer_id) {
            throw new Error('No puedes pagarte a ti mismo');
        }

        // 4. Execute Payment via PaymentEngine
        // Note: QR payments are typically MXN -> MXN (Domestic) or USD -> MXN
        // We assume payer pays in USD (converted) or MXN balance.
        // For this prototype, let's assume payer pays in USD and receiver gets MXN.

        const payer = db.findUserById(payer_id);

        // Calculate USD amount needed to pay the MXN amount
        // We need to reverse calculate: How much USD to send so receiver gets X MXN?
        // For simplicity in prototype: We treat it as a standard Send Money flow
        // where we specify the source amount in USD that equals the target MXN.

        // Get exchange rate to estimate USD cost
        const config = db.getSystemConfig();
        const rate = config.exchange_rate_usd_mxn * (1 - config.spread);
        const estimatedUSD = amountToPayMXN / rate;

        // Delegate to PaymentEngine
        // We send "estimatedUSD" but we need to ensure receiver gets EXACTLY amountToPayMXN.
        // The PaymentEngine currently calculates forward (USD -> MXN).
        // For now, we'll use the forward calculation with the estimated amount.
        // In a real app, we'd need a "reverse quote" feature.

        const result = await paymentEngineService.processPayment({
            sender_id: payer_id,
            recipient_phone: request.receiver_phone,
            amount: estimatedUSD, // Paying in USD
            currency: 'USD',
            note: `Pago QR: ${request.description}`,
            pin
        });

        // 5. Mark QR as paid
        db.markPaymentRequestAsPaid(request.id, payer_id);

        return {
            success: true,
            message: 'Pago realizado exitosamente',
            transaction: result.transaction,
            amount_paid_usd: estimatedUSD,
            amount_received_mxn: result.quote.target_amount
        };
    }
}

export const qrService = new QrService();
