import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { createWhatsAppAdapter } from '../src/whatsapp/whatsappAdapter.js';

const secret = 'test-webhook-secret';
const sender = '5215550000001';
const recipient = '5215550000002';

const event = ({ id, text, buttonId }) => ({
    object: 'whatsapp_business_account',
    entry: [{
        changes: [{
            field: 'messages',
            value: {
                messages: [{
                    from: sender,
                    id,
                    timestamp: '1753160000',
                    type: buttonId ? 'interactive' : 'text',
                    ...(buttonId
                        ? { interactive: { type: 'button_reply', button_reply: { id: buttonId, title: 'Confirmar' } } }
                        : { text: { body: text } }),
                }],
            },
        }],
    }],
});

const signed = payload => {
    const rawBody = JSON.stringify(payload);
    const digest = createHmac('sha256', secret).update(rawBody).digest('hex');
    return { rawBody, signature: `sha256=${digest}` };
};

test('rejects a webhook whose signature is invalid', async () => {
    const adapter = createWhatsAppAdapter({
        appSecret: secret,
        identityService: { getAuthorization: async () => 'Bearer token' },
        conversationService: { handle: async () => ({}) },
        outboundTransport: { send: async () => {} },
    });

    await assert.rejects(
        () => adapter.handleWebhook({ rawBody: JSON.stringify(event({ id: 'wamid.1', text: 'hola' })), signature: 'sha256=bad' }),
        error => error.code === 'INVALID_WEBHOOK_SIGNATURE' && error.statusCode === 401,
    );
});

test('creates, confirms and notifies two demo numbers without replaying duplicates', async () => {
    const conversationCalls = [];
    const outbound = [];
    const conversationService = {
        async handle(request) {
            conversationCalls.push(request);
            if (request.action === 'confirm') {
                return {
                    sessionId: 'session-1',
                    message: 'Simulación completada.',
                    receipt: { intentId: 'pi_1', status: 'SUCCEEDED', folio: 'SIM-pi_1', simulation: true },
                    action: null,
                };
            }
            return {
                sessionId: 'session-1',
                message: 'Encontré a María. Revisa y confirma.',
                payment: {
                    recipient: 'María López',
                    maskedPhone: '+521****4321',
                    amountInMinorUnits: 25000,
                    currency: 'MXN',
                    concept: 'comida',
                    feeInMinorUnits: 0,
                },
                action: { type: 'confirm_payment', intentId: 'pi_1' },
            };
        },
    };
    const adapter = createWhatsAppAdapter({
        appSecret: secret,
        identityService: {
            async getAuthorization(from) {
                assert.equal(from, sender);
                return 'Bearer channel-user-token';
            },
        },
        beneficiaryDirectory: {
            resolveChannelRecipient(alias) {
                assert.equal(alias, 'María López');
                return recipient;
            },
        },
        conversationService,
        outboundTransport: {
            async send(message) { outbound.push(message); },
        },
    });

    const creation = signed(event({ id: 'wamid.create', text: 'Paga 250 pesos a María por comida' }));
    const created = await adapter.handleWebhook(creation);
    const duplicate = await adapter.handleWebhook(creation);
    const confirmed = await adapter.handleWebhook(signed(event({
        id: 'wamid.confirm',
        buttonId: 'confirm:session-1',
    })));

    assert.equal(created.processed, true);
    assert.equal(duplicate.duplicate, true);
    assert.equal(confirmed.processed, true);
    assert.equal(conversationCalls.length, 2);
    assert.deepEqual(conversationCalls[0], {
        authorization: 'Bearer channel-user-token',
        message: 'Paga 250 pesos a María por comida',
    });
    assert.deepEqual(conversationCalls[1], {
        authorization: 'Bearer channel-user-token',
        sessionId: 'session-1',
        action: 'confirm',
    });
    assert.deepEqual(outbound[0].buttons, [
        { id: 'confirm:session-1', title: 'Confirmar simulación' },
        { id: 'cancel:session-1', title: 'Cancelar' },
    ]);
    assert.equal(outbound[1].to, sender);
    assert.match(outbound[1].text, /SIM-pi_1/);
    assert.equal(outbound[2].to, recipient);
    assert.match(outbound[2].text, /SIMULACIÓN/i);
});
