import express from 'express';

import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const fail = (message, code, statusCode) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    throw error;
};

const requireIdempotencyKey = request => {
    const key = request.headers['idempotency-key'];
    if (typeof key !== 'string' || !key.trim()) {
        fail('Idempotency-Key header is required', 'IDEMPOTENCY_KEY_REQUIRED', 400);
    }
    return key.trim();
};

export const wrapAsyncHandler = handler => (request, response, next) => (
    Promise.resolve(handler(request, response, next)).catch(next)
);

export const createPaymentIntentHandlers = service => ({
    async create(request, response) {
        const result = await service.create({
            userId: request.user.id,
            idempotencyKey: requireIdempotencyKey(request),
            recipientAlias: request.body.recipientAlias,
            amountInMinorUnits: request.body.amountInMinorUnits,
            currency: request.body.currency,
            concept: request.body.concept,
            channel: request.body.channel,
        });
        return response.status(201).json({
            data: result.intent,
            confirmationToken: result.confirmationToken,
            simulation: true,
        });
    },

    async get(request, response) {
        const intent = service.getForUser(request.user.id, request.params.id);
        return response.json({ data: intent, simulation: true });
    },

    async confirm(request, response) {
        const intent = await service.confirm({
            userId: request.user.id,
            intentId: request.params.id,
            idempotencyKey: requireIdempotencyKey(request),
            confirmationToken: request.body.confirmationToken,
        });
        return response.json({ data: intent, simulation: true });
    },

    async cancel(request, response) {
        const intent = await service.cancel({
            userId: request.user.id,
            intentId: request.params.id,
            idempotencyKey: requireIdempotencyKey(request),
        });
        return response.json({ data: intent, simulation: true });
    },

    async listForAdmin(_request, response) {
        return response.json({ data: service.listForAdmin(), simulation: true });
    },
});

export const createPaymentIntentRouter = service => {
    const router = express.Router();
    const handlers = createPaymentIntentHandlers(service);
    router.use(authenticate);
    router.post('/', wrapAsyncHandler(handlers.create));
    router.get('/:id', wrapAsyncHandler(handlers.get));
    router.post('/:id/confirm', wrapAsyncHandler(handlers.confirm));
    router.post('/:id/cancel', wrapAsyncHandler(handlers.cancel));
    return router;
};

export const createAdminPaymentIntentRouter = service => {
    const router = express.Router();
    const handlers = createPaymentIntentHandlers(service);
    router.use(authenticate, authorize('admin'));
    router.get('/', wrapAsyncHandler(handlers.listForAdmin));
    return router;
};
