import { randomUUID } from 'node:crypto';

import { createDemoBeneficiaryService } from '../beneficiaries/demoBeneficiary.service.js';
import { createSimulatorConnector } from '../paymentProviders/simulator.connector.js';
import { createDemoQuoteService } from './demoQuote.service.js';
import { InMemoryPaymentIntentRepository } from './inMemoryPaymentIntent.repository.js';
import {
    createHmacConfirmationTokenFactory,
    createPaymentIntentService,
} from './paymentIntent.service.js';

export const createPaymentIntentModule = ({
    env = process.env,
    now = () => new Date(),
    idGenerator = () => `pi_${randomUUID()}`,
} = {}) => {
    const demoEnabled = env.PAYCHAT_DEMO_ENABLED === 'true' && env.NODE_ENV !== 'production';
    const repository = new InMemoryPaymentIntentRepository();
    const confirmationSecret = demoEnabled
        ? (env.PAYCHAT_CONFIRMATION_SECRET || env.JWT_SECRET || 'paychat-local-development-only')
        : 'paychat-disabled';

    const service = createPaymentIntentService({
        repository,
        beneficiaryService: createDemoBeneficiaryService({
            enabled: demoEnabled,
            nodeEnv: env.NODE_ENV,
        }),
        quoteService: createDemoQuoteService({
            now,
            maxAmountInMinorUnits: Number(env.PAYCHAT_DEMO_MAX_AMOUNT_MINOR || 100000),
        }),
        connector: createSimulatorConnector({
            scenario: env.PAYCHAT_SIMULATOR_SCENARIO || 'success',
            now,
        }),
        now,
        idGenerator,
        confirmationTokenFactory: createHmacConfirmationTokenFactory(confirmationSecret),
    });

    return {
        demoEnabled,
        repository,
        service,
    };
};
