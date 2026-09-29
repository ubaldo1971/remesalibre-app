import assert from 'node:assert/strict';
import test from 'node:test';

import { createCoreClient } from '../src/coreClient.js';

const jsonResponse = (body, { ok = true, status = 200 } = {}) => ({
    ok,
    status,
    async json() {
        return body;
    },
});

test('creates and confirms intents through the versioned Core contract', async () => {
    const calls = [];
    const client = createCoreClient({
        baseUrl: 'http://core.test',
        fetchImpl: async (url, options) => {
            calls.push({ url, options });
            return jsonResponse({ data: { id: 'pi_1' }, simulation: true });
        },
    });

    await client.createPaymentIntent({
        authorization: 'Bearer jwt',
        idempotencyKey: 'create-1',
        recipientAlias: 'María',
        amountInMinorUnits: 25000,
        currency: 'MXN',
        concept: 'comida',
        channel: 'paychat_web',
    });
    await client.confirmPaymentIntent({
        authorization: 'Bearer jwt',
        idempotencyKey: 'confirm-1',
        intentId: 'pi_1',
        confirmationToken: 'token',
    });

    assert.equal(calls[0].url, 'http://core.test/api/v1/payment-intents');
    assert.equal(calls[0].options.headers['Idempotency-Key'], 'create-1');
    assert.equal(JSON.parse(calls[0].options.body).amountInMinorUnits, 25000);
    assert.equal(calls[1].url, 'http://core.test/api/v1/payment-intents/pi_1/confirm');
    assert.deepEqual(JSON.parse(calls[1].options.body), { confirmationToken: 'token' });
});

test('preserves Core error codes and HTTP status', async () => {
    const client = createCoreClient({
        baseUrl: 'http://core.test',
        fetchImpl: async () => jsonResponse(
            { error: 'Expired', code: 'PAYMENT_INTENT_EXPIRED' },
            { ok: false, status: 410 },
        ),
    });

    await assert.rejects(
        () => client.cancelPaymentIntent({
            authorization: 'Bearer jwt',
            idempotencyKey: 'cancel-1',
            intentId: 'pi_1',
        }),
        error => error.code === 'PAYMENT_INTENT_EXPIRED' && error.statusCode === 410,
    );
});
