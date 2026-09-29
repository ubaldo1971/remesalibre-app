import assert from 'node:assert/strict';
import test from 'node:test';

import { authorize } from '../src/middleware/auth.middleware.js';

const response = () => ({
    statusCode: null,
    body: null,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

test('allows an authenticated admin identity', () => {
    const req = { user: { id: 'demo-admin', role: 'admin' } };
    const res = response();
    let nextCalled = false;

    authorize('admin')(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
});

test('rejects an authenticated non-admin identity', () => {
    const req = { user: { id: 'user-1', role: 'user' } };
    const res = response();

    authorize('admin')(req, res, () => {
        throw new Error('next must not be called');
    });

    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, 'FORBIDDEN');
});
