import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoWhatsAppIdentityService } from '../src/whatsapp/demoWhatsAppIdentity.service.js';

test('exchanges a bound demo channel identity for a fresh Core authorization', async () => {
    const calls = [];
    const service = createDemoWhatsAppIdentityService({
        coreBaseUrl: 'http://core.test',
        bindings: {
            '5215550000001': { phoneNumber: '+521****5678', pin: '123456' },
        },
        fetchImpl: async (url, options) => {
            calls.push({ url, options });
            return {
                ok: true,
                async json() { return { accessToken: 'fresh-access-token' }; },
            };
        },
    });

    const authorization = await service.getAuthorization('5215550000001');

    assert.equal(authorization, 'Bearer fresh-access-token');
    assert.equal(calls[0].url, 'http://core.test/api/auth/login');
    assert.deepEqual(JSON.parse(calls[0].options.body), {
        phoneNumber: '+521****5678',
        pin: '123456',
    });
});

test('rejects an unbound channel number without calling Core', async () => {
    const service = createDemoWhatsAppIdentityService({
        bindings: {},
        fetchImpl: async () => { throw new Error('must not call'); },
    });

    await assert.rejects(
        () => service.getAuthorization('5215559999999'),
        error => error.code === 'CHANNEL_IDENTITY_NOT_BOUND' && error.statusCode === 403,
    );
});
