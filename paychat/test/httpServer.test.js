import assert from 'node:assert/strict';
import test from 'node:test';

import { createPaychatHttpServer } from '../src/httpServer.js';

const listen = server => new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const close = server => new Promise(resolve => server.close(resolve));

test('serves health and conversation responses over HTTP', async () => {
    let handled;
    const server = createPaychatHttpServer({
        allowedOrigin: 'http://localhost:5173',
        conversationService: {
            async handle(request) {
                handled = request;
                return { sessionId: 'session-1', message: 'Resumen', simulation: true };
            },
        },
    });
    const port = await listen(server);

    try {
        const health = await fetch(`http://127.0.0.1:${port}/health`);
        assert.equal(health.status, 200);
        assert.equal((await health.json()).status, 'ok');

        const response = await fetch(`http://127.0.0.1:${port}/api/paychat/v1/messages`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer jwt',
                'Content-Type': 'application/json',
                Origin: 'http://localhost:5173',
            },
            body: JSON.stringify({ message: 'Paga 250 pesos a María' }),
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
        assert.equal(body.simulation, true);
        assert.deepEqual(handled, {
            authorization: 'Bearer jwt',
            message: 'Paga 250 pesos a María',
        });
    } finally {
        await close(server);
    }
});

test('verifies and accepts simulated WhatsApp webhooks', async () => {
    const calls = [];
    const outbox = [{ to: '5215550000001', text: 'SIMULACIÓN' }];
    const server = createPaychatHttpServer({
        conversationService: { handle: async () => ({}) },
        allowedOrigin: 'http://localhost:5173',
        whatsappVerifyToken: 'verify-me',
        whatsappAdapter: {
            async handleWebhook(input) {
                calls.push(input);
                return { processed: true };
            },
        },
        whatsappOutbox: { list: () => outbox },
    });
    const port = await listen(server);

    try {
        const verification = await fetch(`http://127.0.0.1:${port}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=challenge-123`);
        const delivery = await fetch(`http://127.0.0.1:${port}/webhooks/whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Hub-Signature-256': 'sha256=signed',
            },
            body: '{"object":"whatsapp_business_account"}',
        });
        const queued = await fetch(`http://127.0.0.1:${port}/api/paychat/v1/whatsapp/outbox`);

        assert.equal(verification.status, 200);
        assert.equal(await verification.text(), 'challenge-123');
        assert.equal(delivery.status, 200);
        assert.deepEqual(calls[0], {
            rawBody: '{"object":"whatsapp_business_account"}',
            signature: 'sha256=signed',
        });
        assert.deepEqual((await queued.json()).data, outbox);
    } finally {
        await close(server);
    }
});
