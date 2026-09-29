import assert from 'node:assert/strict';
import test from 'node:test';

import { isAdmin } from '../src/utils/adminAccess.js';

test('recognizes an administrator identity', () => {
    assert.equal(isAdmin({ role: 'admin' }), true);
});

test('rejects users without the administrator role', () => {
    assert.equal(isAdmin({ role: 'user' }), false);
    assert.equal(isAdmin(null), false);
});
