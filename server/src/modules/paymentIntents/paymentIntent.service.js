import { createHash, createHmac } from 'node:crypto';

import { PAYMENT_INTENT_STATUS } from './paymentIntent.constants.js';

const fail = (message, code, statusCode = 400) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    throw error;
};

const hash = value => createHash('sha256').update(value).digest('hex');
const hashPayload = value => hash(JSON.stringify(value));
const isoNow = now => now().toISOString();

const toPublicIntent = intent => {
    if (!intent) return null;
    const { confirmationTokenHash, ...publicIntent } = intent;
    return publicIntent;
};

export const createHmacConfirmationTokenFactory = secret => {
    if (!secret) fail('Confirmation token secret is required', 'CONFIRMATION_SECRET_REQUIRED', 500);
    return (intentId, expiresAt) => createHmac('sha256', secret)
        .update(`${intentId}:${expiresAt}`)
        .digest('base64url');
};

export const createPaymentIntentService = ({
    repository,
    beneficiaryService,
    quoteService,
    connector,
    now = () => new Date(),
    idGenerator,
    confirmationTokenFactory,
}) => ({
    async create(request) {
        const payload = {
            recipientAlias: request.recipientAlias,
            amountInMinorUnits: request.amountInMinorUnits,
            currency: request.currency,
            concept: request.concept,
            channel: request.channel,
        };
        const payloadHash = hashPayload(payload);
        const previous = repository.findByIdempotencyKey(
            request.userId,
            request.idempotencyKey,
            'create',
        );
        if (previous) {
            if (previous.payloadHash !== payloadHash) {
                fail('Idempotency key reused with another payload', 'IDEMPOTENCY_CONFLICT', 409);
            }
            const intent = repository.findById(previous.intentId);
            return {
                intent: toPublicIntent(intent),
                confirmationToken: confirmationTokenFactory(intent.id, intent.expiresAt),
            };
        }

        const resolved = beneficiaryService.resolveAlias(request.recipientAlias);
        if (resolved.status !== 'resolved') {
            fail('Beneficiary could not be resolved', 'BENEFICIARY_NOT_RESOLVED', 422);
        }
        const quote = quoteService.create({
            type: 'domestic_p2p_mxn',
            amountInMinorUnits: request.amountInMinorUnits,
            currency: request.currency,
        });
        const id = idGenerator();
        const confirmationToken = confirmationTokenFactory(id, quote.expiresAt);
        const intent = {
            id,
            senderId: request.userId,
            status: PAYMENT_INTENT_STATUS.CREATED,
            recipient: resolved.beneficiary,
            quote,
            concept: request.concept,
            channel: request.channel,
            simulation: true,
            createdAt: isoNow(now),
            expiresAt: quote.expiresAt,
            confirmationTokenHash: hash(confirmationToken),
        };
        repository.create(intent, {
            type: 'intent.created',
            actorId: request.userId,
            occurredAt: isoNow(now),
        });
        const pending = repository.transition(
            id,
            PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION,
            {
                type: 'intent.confirmation_requested',
                actorId: 'system',
                occurredAt: isoNow(now),
            },
        );
        repository.rememberIdempotency({
            userId: request.userId,
            key: request.idempotencyKey,
            operation: 'create',
            payloadHash,
            intentId: id,
        });

        return {
            intent: toPublicIntent(pending),
            confirmationToken,
        };
    },

    async confirm(request) {
        let intent = repository.findById(request.intentId);
        if (!intent) fail('Payment intent not found', 'PAYMENT_INTENT_NOT_FOUND', 404);
        if (intent.senderId !== request.userId) {
            fail('Payment intent belongs to another user', 'PAYMENT_INTENT_FORBIDDEN', 403);
        }

        const payloadHash = hashPayload({
            intentId: request.intentId,
            confirmationToken: request.confirmationToken,
        });
        const previous = repository.findByIdempotencyKey(
            request.userId,
            request.idempotencyKey,
            'confirm',
        );
        if (previous) {
            if (previous.payloadHash !== payloadHash) {
                fail('Idempotency key reused with another payload', 'IDEMPOTENCY_CONFLICT', 409);
            }
            return toPublicIntent(repository.findById(previous.intentId));
        }

        if (intent.status !== PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION) {
            fail('Payment intent cannot be confirmed in its current state', 'INVALID_PAYMENT_INTENT_STATE', 409);
        }
        if (new Date(intent.expiresAt).getTime() <= now().getTime()) {
            repository.transition(intent.id, PAYMENT_INTENT_STATUS.EXPIRED, {
                type: 'intent.expired',
                actorId: 'system',
                occurredAt: isoNow(now),
            });
            fail('Payment intent has expired', 'PAYMENT_INTENT_EXPIRED', 410);
        }
        if (hash(request.confirmationToken) !== intent.confirmationTokenHash) {
            fail('Confirmation token is invalid', 'INVALID_CONFIRMATION_TOKEN', 403);
        }

        intent = repository.transition(intent.id, PAYMENT_INTENT_STATUS.AUTHORIZED, {
            type: 'intent.authorized',
            actorId: request.userId,
            occurredAt: isoNow(now),
        });
        intent = repository.transition(intent.id, PAYMENT_INTENT_STATUS.PROCESSING, {
            type: 'intent.processing',
            actorId: 'system',
            occurredAt: isoNow(now),
        });

        const providerResult = await connector.execute({
            intentId: intent.id,
            amountInMinorUnits: intent.quote.amount.value,
            currency: intent.quote.amount.currency,
            recipientId: intent.recipient.id,
            idempotencyKey: `${intent.id}:execute`,
        });
        if (providerResult.status !== 'succeeded') {
            fail('Simulator did not complete the payment', 'SIMULATED_PAYMENT_NOT_SUCCEEDED', 422);
        }

        intent = repository.transition(
            intent.id,
            PAYMENT_INTENT_STATUS.SUCCEEDED,
            {
                type: 'intent.succeeded',
                actorId: 'simulator',
                occurredAt: providerResult.processedAt,
            },
            {
                provider: {
                    name: 'simulator',
                    reference: providerResult.providerReference,
                    status: providerResult.status,
                    simulation: providerResult.simulation,
                },
            },
        );
        repository.rememberIdempotency({
            userId: request.userId,
            key: request.idempotencyKey,
            operation: 'confirm',
            payloadHash,
            intentId: intent.id,
        });
        return toPublicIntent(intent);
    },

    getForUser(userId, intentId) {
        const intent = repository.findById(intentId);
        if (!intent) fail('Payment intent not found', 'PAYMENT_INTENT_NOT_FOUND', 404);
        if (intent.senderId !== userId) {
            fail('Payment intent belongs to another user', 'PAYMENT_INTENT_FORBIDDEN', 403);
        }
        return toPublicIntent(intent);
    },

    async cancel(request) {
        const intent = repository.findById(request.intentId);
        if (!intent) fail('Payment intent not found', 'PAYMENT_INTENT_NOT_FOUND', 404);
        if (intent.senderId !== request.userId) {
            fail('Payment intent belongs to another user', 'PAYMENT_INTENT_FORBIDDEN', 403);
        }

        const payloadHash = hashPayload({ intentId: request.intentId });
        const previous = repository.findByIdempotencyKey(
            request.userId,
            request.idempotencyKey,
            'cancel',
        );
        if (previous) {
            if (previous.payloadHash !== payloadHash) {
                fail('Idempotency key reused with another payload', 'IDEMPOTENCY_CONFLICT', 409);
            }
            return toPublicIntent(repository.findById(previous.intentId));
        }
        if (intent.status !== PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION) {
            fail('Payment intent cannot be cancelled in its current state', 'INVALID_PAYMENT_INTENT_STATE', 409);
        }

        const cancelled = repository.transition(
            intent.id,
            PAYMENT_INTENT_STATUS.CANCELLED,
            {
                type: 'intent.cancelled',
                actorId: request.userId,
                occurredAt: isoNow(now),
            },
        );
        repository.rememberIdempotency({
            userId: request.userId,
            key: request.idempotencyKey,
            operation: 'cancel',
            payloadHash,
            intentId: intent.id,
        });
        return toPublicIntent(cancelled);
    },

    listForAdmin() {
        return repository.listForAdmin().map(toPublicIntent);
    },
});
