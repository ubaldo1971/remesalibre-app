import assert from 'node:assert/strict';
import test from 'node:test';

import { authenticateDemoChannelUser } from '../src/services/demoChannelUser.service.js';

const env = {
    NODE_ENV: 'development',
    WHATSAPP_DEMO_IDENTITIES_ENABLED: 'true',
    WHATSAPP_DEMO_IDENTITIES_JSON: JSON.stringify([
        {
            id: 'whatsapp-demo-a',
            phoneNumber: '+5215550000001',
            pin: '111111',
            firstName: 'Ana',
            lastName: 'Demo',
        },
    ]),
};

test('authenticates an environment-defined ephemeral channel identity', () => {
    const user = authenticateDemoChannelUser({
        phoneNumber: '+5215550000001',
        pin: '111111',
    }, env);

    assert.equal(user.id, 'whatsapp-demo-a');
    assert.equal(user.role, 'user');
    assert.equal(user.first_name, 'Ana');
    assert.equal('pin' in user, false);
});

test('rejects invalid credentials and production activation', () => {
    assert.equal(authenticateDemoChannelUser({ phoneNumber: '+5215550000001', pin: 'bad' }, env), null);
    assert.equal(authenticateDemoChannelUser(
        { phoneNumber: '+5215550000001', pin: '111111' },
        { ...env, NODE_ENV: 'production' },
    ), null);
});
