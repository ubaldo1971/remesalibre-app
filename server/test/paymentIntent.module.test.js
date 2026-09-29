import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaymentIntentModule } from '../src/modules/paymentIntents/paymentIntent.module.js';

const request = {
    userId: 'demo-user',
    idempotencyKey: 'create-1',
    recipientAlias: 'María',
    amountInMinorUnits: 25000,
    currency: 'MXN',
    concept: 'comida',
    channel: 'paychat_web',
};

test('composes an enabled development-only payment intent service', async () => {
    const module = createPaymentIntentModule({
        env: {
            NODE_ENV: 'development',
            PAYCHAT_DEMO_ENABLED: 'true',
            PAYCHAT_CONFIRMATION_SECRET: 'test-secret',
        },
        idGenerator: () => 'pi_composed_1',
        now: () => new Date('2026-07-20T20:00:00.000Z'),
    });

    const result = await module.service.create(request);

    assert.equal(result.intent.id, 'pi_composed_1');
    assert.equal(result.intent.status, 'PENDING_CONFIRMATION');
    assert.equal(module.repository.listForAdmin().length, 1);
});

test('does not expose demo beneficiaries in production', async () => {
    const module = createPaymentIntentModule({
        env: {
            NODE_ENV: 'production',
            PAYCHAT_DEMO_ENABLED: 'true',
            PAYCHAT_CONFIRMATION_SECRET: 'test-secret',
        },
        idGenerator: () => 'pi_production',
    });

    await assert.rejects(
        () => module.service.create(request),
        error => error.code === 'BENEFICIARY_NOT_RESOLVED',
    );
});
