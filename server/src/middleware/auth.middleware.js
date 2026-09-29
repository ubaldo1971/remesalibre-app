import { jwtService } from '../services/jwt.service.js';
import { db } from '../services/db.service.js';

/**
 * Authentication Middleware
 * Protects routes by verifying JWT access tokens
 */

/**
 * Middleware to verify JWT and attach user to request
 * Use this for routes that require authentication
 */
export const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
                code: 'NO_TOKEN'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token
        const decoded = jwtService.verifyAccessToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }

        // Attach user info to request
        req.user = {
            id: decoded.userId,
            phone: decoded.phone,
            role: decoded.role || 'user'
        };

        // Optionally fetch full user from database
        const user = db.findUserById(decoded.userId);
        if (user) {
            req.user = {
                ...req.user,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: user.role || req.user.role,
                status: user.status
            };
        }

        next();
    } catch (error) {
        console.error('[Auth Middleware] Error:', error.message);
        return res.status(401).json({
            success: false,
            error: 'Authentication failed',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't block if no token
 * Useful for routes that work differently for authenticated vs anonymous users
 */
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwtService.verifyAccessToken(token);

            if (decoded) {
                req.user = {
                    id: decoded.userId,
                    phone: decoded.phone,
                    role: decoded.role || 'user'
                };

                const user = db.findUserById(decoded.userId);
                if (user) {
                    req.user = {
                        ...req.user,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        role: user.role || req.user.role,
                        status: user.status
                    };
                }
            }
        }

        next();
    } catch (error) {
        // Just continue without user
        next();
    }
};

/**
 * Role-based authorization middleware
 * Use after authenticate middleware
 * @param {string[]} roles - Array of allowed roles
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Prefer the authenticated identity role, then fall back to the directory.
        const directoryUser = db.userDirectory.find(u => u.id === req.user.id);
        const userRole = req.user.role || directoryUser?.role || 'user';

        if (roles.length > 0 && !roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN'
            });
        }

        next();
    };
};

/**
 * Rate limiting for authentication attempts
 * Simple in-memory implementation
 */
const authAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const authRateLimit = (req, res, next) => {
    const identifier = req.body.phoneNumber || req.ip;
    const now = Date.now();

    if (!authAttempts.has(identifier)) {
        authAttempts.set(identifier, { count: 1, firstAttempt: now });
        return next();
    }

    const record = authAttempts.get(identifier);

    // Reset if window has passed
    if (now - record.firstAttempt > WINDOW_MS) {
        authAttempts.set(identifier, { count: 1, firstAttempt: now });
        return next();
    }

    // Check if over limit
    if (record.count >= MAX_ATTEMPTS) {
        const remainingMs = WINDOW_MS - (now - record.firstAttempt);
        const remainingMin = Math.ceil(remainingMs / 60000);

        return res.status(429).json({
            success: false,
            error: `Too many attempts. Try again in ${remainingMin} minutes`,
            code: 'RATE_LIMITED',
            retryAfter: remainingMin
        });
    }

    record.count++;
    next();
};

export default { authenticate, optionalAuth, authorize, authRateLimit };
