import assert from 'node:assert/strict';
import test from 'node:test';

import { createSimulatorConnector } from '../src/modules/paymentProviders/simulator.connector.js';

const payment = {
    intentId: 'pi_demo_1',
    amountInMinorUnits: 25000,
    currency: 'MXN',
    recipientId: 'demo-beneficiary-maria',
    idempotencyKey: 'provider-idem-1',
};

test('returns the same successful simulation for a repeated execution', async () => {
    const connector = createSimulatorConnector({
        scenario: 'success',
        now: () => new Date('2026-07-20T20:05:00.000Z'),
    });

    const first = await connector.execute(payment);
    const repeated = await connector.execute(payment);

    assert.deepEqual(first, {
        status: 'succeeded',
        providerReference: 'SIM-pi_demo_1',
        simulation: true,
        processedAt: '2026-07-20T20:05:00.000Z',
    });
    assert.deepEqual(repeated, first);
    assert.deepEqual(await connector.getStatus(first.providerReference), first);
});

test('rejects reuse of a provider key with a different payload', async () => {
    const connector = createSimulatorConnector();
    await connector.execute(payment);

    await assert.rejects(
        () => connector.execute({ ...payment, amountInMinorUnits: 30000 }),
        error => error.code === 'PROVIDER_IDEMPOTENCY_CONFLICT',
    );
});

test('supports deterministic rejected, review and timeout scenarios', async () => {
    for (const [scenario, status] of [
        ['rejected', 'rejected'],
        ['under_review', 'under_review'],
    ]) {
        const result = await createSimulatorConnector({ scenario }).execute(payment);
        assert.equal(result.status, status);
        assert.equal(result.simulation, true);
    }

    await assert.rejects(
        () => createSimulatorConnector({ scenario: 'timeout' }).execute(payment),
        error => error.code === 'SIMULATED_PROVIDER_TIMEOUT',
    );
});
