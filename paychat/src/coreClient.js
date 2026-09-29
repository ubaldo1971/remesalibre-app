const makeError = (body, statusCode) => {
    const error = new Error(body.error || 'Core request failed');
    error.code = body.code || 'CORE_REQUEST_FAILED';
    error.statusCode = statusCode;
    return error;
};

export const createCoreClient = ({
    baseUrl = process.env.CORE_API_URL || 'http://127.0.0.1:3000',
    fetchImpl = fetch,
} = {}) => {
    const request = async (path, {
        authorization,
        idempotencyKey,
        body,
    }) => {
        const response = await fetchImpl(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
                'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(body),
        });
        const responseBody = await response.json();
        if (!response.ok) throw makeError(responseBody, response.status);
        return responseBody;
    };

    return {
        createPaymentIntent({
            authorization,
            idempotencyKey,
            recipientAlias,
            amountInMinorUnits,
            currency,
            concept,
            channel,
        }) {
            return request('/api/v1/payment-intents', {
                authorization,
                idempotencyKey,
                body: {
                    recipientAlias,
                    amountInMinorUnits,
                    currency,
                    concept,
                    channel,
                },
            });
        },

        confirmPaymentIntent({
            authorization,
            idempotencyKey,
            intentId,
            confirmationToken,
        }) {
            return request(`/api/v1/payment-intents/${encodeURIComponent(intentId)}/confirm`, {
                authorization,
                idempotencyKey,
                body: { confirmationToken },
            });
        },

        cancelPaymentIntent({ authorization, idempotencyKey, intentId }) {
            return request(`/api/v1/payment-intents/${encodeURIComponent(intentId)}/cancel`, {
                authorization,
                idempotencyKey,
                body: {},
            });
        },
    };
};
