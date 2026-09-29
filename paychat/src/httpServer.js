import { createServer } from 'node:http';

const sendJson = (response, statusCode, body) => {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
};

const readBody = request => new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
        body += chunk;
        if (body.length > 32_768) {
            const error = new Error('Request body is too large');
            error.code = 'BODY_TOO_LARGE';
            error.statusCode = 413;
            reject(error);
            request.destroy();
        }
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
});

const readJson = async request => {
    const body = await readBody(request);
    try {
        return body ? JSON.parse(body) : {};
    } catch {
        const error = new Error('Request body must be valid JSON');
        error.code = 'INVALID_JSON';
        error.statusCode = 400;
        throw error;
    }
};

const sendText = (response, statusCode, body) => {
    response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(body);
};

/*
    The WhatsApp arguments are optional. The webhook and local outbox do not
    exist unless the development-only channel is explicitly composed.
*/
export const createPaychatHttpServer = ({
    conversationService,
    allowedOrigin,
    whatsappAdapter = null,
    whatsappVerifyToken = null,
    whatsappOutbox = null,
}) =>
    createServer(async (request, response) => {

        const origin = request.headers.origin;
        if (origin && origin === allowedOrigin) {
            response.setHeader('Access-Control-Allow-Origin', origin);
            response.setHeader('Vary', 'Origin');
            response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
            response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        }

        if (request.method === 'OPTIONS') {
            response.writeHead(origin === allowedOrigin ? 204 : 403);
            response.end();
            return;
        }

        const url = new URL(request.url, 'http://paychat.local');
        if (request.method === 'GET' && url.pathname === '/health') {
            sendJson(response, 200, {
                status: 'ok',
                service: 'paychat-gateway',
                simulation: true,
            });
            return;
        }

        if (whatsappAdapter && request.method === 'GET' && url.pathname === '/webhooks/whatsapp') {
            const valid = url.searchParams.get('hub.mode') === 'subscribe'
                && url.searchParams.get('hub.verify_token') === whatsappVerifyToken;
            if (!valid) {
                sendJson(response, 403, {
                    error: 'Webhook verification failed',
                    code: 'WEBHOOK_VERIFICATION_FAILED',
                    simulation: true,
                });
                return;
            }
            sendText(response, 200, url.searchParams.get('hub.challenge') || '');
            return;
        }

        if (whatsappAdapter && request.method === 'POST' && url.pathname === '/webhooks/whatsapp') {
            try {
                const rawBody = await readBody(request);
                const result = await whatsappAdapter.handleWebhook({
                    rawBody,
                    signature: request.headers['x-hub-signature-256'],
                });
                sendJson(response, 200, result);
            } catch (error) {
                sendJson(response, error.statusCode || 500, {
                    error: error.message,
                    code: error.code || 'WHATSAPP_WEBHOOK_ERROR',
                    simulation: true,
                });
            }
            return;
        }

        if (whatsappOutbox && request.method === 'GET' && url.pathname === '/api/paychat/v1/whatsapp/outbox') {
            sendJson(response, 200, { data: whatsappOutbox.list(), simulation: true });
            return;
        }

        if (request.method === 'POST' && url.pathname === '/api/paychat/v1/messages') {
            try {
                if (origin && origin !== allowedOrigin) {
                    const error = new Error('Origin is not allowed');
                    error.code = 'ORIGIN_NOT_ALLOWED';
                    error.statusCode = 403;
                    throw error;
                }
                const body = await readJson(request);
                const result = await conversationService.handle({
                    authorization: request.headers.authorization,
                    ...body,
                });
                sendJson(response, 200, result);
            } catch (error) {
                sendJson(response, error.statusCode || 500, {
                    error: error.message,
                    code: error.code || 'PAYCHAT_GATEWAY_ERROR',
                    simulation: true,
                });
            }
            return;
        }

        sendJson(response, 404, {
            error: 'Not found',
            code: 'NOT_FOUND',
            simulation: true,
        });
    });
