import assert from 'node:assert/strict';
import test from 'node:test';

import { jwtService } from '../src/services/jwt.service.js';

test('preserves the authenticated role in an access token', () => {
    const token = jwtService.generateAccessToken({
        id: 'demo-admin',
        phone_number: '+5210000000000',
        role: 'admin',
    });

    const decoded = jwtService.verifyAccessToken(token);

    assert.equal(decoded.role, 'admin');
});

test('preserves the authenticated role when refreshing an access token', () => {
    const tokens = jwtService.generateTokenPair({
        id: 'demo-admin-refresh',
        phone_number: '+5210000000000',
        role: 'admin',
    });

    const refreshed = jwtService.refreshTokens(tokens.refreshToken);
    const decoded = jwtService.verifyAccessToken(refreshed.accessToken);

    assert.equal(decoded.role, 'admin');
    jwtService.revokeRefreshToken(tokens.refreshToken);
});
