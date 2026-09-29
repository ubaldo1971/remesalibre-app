const fail = (message, code) => {
    const error = new Error(message);
    error.code = code;
    throw error;
};

export const createDemoQuoteService = ({
    now = () => new Date(),
    maxAmountInMinorUnits = 100000,
} = {}) => ({
    create({ type, amountInMinorUnits, currency }) {
        if (type !== 'domestic_p2p_mxn' || currency !== 'MXN') {
            fail('Only domestic MXN demo quotes are supported', 'UNSUPPORTED_DEMO_QUOTE');
        }
        if (
            !Number.isInteger(amountInMinorUnits)
            || amountInMinorUnits <= 0
            || amountInMinorUnits > maxAmountInMinorUnits
        ) {
            fail('Amount is outside demo limits', 'INVALID_AMOUNT');
        }

        const expiresAt = new Date(now().getTime() + 5 * 60 * 1000).toISOString();
        return {
            amount: { value: amountInMinorUnits, currency },
            fee: { value: 0, currency },
            total: { value: amountInMinorUnits, currency },
            expiresAt,
            simulation: true,
        };
    },
});
