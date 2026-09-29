import { createHmac, timingSafeEqual } from 'node:crypto';

const fail = (message, code, statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
};

const verifySignature = (rawBody, signature, secret) => {
    const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    const suppliedBuffer = Buffer.from(signature || '');
    const expectedBuffer = Buffer.from(expected);
    return suppliedBuffer.length === expectedBuffer.length
        && timingSafeEqual(suppliedBuffer, expectedBuffer);
};

const extractMessage = payload => payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || null;

const parseInbound = message => {
    if (message.type === 'text' && message.text?.body) {
        return { message: message.text.body.trim() };
    }

    const buttonId = message.interactive?.button_reply?.id;
    if (message.type === 'interactive' && buttonId) {
        const [action, sessionId] = buttonId.split(':');
        if (!['confirm', 'cancel'].includes(action) || !sessionId) {
            throw fail('Unsupported WhatsApp action', 'UNSUPPORTED_WHATSAPP_ACTION');
        }
        return { action, sessionId };
    }

    throw fail('Only text and confirmation buttons are supported', 'UNSUPPORTED_WHATSAPP_MESSAGE');
};

const formatSummary = response => {
    if (!response.payment) return response.message;
    const amount = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: response.payment.currency,
    }).format(response.payment.amountInMinorUnits / 100);
    const fee = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: response.payment.currency,
    }).format(response.payment.feeInMinorUnits / 100);
    return [
        response.message,
        '',
        `Destinataria: ${response.payment.recipient}`,
        `Teléfono: ${response.payment.maskedPhone}`,
        `Monto: ${amount}`,
        `Concepto: ${response.payment.concept}`,
        `Comisión: ${fee}`,
        '',
        '🧪 SIMULACIÓN — NO ES DINERO REAL',
    ].join('\n');
};

const formatTerminalMessage = response => {
    if (response.receipt) {
        return [
            response.message,
            `Folio: ${response.receipt.folio}`,
            `Estado: ${response.receipt.status}`,
            '🧪 SIMULACIÓN — NO ES DINERO REAL',
        ].join('\n');
    }
    return `${response.message}\n🧪 SIMULACIÓN — NO ES DINERO REAL`;
};

export const createWhatsAppAdapter = ({
    appSecret,
    identityService,
    conversationService,
    outboundTransport,
    beneficiaryDirectory = { resolveChannelRecipient: () => null },
}) => {
    if (!appSecret) throw new Error('WhatsApp app secret is required');

    const deliveries = new Map();
    const channelSessions = new Map();

    const processMessage = async message => {
        const from = message.from;
        if (!from) throw fail('WhatsApp sender is required', 'INVALID_WHATSAPP_EVENT');

        const authorization = await identityService.getAuthorization(from);
        const inbound = parseInbound(message);
        const currentSession = channelSessions.get(from);

        if (inbound.action && currentSession?.sessionId !== inbound.sessionId) {
            throw fail('Confirmation does not belong to this channel session', 'CHANNEL_SESSION_MISMATCH', 403);
        }

        const response = await conversationService.handle({
            authorization,
            ...(inbound.message ? { message: inbound.message } : {}),
            ...(inbound.action ? { sessionId: inbound.sessionId, action: inbound.action } : {}),
        });

        if (response.action?.type === 'confirm_payment') {
            channelSessions.set(from, {
                sessionId: response.sessionId,
                recipientAlias: response.payment?.recipient || null,
            });
            await outboundTransport.send({
                to: from,
                text: formatSummary(response),
                buttons: [
                    { id: `confirm:${response.sessionId}`, title: 'Confirmar simulación' },
                    { id: `cancel:${response.sessionId}`, title: 'Cancelar' },
                ],
            });
            return { processed: true, sessionId: response.sessionId };
        }

        await outboundTransport.send({
            to: from,
            text: formatTerminalMessage(response),
        });

        if (response.receipt?.status === 'SUCCEEDED' && currentSession?.recipientAlias) {
            const recipient = beneficiaryDirectory.resolveChannelRecipient(currentSession.recipientAlias);
            if (recipient) {
                await outboundTransport.send({
                    to: recipient,
                    text: [
                        'Recibiste una notificación de pago de prueba.',
                        `Folio: ${response.receipt.folio}`,
                        '🧪 SIMULACIÓN — NO ES DINERO REAL',
                    ].join('\n'),
                });
            }
        }

        channelSessions.delete(from);
        return { processed: true, sessionId: response.sessionId };
    };

    return {
        async handleWebhook({ rawBody, signature }) {
            if (!verifySignature(rawBody, signature, appSecret)) {
                throw fail('Invalid webhook signature', 'INVALID_WEBHOOK_SIGNATURE', 401);
            }

            let payload;
            try {
                payload = JSON.parse(rawBody);
            } catch {
                throw fail('Webhook body must be valid JSON', 'INVALID_WEBHOOK_BODY');
            }

            const message = extractMessage(payload);
            if (!message) return { processed: false, ignored: true };

            if (deliveries.has(message.id)) {
                await deliveries.get(message.id);
                return { processed: false, duplicate: true };
            }

            const processing = processMessage(message);
            deliveries.set(message.id, processing);
            try {
                return await processing;
            } catch (error) {
                deliveries.delete(message.id);
                throw error;
            }
        },
    };
};
