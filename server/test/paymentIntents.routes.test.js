import assert from 'node:assert/strict';
import test from 'node:test';

import {
    createPaymentIntentHandlers,
    wrapAsyncHandler,
} from '../src/routes/v1/paymentIntents.routes.js';

const makeResponse = () => ({
    statusCode: 200,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

test('maps authenticated create requests to the service', async () => {
    let received;
    const handlers = createPaymentIntentHandlers({
        async create(request) {
            received = request;
            return { intent: { id: 'pi_1' }, confirmationToken: 'token' };
        },
    });
    const response = makeResponse();

    await handlers.create({
        user: { id: 'user-1' },
        headers: { 'idempotency-key': 'idem-1' },
        body: {
            recipientAlias: 'María',
            amountInMinorUnits: 25000,
            currency: 'MXN',
            concept: 'comida',
            channel: 'paychat_web',
        },
    }, response);

    assert.equal(response.statusCode, 201);
    assert.equal(response.body.simulation, true);
    assert.deepEqual(received, {
        userId: 'user-1',
        idempotencyKey: 'idem-1',
        recipientAlias: 'María',
        amountInMinorUnits: 25000,
        currency: 'MXN',
        concept: 'comida',
        channel: 'paychat_web',
    });
});

test('rejects a mutation without an idempotency key', async () => {
    const handlers = createPaymentIntentHandlers({});

    await assert.rejects(
        () => handlers.cancel({
            user: { id: 'user-1' },
            headers: {},
            params: { id: 'pi_1' },
        }, makeResponse()),
        error => error.code === 'IDEMPOTENCY_KEY_REQUIRED' && error.statusCode === 400,
    );
});

test('returns an owner intent and an admin timeline', async () => {
    const handlers = createPaymentIntentHandlers({
        getForUser: (userId, id) => ({ id, senderId: userId }),
        listForAdmin: () => [{ id: 'pi_1' }],
    });
    const ownerResponse = makeResponse();
    const adminResponse = makeResponse();

    await handlers.get({ user: { id: 'user-1' }, params: { id: 'pi_1' } }, ownerResponse);
    await handlers.listForAdmin({}, adminResponse);

    assert.deepEqual(ownerResponse.body.data, { id: 'pi_1', senderId: 'user-1' });
    assert.deepEqual(adminResponse.body.data, [{ id: 'pi_1' }]);
});

test('forwards rejected async route handlers to Express error middleware', async () => {
    const expected = Object.assign(new Error('Beneficiary could not be resolved'), {
        code: 'BENEFICIARY_NOT_RESOLVED',
        statusCode: 422,
    });
    let forwarded;
    const wrapped = wrapAsyncHandler(async () => {
        throw expected;
    });

    await wrapped({}, {}, error => {
        forwarded = error;
    });

    assert.equal(forwarded, expected);
});
