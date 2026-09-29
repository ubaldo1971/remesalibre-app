import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT Service
 * Handles token generation, verification, and refresh token management
 */

// Secret keys - In production, use environment variables
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'remesa-access-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'remesa-refresh-secret-key-change-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days

// Store refresh tokens (In production: use Redis or database)
const refreshTokenStore = new Map();

class JwtService {
    /**
     * Generate an access token for a user
     * @param {Object} user - User object with id, phone, etc.
     * @returns {string} JWT access token
     */
    generateAccessToken(user) {
        const payload = {
            userId: user.id,
            phone: user.phone_number || user.phoneNumber,
            role: user.role || 'user',
            type: 'access'
        };

        return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
            issuer: 'remesa-libre',
            subject: user.id
        });
    }

    /**
     * Generate a refresh token for a user
     * @param {Object} user - User object
     * @returns {string} JWT refresh token
     */
    generateRefreshToken(user) {
        const tokenId = crypto.randomUUID();

        const payload = {
            userId: user.id,
            tokenId: tokenId,
            role: user.role || 'user',
            type: 'refresh'
        };

        const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            issuer: 'remesa-libre',
            subject: user.id
        });

        // Store the refresh token ID for validation/revocation
        if (!refreshTokenStore.has(user.id)) {
            refreshTokenStore.set(user.id, new Set());
        }
        refreshTokenStore.get(user.id).add(tokenId);

        return token;
    }

    /**
     * Generate both access and refresh tokens
     * @param {Object} user - User object
     * @returns {Object} { accessToken, refreshToken }
     */
    generateTokenPair(user) {
        return {
            accessToken: this.generateAccessToken(user),
            refreshToken: this.generateRefreshToken(user)
        };
    }

    /**
     * Verify an access token
     * @param {string} token - JWT access token
     * @returns {Object|null} Decoded payload or null if invalid
     */
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
                issuer: 'remesa-libre'
            });

            if (decoded.type !== 'access') {
                return null;
            }

            return decoded;
        } catch (error) {
            console.error('[JWT] Access token verification failed:', error.message);
            return null;
        }
    }

    /**
     * Verify a refresh token
     * @param {string} token - JWT refresh token
     * @returns {Object|null} Decoded payload or null if invalid
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
                issuer: 'remesa-libre'
            });

            if (decoded.type !== 'refresh') {
                return null;
            }

            // Check if token is in the valid store
            const userTokens = refreshTokenStore.get(decoded.userId);
            if (!userTokens || !userTokens.has(decoded.tokenId)) {
                console.log('[JWT] Refresh token has been revoked');
                return null;
            }

            return decoded;
        } catch (error) {
            console.error('[JWT] Refresh token verification failed:', error.message);
            return null;
        }
    }

    /**
     * Refresh tokens - Generate new access token using refresh token
     * @param {string} refreshToken - Current refresh token
     * @returns {Object|null} New tokens or null if invalid
     */
    refreshTokens(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);

        if (!decoded) {
            return null;
        }

        // Generate new access token only (keep same refresh token)
        const newAccessToken = jwt.sign(
            {
                userId: decoded.userId,
                role: decoded.role || 'user',
                type: 'access'
            },
            ACCESS_TOKEN_SECRET,
            {
                expiresIn: ACCESS_TOKEN_EXPIRY,
                issuer: 'remesa-libre',
                subject: decoded.userId
            }
        );

        return {
            accessToken: newAccessToken
        };
    }

    /**
     * Revoke a specific refresh token
     * @param {string} token - Refresh token to revoke
     * @returns {boolean} Success status
     */
    revokeRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
                issuer: 'remesa-libre'
            });

            const userTokens = refreshTokenStore.get(decoded.userId);
            if (userTokens) {
                userTokens.delete(decoded.tokenId);
                console.log(`[JWT] Revoked refresh token for user ${decoded.userId}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error('[JWT] Error revoking token:', error.message);
            return false;
        }
    }

    /**
     * Revoke all refresh tokens for a user (logout everywhere)
     * @param {string} userId - User ID
     * @returns {boolean} Success status
     */
    revokeAllUserTokens(userId) {
        if (refreshTokenStore.has(userId)) {
            refreshTokenStore.delete(userId);
            console.log(`[JWT] Revoked all tokens for user ${userId}`);
            return true;
        }
        return false;
    }

    /**
     * Get token expiry info
     * @param {string} token - Any JWT token
     * @returns {Object|null} Expiry info or null
     */
    getTokenInfo(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded) return null;

            return {
                userId: decoded.userId,
                type: decoded.type,
                issuedAt: new Date(decoded.iat * 1000),
                expiresAt: new Date(decoded.exp * 1000),
                isExpired: Date.now() >= decoded.exp * 1000
            };
        } catch (error) {
            return null;
        }
    }
}

export const jwtService = new JwtService();
