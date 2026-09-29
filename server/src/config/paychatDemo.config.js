export const DEMO_BENEFICIARIES = Object.freeze([
    Object.freeze({
        id: 'demo-beneficiary-maria',
        aliases: Object.freeze(['maría', 'maria', 'mi mamá', 'mi mama']),
        displayName: 'María López',
        phone: '+5210000004821',
    }),
]);

export const getPaychatDemoConfig = (env = process.env) => ({
    enabled: env.PAYCHAT_DEMO_ENABLED === 'true' && env.NODE_ENV !== 'production',
    beneficiaries: DEMO_BENEFICIARIES,
});
