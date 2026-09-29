import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoBeneficiaryService } from '../src/modules/beneficiaries/demoBeneficiary.service.js';

const enabledService = () => createDemoBeneficiaryService({
    enabled: true,
    nodeEnv: 'development',
});

test('resolves a normalized demo alias and masks the phone', () => {
    const result = enabledService().resolveAlias('  Maria  ');

    assert.deepEqual(result, {
        status: 'resolved',
        beneficiary: {
            id: 'demo-beneficiary-maria',
            displayName: 'María López',
            maskedPhone: '******4821',
        },
    });
});

test('reports an unknown beneficiary without creating one', () => {
    assert.deepEqual(enabledService().resolveAlias('Pedro'), {
        status: 'not_found',
        candidates: [],
    });
});

test('disables demo beneficiaries in production', () => {
    const service = createDemoBeneficiaryService({ enabled: true, nodeEnv: 'production' });

    assert.deepEqual(service.resolveAlias('María'), {
        status: 'unavailable',
        candidates: [],
    });
});
