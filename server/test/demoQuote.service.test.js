import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoQuoteService } from '../src/modules/paymentIntents/demoQuote.service.js';

const now = new Date('2026-07-20T20:00:00.000Z');
const service = createDemoQuoteService({ now: () => now, maxAmountInMinorUnits: 100000 });

test('quotes a domestic MXN payment with zero fee and five-minute expiry', () => {
    assert.deepEqual(service.create({
        type: 'domestic_p2p_mxn',
        amountInMinorUnits: 25000,
        currency: 'MXN',
    }), {
        amount: { value: 25000, currency: 'MXN' },
        fee: { value: 0, currency: 'MXN' },
        total: { value: 25000, currency: 'MXN' },
        expiresAt: '2026-07-20T20:05:00.000Z',
        simulation: true,
    });
});

test('rejects unsupported currencies and non-integer amounts', () => {
    assert.throws(
        () => service.create({ type: 'domestic_p2p_mxn', amountInMinorUnits: 25000, currency: 'USD' }),
        error => error.code === 'UNSUPPORTED_DEMO_QUOTE',
    );
    assert.throws(
        () => service.create({ type: 'domestic_p2p_mxn', amountInMinorUnits: 250.5, currency: 'MXN' }),
        error => error.code === 'INVALID_AMOUNT',
    );
});

test('rejects amounts outside the configured demo limits', () => {
    for (const amountInMinorUnits of [0, 100001]) {
        assert.throws(
            () => service.create({ type: 'domestic_p2p_mxn', amountInMinorUnits, currency: 'MXN' }),
            error => error.code === 'INVALID_AMOUNT',
        );
    }
});
