const trimTrailingSlash = value => value.replace(/\/$/, '');

const apiError = (body, statusCode) => {
    const error = new Error(body.error || 'No fue posible completar la solicitud');
    error.code = body.code || 'PAYCHAT_API_ERROR';
    error.statusCode = statusCode;
    return error;
};

export const createPaychatApiClient = ({
    gatewayUrl = 'http://127.0.0.1:3001',
    coreApiUrl = 'http://127.0.0.1:3000/api',
    getToken,
    fetchImpl = fetch,
}) => {
    const request = async (url, options = {}) => {
        const token = getToken();
        const response = await fetchImpl(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
        const body = await response.json();
        if (!response.ok) throw apiError(body, response.status);
        return body;
    };

    return {
        sendMessage(payload) {
            return request(`${trimTrailingSlash(gatewayUrl)}/api/paychat/v1/messages`, {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },

        listAdminPaymentIntents() {
            return request(`${trimTrailingSlash(coreApiUrl)}/v1/admin/payment-intents`, {
                method: 'GET',
            });
        },
    };
};
