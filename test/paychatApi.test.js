import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaychatApiClient } from '../src/services/paychatApi.js';

const response = body => ({
    ok: true,
    async json() {
        return body;
    },
});

test('sends authenticated chat messages and reads the admin timeline', async () => {
    const calls = [];
    const client = createPaychatApiClient({
        gatewayUrl: 'http://gateway.test',
        coreApiUrl: 'http://core.test/api',
        getToken: () => 'jwt-token',
        fetchImpl: async (url, options) => {
            calls.push({ url, options });
            return response({ data: [] });
        },
    });

    await client.sendMessage({ message: 'Paga 250 pesos a María' });
    await client.listAdminPaymentIntents();

    assert.equal(calls[0].url, 'http://gateway.test/api/paychat/v1/messages');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer jwt-token');
    assert.deepEqual(JSON.parse(calls[0].options.body), { message: 'Paga 250 pesos a María' });
    assert.equal(calls[1].url, 'http://core.test/api/v1/admin/payment-intents');
    assert.equal(calls[1].options.method, 'GET');
});

test('exposes structured API failures to the UI', async () => {
    const client = createPaychatApiClient({
        gatewayUrl: 'http://gateway.test',
        getToken: () => 'jwt-token',
        fetchImpl: async () => ({
            ok: false,
            status: 422,
            async json() {
                return { error: 'No encontrado', code: 'BENEFICIARY_NOT_RESOLVED' };
            },
        }),
    });

    await assert.rejects(
        () => client.sendMessage({ message: 'Paga 250 pesos a Pedro' }),
        error => error.code === 'BENEFICIARY_NOT_RESOLVED' && error.statusCode === 422,
    );
});
