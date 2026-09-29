const paymentPattern = /^(?:paga|pagar|envía|envia|enviar)\s+\$?(\d+(?:[.,]\d{1,2})?)\s*(?:pesos?|mxn)?\s+a\s+(.+?)(?:\s+(?:por|para)\s+(.+))?$/iu;

const toMinorUnits = value => {
    const normalized = value.replace(',', '.');
    const [whole, decimals = ''] = normalized.split('.');
    return (Number(whole) * 100) + Number(decimals.padEnd(2, '0'));
};

export const parsePaychatMessage = rawMessage => {
    const message = String(rawMessage || '').trim();
    if (/^\/pagar$/iu.test(message)) {
        return {
            intent: 'send_payment',
            slots: { currency: 'MXN' },
            missing: ['amount', 'recipient'],
        };
    }

    const match = message.match(paymentPattern);
    if (match) {
        const [, amount, recipientAlias, concept] = match;
        return {
            intent: 'send_payment',
            slots: {
                amountInMinorUnits: toMinorUnits(amount),
                currency: 'MXN',
                recipientAlias: recipientAlias.trim(),
                concept: concept?.trim() || 'Sin concepto',
            },
            missing: [],
        };
    }

    return { intent: 'help', slots: {}, missing: [] };
};
