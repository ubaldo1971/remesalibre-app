import { createHash, timingSafeEqual } from 'node:crypto';

const sameSecret = (left, right) => {
    const digest = value => createHash('sha256').update(String(value)).digest();
    return timingSafeEqual(digest(left), digest(right));
};

export const authenticateDemoChannelUser = (credentials, env = process.env) => {
    const enabled = env.WHATSAPP_DEMO_IDENTITIES_ENABLED === 'true'
        && env.NODE_ENV !== 'production';
    if (!enabled) return null;

    let identities;
    try {
        identities = JSON.parse(env.WHATSAPP_DEMO_IDENTITIES_JSON || '[]');
    } catch {
        return null;
    }
    if (!Array.isArray(identities)) return null;

    const identity = identities.find(candidate => (
        candidate.phoneNumber === credentials.phoneNumber
        && sameSecret(candidate.pin, credentials.pin)
    ));
    if (!identity?.id || !identity?.firstName) return null;

    return {
        id: identity.id,
        phone_number: identity.phoneNumber,
        first_name: identity.firstName,
        last_name: identity.lastName || '',
        email: identity.email || null,
        role: 'user',
        status: 'active',
    };
};
