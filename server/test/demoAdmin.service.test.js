import assert from 'node:assert/strict';
import test from 'node:test';

import { authenticateDemoAdmin } from '../src/services/demoAdmin.service.js';

const credentials = {
    phoneNumber: '+5210000000000',
    pin: '654321',
};

const enabledEnv = {
    NODE_ENV: 'development',
    DEMO_ADMIN_ENABLED: 'true',
    DEMO_ADMIN_PHONE: credentials.phoneNumber,
    DEMO_ADMIN_PIN: credentials.pin,
};

test('rejects demo admin login when the feature is disabled', () => {
    assert.equal(authenticateDemoAdmin(credentials, {}), null);
});

test('rejects demo admin login in production', () => {
    assert.equal(authenticateDemoAdmin(credentials, {
        ...enabledEnv,
        NODE_ENV: 'production',
    }), null);
});

test('rejects invalid demo admin credentials', () => {
    assert.equal(authenticateDemoAdmin({
        ...credentials,
        pin: '000000',
    }, enabledEnv), null);
});

test('returns a local admin identity for valid demo credentials', () => {
    assert.deepEqual(authenticateDemoAdmin(credentials, enabledEnv), {
        id: 'demo-admin',
        phone_number: credentials.phoneNumber,
        first_name: 'Admin',
        last_name: 'Demo',
        email: 'admin.demo@remesalibre.local',
        role: 'admin',
        status: 'active',
    });
});
