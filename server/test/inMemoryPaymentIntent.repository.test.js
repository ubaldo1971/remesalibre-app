import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryPaymentIntentRepository } from '../src/modules/paymentIntents/inMemoryPaymentIntent.repository.js';

const makeIntent = () => ({
    id: 'pi_demo_1',
    senderId: 'user-1',
    status: 'CREATED',
    amount: { value: 25000, currency: 'MXN' },
});

const makeEvent = () => ({
    type: 'intent.created',
    actorId: 'user-1',
    occurredAt: '2026-07-20T20:00:00.000Z',
});

test('creates and retrieves an isolated copy of an intent', () => {
    const repository = new InMemoryPaymentIntentRepository();
    const intent = makeIntent();

    repository.create(intent, makeEvent());
    const stored = repository.findById(intent.id);
    stored.amount.value = 1;

    assert.deepEqual(repository.findById(intent.id), {
        ...intent,
        events: [makeEvent()],
    });
});

test('stores idempotency records per user and operation', () => {
    const repository = new InMemoryPaymentIntentRepository();
    const record = {
        userId: 'user-1',
        key: 'idem-1',
        operation: 'create',
        payloadHash: 'hash-a',
        intentId: 'pi_demo_1',
    };

    repository.rememberIdempotency(record);

    assert.deepEqual(
        repository.findByIdempotencyKey('user-1', 'idem-1', 'create'),
        record,
    );
    assert.equal(repository.findByIdempotencyKey('user-2', 'idem-1', 'create'), null);
    assert.equal(repository.findByIdempotencyKey('user-1', 'idem-1', 'confirm'), null);
});

test('transitions an intent by appending an immutable event', () => {
    const repository = new InMemoryPaymentIntentRepository();
    repository.create(makeIntent(), makeEvent());
    const confirmationEvent = {
        type: 'intent.confirmation_requested',
        actorId: 'system',
        occurredAt: '2026-07-20T20:01:00.000Z',
    };

    const updated = repository.transition(
        'pi_demo_1',
        'PENDING_CONFIRMATION',
        confirmationEvent,
        { expiresAt: '2026-07-20T20:06:00.000Z' },
    );
    updated.events[0].type = 'tampered';

    assert.deepEqual(repository.findById('pi_demo_1'), {
        ...makeIntent(),
        status: 'PENDING_CONFIRMATION',
        expiresAt: '2026-07-20T20:06:00.000Z',
        events: [makeEvent(), confirmationEvent],
    });
});

test('rejects invalid transitions and returns isolated admin results', () => {
    const repository = new InMemoryPaymentIntentRepository();
    repository.create({ ...makeIntent(), status: 'SUCCEEDED' }, makeEvent());

    assert.throws(
        () => repository.transition('pi_demo_1', 'PROCESSING', makeEvent()),
        error => error.code === 'INVALID_PAYMENT_INTENT_TRANSITION',
    );

    const listed = repository.listForAdmin();
    listed[0].status = 'tampered';
    assert.equal(repository.findById('pi_demo_1').status, 'SUCCEEDED');

    repository.reset();
    assert.equal(repository.findById('pi_demo_1'), null);
});
