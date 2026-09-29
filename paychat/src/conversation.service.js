import { randomUUID } from 'node:crypto';

import { parsePaychatMessage } from './intentParser.js';

const fail = (message, code, statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    throw error;
};

const requireAuthorization = authorization => {
    if (!authorization?.startsWith('Bearer ')) {
        fail('Authentication is required', 'AUTHORIZATION_REQUIRED', 401);
    }
};

export const createPaychatConversationService = ({
    coreClient,
    idGenerator = () => randomUUID(),
}) => {
    const sessions = new Map();

    return {
        async handle(request) {
            const sessionId = request.sessionId || idGenerator();

            if (request.action === 'confirm') {
                requireAuthorization(request.authorization);
                const session = sessions.get(sessionId);
                if (!session) fail('PayChat session not found', 'PAYCHAT_SESSION_NOT_FOUND', 404);

                const response = await coreClient.confirmPaymentIntent({
                    authorization: request.authorization,
                    intentId: session.intentId,
                    idempotencyKey: `${sessionId}:confirm:1`,
                    confirmationToken: session.confirmationToken,
                });
                sessions.delete(sessionId);
                return {
                    sessionId,
                    message: 'Operación simulada correctamente. NO ES DINERO REAL.',
                    action: null,
                    receipt: {
                        intentId: response.data.id,
                        status: response.data.status,
                        folio: response.data.provider.reference,
                        simulation: true,
                    },
                    simulation: true,
                };
            }

            if (request.action === 'cancel') {
                requireAuthorization(request.authorization);
                const session = sessions.get(sessionId);
                if (!session) fail('PayChat session not found', 'PAYCHAT_SESSION_NOT_FOUND', 404);

                const response = await coreClient.cancelPaymentIntent({
                    authorization: request.authorization,
                    intentId: session.intentId,
                    idempotencyKey: `${sessionId}:cancel:1`,
                });
                sessions.delete(sessionId);
                return {
                    sessionId,
                    message: 'Operación simulada cancelada.',
                    action: null,
                    cancelled: {
                        intentId: response.data.id,
                        status: response.data.status,
                        simulation: true,
                    },
                    simulation: true,
                };
            }

            const parsed = parsePaychatMessage(request.message);
            if (parsed.intent !== 'send_payment') {
                return {
                    sessionId,
                    message: 'Puedo ayudarte con: “Paga 250 pesos a María por comida”.',
                    action: null,
                    simulation: true,
                };
            }
            if (parsed.missing.length > 0) {
                return {
                    sessionId,
                    message: 'Indica el monto y destinatario, por ejemplo: “Paga 250 pesos a María”.',
                    action: null,
                    simulation: true,
                };
            }

            requireAuthorization(request.authorization);
            const response = await coreClient.createPaymentIntent({
                authorization: request.authorization,
                idempotencyKey: `${sessionId}:create:1`,
                ...parsed.slots,
                channel: 'paychat_web',
            });
            sessions.set(sessionId, {
                intentId: response.data.id,
                confirmationToken: response.confirmationToken,
            });

            return {
                sessionId,
                message: `Encontré a ${response.data.recipient.displayName}. ¿Confirmas esta simulación?`,
                payment: {
                    recipient: response.data.recipient.displayName,
                    maskedPhone: response.data.recipient.maskedPhone,
                    amountInMinorUnits: response.data.quote.amount.value,
                    currency: response.data.quote.amount.currency,
                    feeInMinorUnits: response.data.quote.fee.value,
                    concept: response.data.concept,
                },
                action: {
                    type: 'confirm_payment',
                    intentId: response.data.id,
                },
                simulation: true,
            };
        },
    };
};
