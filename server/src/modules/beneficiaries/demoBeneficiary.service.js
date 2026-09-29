import { DEMO_BENEFICIARIES } from '../../config/paychatDemo.config.js';

const normalize = value => value
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const maskPhone = phone => `******${phone.slice(-4)}`;

export const createDemoBeneficiaryService = ({
    enabled = process.env.PAYCHAT_DEMO_ENABLED === 'true',
    nodeEnv = process.env.NODE_ENV,
    beneficiaries = DEMO_BENEFICIARIES,
} = {}) => ({
    resolveAlias(alias) {
        if (!enabled || nodeEnv === 'production') {
            return { status: 'unavailable', candidates: [] };
        }

        const normalizedAlias = normalize(alias);
        const beneficiary = beneficiaries.find(item =>
            item.aliases.some(candidate => normalize(candidate) === normalizedAlias));

        if (!beneficiary) return { status: 'not_found', candidates: [] };

        return {
            status: 'resolved',
            beneficiary: {
                id: beneficiary.id,
                displayName: beneficiary.displayName,
                maskedPhone: maskPhone(beneficiary.phone),
            },
        };
    },
});
