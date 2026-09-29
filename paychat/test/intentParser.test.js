import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePaychatMessage } from '../src/intentParser.js';

test('parses the canonical Spanish payment phrase into deterministic slots', () => {
    assert.deepEqual(parsePaychatMessage('Paga 250 pesos a María por comida'), {
        intent: 'send_payment',
        slots: {
            amountInMinorUnits: 25000,
            currency: 'MXN',
            recipientAlias: 'María',
            concept: 'comida',
        },
        missing: [],
    });
});

test('parses para as a concept separator instead of part of the beneficiary', () => {
    assert.deepEqual(parsePaychatMessage('paga 300 pesos a Maria para telefono'), {
        intent: 'send_payment',
        slots: {
            amountInMinorUnits: 30000,
            currency: 'MXN',
            recipientAlias: 'Maria',
            concept: 'telefono',
        },
        missing: [],
    });
});

test('reports missing payment slots instead of guessing them', () => {
    assert.deepEqual(parsePaychatMessage('/pagar'), {
        intent: 'send_payment',
        slots: { currency: 'MXN' },
        missing: ['amount', 'recipient'],
    });
});

test('returns help for unsupported messages', () => {
    assert.deepEqual(parsePaychatMessage('Cuéntame un chiste'), {
        intent: 'help',
        slots: {},
        missing: [],
    });
});
