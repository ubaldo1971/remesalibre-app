const fail = (message, code, statusCode) => {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
};

export const createDemoWhatsAppIdentityService = ({
    coreBaseUrl = 'http://127.0.0.1:3000',
    bindings = {},
    fetchImpl = fetch,
}) => ({
    async getAuthorization(channelNumber) {
        const credentials = bindings[channelNumber];
        if (!credentials) {
            throw fail('WhatsApp number is not linked to a demo user', 'CHANNEL_IDENTITY_NOT_BOUND', 403);
        }

        const response = await fetchImpl(`${coreBaseUrl.replace(/\/$/, '')}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        const body = await response.json();
        if (!response.ok || !body.accessToken) {
            throw fail(body.error || 'Demo channel authentication failed', 'CHANNEL_AUTHENTICATION_FAILED', response.status || 401);
        }
        return `Bearer ${body.accessToken}`;
    },
});
