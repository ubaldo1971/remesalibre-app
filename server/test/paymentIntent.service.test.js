import assert from 'node:assert/strict';
import test from 'node:test';

import { createDemoBeneficiaryService } from '../src/modules/beneficiaries/demoBeneficiary.service.js';
import { createDemoQuoteService } from '../src/modules/paymentIntents/demoQuote.service.js';
import { InMemoryPaymentIntentRepository } from '../src/modules/paymentIntents/inMemoryPaymentIntent.repository.js';
import { createPaymentIntentService } from '../src/modules/paymentIntents/paymentIntent.service.js';
import { createSimulatorConnector } from '../src/modules/paymentProviders/simulator.connector.js';

const nowValue = new Date('2026-07-20T20:00:00.000Z');

const makeDependencies = ({ now = () => nowValue } = {}) => {
    const repository = new InMemoryPaymentIntentRepository();
    return {
        repository,
        service: createPaymentIntentService({
            repository,
            beneficiaryService: createDemoBeneficiaryService({ enabled: true, nodeEnv: 'test' }),
            quoteService: createDemoQuoteService({ now }),
            connector: createSimulatorConnector({ now }),
            now,
            idGenerator: () => 'pi_demo_1',
            confirmationTokenFactory: () => 'opaque-confirmation-token',
        }),
    };
};

const createRequest = {
    userId: 'user-1',
    idempotencyKey: 'create-idem-1',
    recipientAlias: 'María',
    amountInMinorUnits: 25000,
    currency: 'MXN',
    concept: 'comida',
    channel: 'paychat_web',
};

test('creates a pending simulated intent with an opaque confirmation token', async () => {
    const { service, repository } = makeDependencies();

    const result = await service.create(createRequest);

    assert.equal(result.confirmationToken, 'opaque-confirmation-token');
    assert.equal(result.intent.id, 'pi_demo_1');
    assert.equal(result.intent.status, 'PENDING_CONFIRMATION');
    assert.equal(result.intent.recipient.displayName, 'María López');
    assert.equal(result.intent.quote.fee.value, 0);
    assert.equal(result.intent.simulation, true);
    assert.equal(result.intent.confirmationTokenHash, undefined);
    assert.deepEqual(result.intent.events.map(event => event.type), [
        'intent.created',
        'intent.confirmation_requested',
    ]);
    assert.notEqual(repository.findById('pi_demo_1').confirmationTokenHash, 'opaque-confirmation-token');
});

test('replays the original creation and rejects a changed payload', async () => {
    const { service, repository } = makeDependencies();

    const first = await service.create(createRequest);
    const repeated = await service.create(createRequest);

    assert.deepEqual(repeated, first);
    assert.equal(repository.listForAdmin().length, 1);
    await assert.rejects(
        () => service.create({ ...createRequest, amountInMinorUnits: 30000 }),
        error => error.code === 'IDEMPOTENCY_CONFLICT',
    );
});

test('confirms once and returns the same simulated receipt on retry', async () => {
    const { service } = makeDependencies();
    const created = await service.create(createRequest);
    const confirmation = {
        userId: 'user-1',
        intentId: created.intent.id,
        idempotencyKey: 'confirm-idem-1',
        confirmationToken: created.confirmationToken,
    };

    const succeeded = await service.confirm(confirmation);
    const repeated = await service.confirm(confirmation);

    assert.equal(succeeded.status, 'SUCCEEDED');
    assert.equal(succeeded.provider.reference, 'SIM-pi_demo_1');
    assert.equal(succeeded.provider.simulation, true);
    assert.deepEqual(succeeded.events.map(event => event.type), [
        'intent.created',
        'intent.confirmation_requested',
        'intent.authorized',
        'intent.processing',
        'intent.succeeded',
    ]);
    assert.deepEqual(repeated, succeeded);
});

test('rejects confirmation by another user or with an invalid token', async () => {
    const { service } = makeDependencies();
    const created = await service.create(createRequest);

    await assert.rejects(
        () => service.confirm({
            userId: 'user-2',
            intentId: created.intent.id,
            idempotencyKey: 'confirm-other-user',
            confirmationToken: created.confirmationToken,
        }),
        error => error.code === 'PAYMENT_INTENT_FORBIDDEN',
    );
    await assert.rejects(
        () => service.confirm({
            userId: 'user-1',
            intentId: created.intent.id,
            idempotencyKey: 'confirm-bad-token',
            confirmationToken: 'wrong-token',
        }),
        error => error.code === 'INVALID_CONFIRMATION_TOKEN',
    );
});

test('allows only the owner to read and cancel a pending intent idempotently', async () => {
    const { service } = makeDependencies();
    const created = await service.create(createRequest);

    assert.equal(service.getForUser('user-1', created.intent.id).id, created.intent.id);
    assert.throws(
        () => service.getForUser('user-2', created.intent.id),
        error => error.code === 'PAYMENT_INTENT_FORBIDDEN',
    );

    const cancellation = {
        userId: 'user-1',
        intentId: created.intent.id,
        idempotencyKey: 'cancel-idem-1',
    };
    const cancelled = await service.cancel(cancellation);
    const repeated = await service.cancel(cancellation);

    assert.equal(cancelled.status, 'CANCELLED');
    assert.equal(cancelled.events.at(-1).type, 'intent.cancelled');
    assert.deepEqual(repeated, cancelled);
});

test('expires an intent before executing an expired confirmation', async () => {
    let current = nowValue;
    const { service, repository } = makeDependencies({ now: () => current });
    const created = await service.create(createRequest);
    current = new Date('2026-07-20T20:06:00.000Z');

    await assert.rejects(
        () => service.confirm({
            userId: 'user-1',
            intentId: created.intent.id,
            idempotencyKey: 'expired-confirm',
            confirmationToken: created.confirmationToken,
        }),
        error => error.code === 'PAYMENT_INTENT_EXPIRED',
    );
    assert.equal(repository.findById(created.intent.id).status, 'EXPIRED');
});

test('returns public isolated results for the admin timeline', async () => {
    const { service } = makeDependencies();
    await service.create(createRequest);

    const listed = service.listForAdmin();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].confirmationTokenHash, undefined);
    listed[0].status = 'tampered';
    assert.equal(service.listForAdmin()[0].status, 'PENDING_CONFIRMATION');
});
