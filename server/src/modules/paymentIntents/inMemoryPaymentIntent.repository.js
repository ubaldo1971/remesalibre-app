import { assertTransition } from './paymentIntentStateMachine.js';

const clone = value => structuredClone(value);

export class InMemoryPaymentIntentRepository {
    #intents = new Map();
    #idempotency = new Map();

    create(intent, initialEvent) {
        const stored = {
            ...clone(intent),
            events: [clone(initialEvent)],
        };
        this.#intents.set(stored.id, stored);
        return clone(stored);
    }

    findById(id) {
        const intent = this.#intents.get(id);
        return intent ? clone(intent) : null;
    }

    rememberIdempotency(record) {
        this.#idempotency.set(this.#idempotencyKey(record.userId, record.key, record.operation), clone(record));
    }

    findByIdempotencyKey(userId, key, operation) {
        const record = this.#idempotency.get(this.#idempotencyKey(userId, key, operation));
        return record ? clone(record) : null;
    }

    transition(id, nextStatus, event, changes = {}) {
        const current = this.#intents.get(id);
        if (!current) return null;

        assertTransition(current.status, nextStatus);
        const updated = {
            ...current,
            ...clone(changes),
            status: nextStatus,
            events: [...current.events, clone(event)],
        };
        this.#intents.set(id, updated);
        return clone(updated);
    }

    listForAdmin() {
        return clone([...this.#intents.values()]);
    }

    reset() {
        this.#intents.clear();
        this.#idempotency.clear();
    }

    #idempotencyKey(userId, key, operation) {
        return JSON.stringify([userId, key, operation]);
    }
}
