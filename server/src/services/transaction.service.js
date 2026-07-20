import { db } from './db.service.js';
import { paymentEngineService } from '../modules/paymentEngine/paymentEngine.service.js';

class TransactionService {

    // Calculate fees and exchange rates without executing transaction
    // REFACTORED: Now delegates to PaymentEngine
    async calculateQuote(amount, currency, type = 'send') {
        if (type !== 'send') {
            // For now, only 'send' type is supported
            throw new Error('Only send type is currently supported');
        }

        const targetCurrency = currency === 'USD' ? 'MXN' : currency;
        const quote = await paymentEngineService.calculateQuote(amount, currency, targetCurrency);

        // Transform to legacy format for backward compatibility
        return {
            amount: quote.source_amount,
            currency: quote.source_currency,
            fee: quote.commission,
            exchangeRate: quote.exchange_rate_with_spread,
            amountReceived: quote.target_amount,
            totalCost: quote.source_amount
        };
    }

    // Execute the transfer
    // REFACTORED: Now delegates to PaymentEngine for complete flow
    async processTransfer(params) {
        const {
            senderId,
            recipientPhone,
            amount,
            donationAmount,
            currency,
            note,
            taxInfo // NEW
        } = params;

        try {
            const result = await paymentEngineService.processPayment({
                sender_id: senderId,
                recipient_phone: recipientPhone,
                amount: amount,
                donation_amount: donationAmount || 0,
                currency,
                note,
                taxInfo // NEW
            });

            return {
                success: result.success,
                transaction: result.transaction,
                newBalance: result.sender_new_balance
            };
        } catch (error) {
            console.error('[TransactionService] Error in processTransfer:', error);
            throw error;
        }
    }
}

export const transactionService = new TransactionService();
