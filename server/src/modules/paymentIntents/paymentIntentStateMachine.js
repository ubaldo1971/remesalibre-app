export { PAYMENT_INTENT_STATUS } from './paymentIntent.constants.js';

import { PAYMENT_INTENT_STATUS } from './paymentIntent.constants.js';

const transitions = new Map([
    [PAYMENT_INTENT_STATUS.CREATED, new Set([PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION])],
    [PAYMENT_INTENT_STATUS.PENDING_CONFIRMATION, new Set([
        PAYMENT_INTENT_STATUS.AUTHORIZED,
        PAYMENT_INTENT_STATUS.CANCELLED,
        PAYMENT_INTENT_STATUS.EXPIRED,
        PAYMENT_INTENT_STATUS.REJECTED,
        PAYMENT_INTENT_STATUS.UNDER_REVIEW,
    ])],
    [PAYMENT_INTENT_STATUS.AUTHORIZED, new Set([
        PAYMENT_INTENT_STATUS.PROCESSING,
        PAYMENT_INTENT_STATUS.FAILED,
        PAYMENT_INTENT_STATUS.UNDER_REVIEW,
    ])],
    [PAYMENT_INTENT_STATUS.PROCESSING, new Set([
        PAYMENT_INTENT_STATUS.SUCCEEDED,
        PAYMENT_INTENT_STATUS.FAILED,
        PAYMENT_INTENT_STATUS.UNDER_REVIEW,
    ])],
    [PAYMENT_INTENT_STATUS.SUCCEEDED, new Set([PAYMENT_INTENT_STATUS.REVERSED])],
    [PAYMENT_INTENT_STATUS.UNDER_REVIEW, new Set([
        PAYMENT_INTENT_STATUS.AUTHORIZED,
        PAYMENT_INTENT_STATUS.REJECTED,
        PAYMENT_INTENT_STATUS.FAILED,
    ])],
]);

export const canTransition = (from, to) => transitions.get(from)?.has(to) ?? false;

export const assertTransition = (from, to) => {
    if (canTransition(from, to)) return;

    const error = new Error(`Invalid payment intent transition: ${from} → ${to}`);
    error.code = 'INVALID_PAYMENT_INTENT_TRANSITION';
    error.from = from;
    error.to = to;
    throw error;
};
