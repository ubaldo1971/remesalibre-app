import assert from 'node:assert/strict';
import test from 'node:test';

import { createAllowedOrigins } from '../src/config/cors.js';

test('allows both localhost names for the local Vite server', () => {
    const origins = createAllowedOrigins('http://localhost:5173');

    assert.equal(origins.has('http://localhost:5173'), true);
    assert.equal(origins.has('http://127.0.0.1:5173'), true);
});
