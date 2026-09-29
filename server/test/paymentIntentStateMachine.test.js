import assert from 'node:assert/strict';
import test from 'node:test';

import {
    PAYMENT_INTENT_STATUS,
    assertTransition,
    canTransition,
} from '../src/modules/paymentIntents/paymentIntentStateMachine.js';

test('allows a newly created intent to request confirmation', () => {
    assert.equal(
        canTransition(
            PAYMENT_INTENT_STATUS.CREATED,
            PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION,
        ),
        true,
    );
});

test('allows the complete successful processing path', () => {
    const path = [
        PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION,
        PAYMENT_INTENT_STATUS.AUTHORIZED,
        PAYMENT_INTENT_STATUS.PROCESSING,
        PAYMENT_INTENT_STATUS.SUCCEEDED,
    ];

    for (let index = 0; index < path.length - 1; index += 1) {
        assert.equal(canTransition(path[index], path[index + 1]), true);
    }
});

test('allows a pending intent to be cancelled or expired', () => {
    assert.equal(
        canTransition(
            PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION,
            PAYMENT_INTENT_STATUS.CANCELLED,
        ),
        true,
    );
    assert.equal(
        canTransition(
            PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION,
            PAYMENT_INTENT_STATUS.EXPIRED,
        ),
        true,
    );
});

test('rejects transitions from a terminal state', () => {
    assert.equal(
        canTransition(PAYMENT_INTENT_STATUS.SUCCEEDED, PAYMENT_INTENT_STATUS.PROCESSING),
        false,
    );
    assert.throws(
        () => assertTransition(PAYMENT_INTENT_STATUS.SUCCEEDED, PAYMENT_INTENT_STATUS.PROCESSING),
        error => error.code === 'INVALID_PAYMENT_INTENT_TRANSITION',
    );
});
