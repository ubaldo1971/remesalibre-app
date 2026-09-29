import { createPaychatConversationService } from './conversation.service.js';
import { createCoreClient } from './coreClient.js';
import { createPaychatHttpServer } from './httpServer.js';
import { createDemoWhatsAppIdentityService } from './whatsapp/demoWhatsAppIdentity.service.js';
import { createMemoryWhatsAppTransport } from './whatsapp/memoryWhatsApp.transport.js';
import { createWhatsAppAdapter } from './whatsapp/whatsappAdapter.js';

const parseJsonSetting = (name, fallback = {}) => {
    const value = process.env[name];
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        throw new Error(`${name} must contain valid JSON`);
    }
};

const normalizeAlias = value => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const port = Number(process.env.PAYCHAT_PORT || 3001);
const host = process.env.PAYCHAT_HOST || '127.0.0.1';
const coreClient = createCoreClient({
    baseUrl: process.env.CORE_API_URL || 'http://127.0.0.1:3000',
});
const conversationService = createPaychatConversationService({ coreClient });
const whatsappDemoEnabled = process.env.WHATSAPP_DEMO_ENABLED === 'true'
    && process.env.NODE_ENV !== 'production';
let whatsapp = {};

if (whatsappDemoEnabled) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!appSecret || !verifyToken) {
        throw new Error('WhatsApp demo requires WHATSAPP_APP_SECRET and WHATSAPP_VERIFY_TOKEN');
    }

    const recipientBindings = parseJsonSetting('WHATSAPP_DEMO_RECIPIENTS_JSON');
    const outbox = createMemoryWhatsAppTransport();
    whatsapp = {
        whatsappVerifyToken: verifyToken,
        whatsappOutbox: outbox,
        whatsappAdapter: createWhatsAppAdapter({
            appSecret,
            conversationService,
            outboundTransport: outbox,
            identityService: createDemoWhatsAppIdentityService({
                coreBaseUrl: process.env.CORE_API_URL || 'http://127.0.0.1:3000',
                bindings: parseJsonSetting('WHATSAPP_DEMO_BINDINGS_JSON'),
            }),
            beneficiaryDirectory: {
                resolveChannelRecipient(alias) {
                    return recipientBindings[normalizeAlias(alias)] || null;
                },
            },
        }),
    };
}

const server = createPaychatHttpServer({
    conversationService,
    allowedOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    ...whatsapp,
});

server.listen(port, host, () => {
    console.log(`[PayChat] Simulated gateway listening at http://${host}:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
