import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaychatConversationService } from '../src/conversation.service.js';

const pendingIntent = {
    id: 'pi_1',
    status: 'PENDING_CONFIRMATION',
    recipient: { displayName: 'María López', maskedPhone: '******4821' },
    quote: {
        amount: { value: 25000, currency: 'MXN' },
        fee: { value: 0, currency: 'MXN' },
        total: { value: 25000, currency: 'MXN' },
    },
    concept: 'comida',
    simulation: true,
};

test('creates a Core intent and returns an explicit confirmation action', async () => {
    let createCall;
    const service = createPaychatConversationService({
        idGenerator: () => 'session-1',
        coreClient: {
            async createPaymentIntent(request) {
                createCall = request;
                return { data: pendingIntent, confirmationToken: 'opaque-token', simulation: true };
            },
        },
    });

    const result = await service.handle({
        authorization: 'Bearer demo-jwt',
        message: 'Paga 250 pesos a María por comida',
    });

    assert.equal(result.sessionId, 'session-1');
    assert.equal(result.action.type, 'confirm_payment');
    assert.equal(result.action.intentId, 'pi_1');
    assert.equal(result.payment.recipient, 'María López');
    assert.equal(result.payment.amountInMinorUnits, 25000);
    assert.equal(result.simulation, true);
    assert.deepEqual(createCall, {
        authorization: 'Bearer demo-jwt',
        idempotencyKey: 'session-1:create:1',
        recipientAlias: 'María',
        amountInMinorUnits: 25000,
        currency: 'MXN',
        concept: 'comida',
        channel: 'paychat_web',
    });
});

test('confirms the pending session and returns a simulated receipt', async () => {
    let confirmCall;
    const service = createPaychatConversationService({
        idGenerator: () => 'session-1',
        coreClient: {
            async createPaymentIntent() {
                return { data: pendingIntent, confirmationToken: 'opaque-token', simulation: true };
            },
            async confirmPaymentIntent(request) {
                confirmCall = request;
                return {
                    data: {
                        ...pendingIntent,
                        status: 'SUCCEEDED',
                        provider: { reference: 'SIM-pi_1', simulation: true },
                    },
                    simulation: true,
                };
            },
        },
    });
    const created = await service.handle({
        authorization: 'Bearer demo-jwt',
        message: 'Paga 250 pesos a María por comida',
    });

    const result = await service.handle({
        authorization: 'Bearer demo-jwt',
        sessionId: created.sessionId,
        action: 'confirm',
    });

    assert.equal(result.action, null);
    assert.equal(result.receipt.status, 'SUCCEEDED');
    assert.equal(result.receipt.folio, 'SIM-pi_1');
    assert.deepEqual(confirmCall, {
        authorization: 'Bearer demo-jwt',
        intentId: 'pi_1',
        idempotencyKey: 'session-1:confirm:1',
        confirmationToken: 'opaque-token',
    });
});

test('returns guidance instead of creating an incomplete operation', async () => {
    const service = createPaychatConversationService({
        idGenerator: () => 'session-1',
        coreClient: {},
    });

    const result = await service.handle({ message: '/pagar' });

    assert.equal(result.action, null);
    assert.match(result.message, /monto y destinatario/i);
});

test('cancels a pending session through the Core', async () => {
    let cancelCall;
    const service = createPaychatConversationService({
        idGenerator: () => 'session-1',
        coreClient: {
            async createPaymentIntent() {
                return { data: pendingIntent, confirmationToken: 'opaque-token', simulation: true };
            },
            async cancelPaymentIntent(request) {
                cancelCall = request;
                return { data: { ...pendingIntent, status: 'CANCELLED' }, simulation: true };
            },
        },
    });
    await service.handle({
        authorization: 'Bearer demo-jwt',
        message: 'Paga 250 pesos a María por comida',
    });

    const result = await service.handle({
        authorization: 'Bearer demo-jwt',
        sessionId: 'session-1',
        action: 'cancel',
    });

    assert.equal(result.action, null);
    assert.equal(result.cancelled.status, 'CANCELLED');
    assert.deepEqual(cancelCall, {
        authorization: 'Bearer demo-jwt',
        intentId: 'pi_1',
        idempotencyKey: 'session-1:cancel:1',
    });
});
