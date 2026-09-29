const clone = value => structuredClone(value);

const fail = (message, code) => {
    const error = new Error(message);
    error.code = code;
    throw error;
};

export const createSimulatorConnector = ({
    scenario = 'success',
    now = () => new Date(),
} = {}) => {
    const executionsByKey = new Map();
    const statusesByReference = new Map();

    return {
        async execute(payment) {
            const payloadHash = JSON.stringify(payment);
            const previous = executionsByKey.get(payment.idempotencyKey);
            if (previous) {
                if (previous.payloadHash !== payloadHash) {
                    fail('Provider idempotency key reused with another payload', 'PROVIDER_IDEMPOTENCY_CONFLICT');
                }
                return clone(previous.result);
            }

            if (scenario === 'timeout') {
                fail('Simulated provider timeout', 'SIMULATED_PROVIDER_TIMEOUT');
            }

            const statusByScenario = {
                success: 'succeeded',
                rejected: 'rejected',
                under_review: 'under_review',
            };
            const status = statusByScenario[scenario];
            if (!status) fail(`Unknown simulator scenario: ${scenario}`, 'UNKNOWN_SIMULATOR_SCENARIO');

            const result = {
                status,
                providerReference: `SIM-${payment.intentId}`,
                simulation: true,
                processedAt: now().toISOString(),
            };
            executionsByKey.set(payment.idempotencyKey, { payloadHash, result: clone(result) });
            statusesByReference.set(result.providerReference, clone(result));
            return clone(result);
        },

        async getStatus(providerReference) {
            const result = statusesByReference.get(providerReference);
            return result ? clone(result) : null;
        },
    };
};
