import { db } from '../../services/db.service.js';
import { usdcContract } from '../../blockchain/usdc.contract.js';
import { pesoToken } from '../../blockchain/peso.contract.js';
import { remesaSwap } from '../../blockchain/remesaSwap.contract.js';
import { userDirectoryService } from '../userDirectory/userDirectory.service.js';

/**
 * Payment Engine Service (SPI Module)
 * 
 * Central payment processor for RemesaLibre.
 * Handles the complete flow: USDC → $PESO → MXN
 * Similar to Brazil's Pix SPI (Sistema de Pagamentos Instantâneos)
 */
class PaymentEngineService {

    /**
     * Get current exchange rate (USD to MXN)
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate() {
        const config = db.getSystemConfig();

        // In production, this would call a real oracle (Chainlink, CoinGecko, etc.)
        if (!config.exchange_rate_manual_override) {
            // PLACEHOLDER: Call external API
            console.log('[ORACLE] Fetching live USD/MXN rate...');
            // const rate = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            // return rate.rates.MXN;
        }

        // Use configured rate
        return config.exchange_rate_usd_mxn;
    }

    /**
     * Calculate comprehensive quote for a remittance
     * @param {number} amount - Amount in source currency
     * @param {string} sourceCurrency - 'USD' or 'MXN'
     * @param {string} targetCurrency - 'MXN' or 'USD'
     * @returns {Promise<Object>} Detailed quote
     */
    async calculateQuote(amount, sourceCurrency = 'USD', targetCurrency = 'MXN') {
        const config = db.getSystemConfig();
        const exchangeRate = await this.getExchangeRate();

        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) {
            throw new Error('Invalid amount');
        }

        // Validate limits
        if (sourceCurrency === 'USD') {
            if (amountNum < config.min_transaction_usd) {
                throw new Error(`Minimum transaction amount is $${config.min_transaction_usd} USD`);
            }
            if (amountNum > config.max_transaction_usd) {
                throw new Error(`Maximum transaction amount is $${config.max_transaction_usd} USD`);
            }
        }

        let quote = {};

        if (sourceCurrency === 'USD' && targetCurrency === 'MXN') {
            // USDC → MXN flow
            const commissionUSD = amountNum * config.commission_rate;
            const amountAfterCommission = amountNum - commissionUSD;

            // Apply spread to exchange rate
            const spreadAdjustedRate = exchangeRate * (1 - config.spread);
            const amountMXN = amountAfterCommission * spreadAdjustedRate;

            quote = {
                source_amount: amountNum,
                source_currency: 'USD',
                target_amount: parseFloat(amountMXN.toFixed(2)),
                target_currency: targetCurrency,
                exchange_rate: exchangeRate,
                exchange_rate_with_spread: parseFloat(spreadAdjustedRate.toFixed(4)),
                commission: parseFloat(commissionUSD.toFixed(2)),
                commission_percentage: config.commission_rate * 100,
                spread: parseFloat((exchangeRate - spreadAdjustedRate).toFixed(4)),
                spread_percentage: config.spread * 100,
                total_cost_usd: amountNum,
                breakdown: {
                    step1: `${amountNum} USD → ${amountAfterCommission.toFixed(2)} USD (Commission: ${commissionUSD.toFixed(2)})`,
                    step2: `${amountAfterCommission.toFixed(2)} USD → ${amountMXN.toFixed(2)} MXN (Rate: ${spreadAdjustedRate.toFixed(4)})`
                }
            };
        } else {
            // Domestic MXN → MXN
            const commission = amountNum * config.commission_rate;
            const amountReceived = amountNum - commission;

            quote = {
                source_amount: amountNum,
                source_currency: 'MXN',
                target_amount: parseFloat(amountReceived.toFixed(2)),
                target_currency: 'MXN',
                exchange_rate: 1,
                exchange_rate_with_spread: 1,
                commission: parseFloat(commission.toFixed(2)),
                commission_percentage: config.commission_rate * 100,
                spread: 0,
                spread_percentage: 0,
                total_cost_mxn: amountNum
            };
        }

        return quote;
    }

    /**
     * Process a complete payment/remittance
     * @param {Object} params - Payment parameters
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(params) {
        const {
            sender_id,
            sender_phone,
            recipient_phone,
            amount,
            donation_amount = 0,
            currency = 'USD',
            note = '',
            taxInfo = null, // NEW: Tax info for CFDI
            pin = null
        } = params;

        console.log('\n========== PROCESSING PAYMENT ==========');
        console.log(`Sender: ${sender_phone || sender_id}`);
        console.log(`Recipient: ${recipient_phone}`);
        console.log(`Amount: ${amount} ${currency}`);
        if (donation_amount > 0) console.log(`Donation: ${donation_amount} USD`);
        console.log('========================================\n');

        try {
            // Step 1: Validate sender
            const sender = sender_phone ?
                db.findUserByPhone(sender_phone) :
                db.findUserById(sender_id);

            if (!sender) {
                throw new Error('Sender not found');
            }

            // Check if sender's PIN is blocked (security)
            if (db.isPINBlocked(sender.id)) {
                throw new Error('Account temporarily locked due to failed PIN attempts');
            }

            // Step 2: Find or create recipient
            let recipient = db.findUserByPhone(recipient_phone);

            if (!recipient) {
                console.log(`[PAYMENT] Recipient ${recipient_phone} not found. Creating pre-registration...`);
                const preReg = await userDirectoryService.preRegister(recipient_phone, sender.id);
                recipient = preReg.user;
            }

            // Step 3: Get quote
            const quote = await this.calculateQuote(amount, currency, currency === 'USD' ? 'MXN' : currency);

            // Step 4: Verify sender has sufficient balance (including donation)
            const senderWallet = db.getWalletByUserId(sender.id);
            if (!senderWallet) {
                throw new Error('Sender wallet not found');
            }

            const balanceKey = `balance_${currency.toLowerCase()}`;

            // Force strict numeric types to avoid string concatenation errors
            const numericAmount = parseFloat(quote.source_amount);
            const numericFee = parseFloat(quote.commission || 0);
            const numericDonation = parseFloat(donation_amount || 0);

            // Correctly calculate total debit: Amount + Commission + Donation
            let totalCostInSenderCurrency = currency === 'USD'
                ? (numericAmount + numericFee + numericDonation)
                : (numericAmount + numericFee);

            // AUTO-CONVERSION LOGIC
            let deductionCurrency = currency;
            let deductionAmount = totalCostInSenderCurrency;
            const EXCHANGE_RATE = 17.50; // Manual fallback rate

            if ((senderWallet[balanceKey] || 0) < totalCostInSenderCurrency) {
                // Try fallback to other currency if applicable
                if (currency === 'USD') {
                    // Check if MXN covers it
                    const CostInMXN = totalCostInSenderCurrency * EXCHANGE_RATE;
                    if ((senderWallet.balance_mxn || 0) >= CostInMXN) {
                        console.log(`[PAYMENT] Auto-converting MXN to cover USD transaction. Deducting ${CostInMXN} MXN.`);
                        deductionCurrency = 'MXN';
                        deductionAmount = CostInMXN;
                    } else {
                        console.warn(`[PAYMENT] Insufficient balance for user ${sender.id}. Required: ${totalCostInSenderCurrency} USD or ${CostInMXN} MXN`);
                        throw new Error('Insufficient balance');
                    }
                } else {
                    console.warn(`[PAYMENT] Insufficient balance for user ${sender.id}.`);
                    throw new Error('Insufficient balance');
                }
            }

            // Step 5: CHECK DAILY LIMITS
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayTransactions = db.transactions.filter(tx =>
                tx.sender_id === sender.id &&
                new Date(tx.created_at) >= todayStart &&
                tx.status === 'completed'
            );

            const todayTotal = todayTransactions.reduce((sum, tx) => sum + (tx.amount_original || 0), 0);

            if (currency === 'USD' && (todayTotal + amount + donation_amount) > sender.daily_limit_usd) {
                throw new Error(`Daily limit exceeded. Limit: $${sender.daily_limit_usd} USD`);
            }

            // Step 6: Execute blockchain flow (SIMULATED)
            let blockchainResult = null;
            if (currency === 'USD') {
                console.log('[BLOCKCHAIN] Starting USDC → $PESO → MXN flow...');
                blockchainResult = await remesaSwap.executeRemittance(
                    `sender_${sender.id}`,
                    `receiver_${recipient.id}`,
                    amount,
                    quote.exchange_rate
                );

                // If donation, simulate USDC transfer to donation wallet
                if (donation_amount > 0) {
                    console.log(`[BLOCKCHAIN] Transferring ${donation_amount} USDC to donation wallet...`);
                    // usdcContract.transfer(donationWalletAddress, donation_amount)
                }
                console.log('[BLOCKCHAIN] Flow completed successfully!');
            }

            // Process Fiscal Event Simulation
            let fiscalEvent = null;
            if (donation_amount > 0 && taxInfo?.wantsReceipt) {
                console.log('[FISCAL] Generating independent fiscal event for donation...');
                const exchangeRate = await this.getExchangeRate();

                fiscalEvent = {
                    event_type: 'DONATION_CFDI',
                    issuer: 'Fundación Aliada A.C.',
                    receiver_name: taxInfo.name,
                    receiver_country: taxInfo.country,
                    receiver_rfc: taxInfo.country === 'Mexico' ? taxInfo.rfc : 'XEXX010101000', // Generic foreign RFC
                    currency: 'USD',
                    exchange_rate: exchangeRate,
                    amount_usd: donation_amount,
                    amount_mxn: parseFloat((donation_amount * exchangeRate).toFixed(2)),
                    tax_details: {
                        iva_rate: 0,
                        isr_rate: 0,
                        use_cfdi: 'D04' // Donativos
                    },
                    status: 'generated',
                    delivery_channel: 'phone',
                    delivery_target: sender_phone || sender.phone_number
                };

                console.log(`[FISCAL] CFDI generated for ${taxInfo.name} (${fiscalEvent.receiver_rfc})`);
                console.log(`[FISCAL] Receipt sent to: ${fiscalEvent.delivery_target}`);
            }

            // Step 7: Create transaction record
            const transaction = db.createTransaction({
                sender_id: sender.id,
                receiver_id: recipient.id,
                type: 'remittance',
                amount_original: amount,
                donation_amount: donation_amount,
                currency_original: currency,
                amount_converted: quote.target_amount,
                currency_converted: quote.target_currency,
                exchange_rate: quote.exchange_rate_with_spread,
                commission: quote.commission,
                spread: quote.spread,
                description: note || `Remesa a ${recipient.full_name}`,
                metadata: {
                    quote,
                    blockchain_result: blockchainResult,
                    donation_amount,
                    fiscal_event: fiscalEvent,
                    tax_info: taxInfo,
                    auto_conversion: deductionCurrency !== currency // Flag conversion
                }
            });

            // Step 8: Update ledger (double-entry bookkeeping)

            // Debit sender (Transfer + Donation)
            // Use calculated deductionCurrency and deductionAmount
            const senderBalanceKey = `balance_${deductionCurrency.toLowerCase()}`;
            db.updateWalletBalance(sender.id, deductionCurrency, -deductionAmount);
            db.createLedgerEntry({
                transaction_id: transaction.id,
                account_type: 'user_wallet',
                account_id: sender.id,
                debit: deductionAmount,
                credit: 0,
                currency: deductionCurrency,
                balance_after: senderWallet[senderBalanceKey] // Note: This might be stale if updated in-memory only, but assumes synchronous db update
            });

            // Credit donation wallet if applicable
            if (donation_amount > 0) {
                const adminConfig = db.getAdminConfig();
                adminConfig.totalDonationsUSDC = (adminConfig.totalDonationsUSDC || 0) + donation_amount;

                db.createLedgerEntry({
                    transaction_id: transaction.id,
                    account_type: 'donations',
                    account_id: 'charity_vault',
                    debit: 0,
                    credit: donation_amount,
                    currency: 'USD'
                });
            }

            // Credit system fees
            if (quote.commission > 0) {
                db.updateWalletBalance('system', currency, quote.commission);
                db.createLedgerEntry({
                    transaction_id: transaction.id,
                    account_type: 'fees',
                    account_id: 'system',
                    debit: 0,
                    credit: quote.commission,
                    currency: currency
                });
            }

            // Credit recipient
            const recipientWallet = db.getWalletByUserId(recipient.id);
            const targetBalanceKey = `balance_${quote.target_currency.toLowerCase()}`;

            db.updateWalletBalance(recipient.id, quote.target_currency, quote.target_amount);
            db.createLedgerEntry({
                transaction_id: transaction.id,
                account_type: 'user_wallet',
                account_id: recipient.id,
                debit: 0,
                credit: quote.target_amount,
                currency: quote.target_currency,
                balance_after: recipientWallet[targetBalanceKey]
            });

            // Step 9: Complete transaction
            db.updateTransactionStatus(transaction.id, 'completed');

            // Step 10: Send notifications (PLACEHOLDER)
            await this.sendNotifications(sender, recipient, transaction, quote);

            console.log('\n========== PAYMENT SUCCESSFUL ==========');
            console.log(`Transaction ID: ${transaction.id}`);
            console.log(`Sender paid: ${totalCostInSenderCurrency} ${currency} (Transfer: ${amount}, Donation: ${donation_amount})`);
            console.log(`Recipient received: ${quote.target_amount} ${quote.target_currency}`);
            console.log(`Fees collected: ${quote.commission} ${currency}`);
            console.log('========================================\n');

            return {
                success: true,
                transaction,
                quote,
                sender_new_balance: senderWallet[balanceKey],
                recipient_new_balance: recipientWallet[targetBalanceKey],
                recipient_is_new: recipient.status === 'pre_registered'
            };

        } catch (error) {
            console.error('[PAYMENT] Error processing payment:', error);
            throw error;
        }
    }

    /**
     * Send notifications to sender and recipient
     * @private
     */
    async sendNotifications(sender, recipient, transaction, quote) {
        const senderPhone = sender.phone_number || sender.phone;
        const recipientPhone = recipient.phone_number || recipient.phone;

        console.log('\n--- SIMULATED WHATSAPP NOTIFICATIONS ---');

        // Notification to Sender
        console.log(`[WhatsApp to ${senderPhone}] 📤`);
        console.log(`¡Hola ${sender.full_name || 'Usuario'}! Tu remesa por ${transaction.amount_original} ${transaction.currency_original} ha sido enviada con éxito.`);
        console.log(`Detalles: Recibe ${transaction.amount_converted} ${transaction.currency_converted}.`);
        if (transaction.donation_amount > 0) {
            console.log(`❤️ ¡Gracias por tu donación de $${transaction.donation_amount} USD! Juntos hacemos el cambio.`);
        }
        console.log(`ID de operación: ${transaction.id}`);

        console.log('---------------------------------------');

        // Notification to Recipient
        console.log(`[WhatsApp to ${recipientPhone}] 📥`);
        console.log(`¡Buenas noticias! Has recibido una remesa de ${sender.full_name || 'un familiar'}.`);
        console.log(`Monto: ${transaction.amount_converted} ${transaction.currency_converted}.`);
        if (transaction.description && transaction.description !== 'Remittance') {
            console.log(`Nota: "${transaction.description}"`);
        }
        console.log(`Tus fondos ya están disponibles en tu billetera RemesaLibre.`);
        console.log('---------------------------------------\n');

        // Emit Socket.io event for real-time UI updates
        if (global.io) {
            global.io.to(`user_${recipient.id}`).emit('transaction_received', {
                transaction,
                message: `Has recibido ${transaction.amount_converted} ${transaction.currency_converted}`
            });
        }
    }

    /**
     * Get transaction history for a user
     * @param {string} userId - User ID
     * @param {Object} filters - Optional filters
     * @returns {Array} Transactions
     */
    getTransactionHistory(userId, filters = {}) {
        let transactions = db.transactions.filter(tx =>
            tx.sender_id === userId || tx.receiver_id === userId
        );

        // Apply filters
        if (filters.type) {
            transactions = transactions.filter(tx => tx.type === filters.type);
        }

        if (filters.status) {
            transactions = transactions.filter(tx => tx.status === filters.status);
        }

        if (filters.from_date) {
            transactions = transactions.filter(tx =>
                new Date(tx.created_at) >= new Date(filters.from_date)
            );
        }

        if (filters.to_date) {
            transactions = transactions.filter(tx =>
                new Date(tx.created_at) <= new Date(filters.to_date)
            );
        }

        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return transactions;
    }
}

export const paymentEngineService = new PaymentEngineService();
