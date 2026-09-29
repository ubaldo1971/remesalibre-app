import { createHmac, randomUUID } from 'node:crypto';

const gatewayUrl = process.env.PAYCHAT_GATEWAY_URL || 'http://127.0.0.1:3001';
const appSecret = process.env.WHATSAPP_APP_SECRET;
const numberA = process.env.WHATSAPP_DEMO_NUMBER_A || '5215550000001';
const numberB = process.env.WHATSAPP_DEMO_NUMBER_B || '5215550000002';

if (!appSecret) throw new Error('WHATSAPP_APP_SECRET is required');

const event = ({ from, id, text, buttonId }) => ({
    object: 'whatsapp_business_account',
    entry: [{
        changes: [{
            field: 'messages',
            value: {
                messages: [{
                    from,
                    id,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: buttonId ? 'interactive' : 'text',
                    ...(buttonId
                        ? { interactive: { type: 'button_reply', button_reply: { id: buttonId, title: 'Acción simulada' } } }
                        : { text: { body: text } }),
                }],
            },
        }],
    }],
});

const deliver = async payload => {
    const rawBody = JSON.stringify(payload);
    const signature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const response = await fetch(`${gatewayUrl}/webhooks/whatsapp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': signature,
        },
        body: rawBody,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`${response.status}: ${body.error || 'Webhook failed'}`);
    return body;
};

const readOutbox = async () => {
    const response = await fetch(`${gatewayUrl}/api/paychat/v1/whatsapp/outbox`);
    if (!response.ok) throw new Error('The local WhatsApp outbox is not available');
    return (await response.json()).data;
};

const assert = (condition, message) => {
    if (!condition) throw new Error(`Simulation assertion failed: ${message}`);
};

const runId = randomUUID();
const before = await readOutbox();

const creationA = event({
    from: numberA,
    id: `wamid.${runId}.a.create`,
    text: 'Paga 250 pesos a María por comida',
});
await deliver(creationA);
const duplicate = await deliver(creationA);
let newMessages = (await readOutbox()).slice(before.length);
const summaryA = newMessages.find(message => message.to === numberA && message.buttons);
assert(summaryA, 'number A did not receive a confirmation summary');
const confirmId = summaryA.buttons.find(button => button.id.startsWith('confirm:'))?.id;
assert(confirmId, 'confirmation button was not generated');
await deliver(event({
    from: numberA,
    id: `wamid.${runId}.a.confirm`,
    buttonId: confirmId,
}));

await deliver(event({
    from: numberB,
    id: `wamid.${runId}.b.create`,
    text: 'Paga 80 pesos a María por prueba inversa',
}));
newMessages = (await readOutbox()).slice(before.length);
const summaryB = [...newMessages].reverse().find(message => message.to === numberB && message.buttons);
assert(summaryB, 'number B did not receive a confirmation summary');
const cancelId = summaryB.buttons.find(button => button.id.startsWith('cancel:'))?.id;
assert(cancelId, 'cancellation button was not generated');
await deliver(event({
    from: numberB,
    id: `wamid.${runId}.b.cancel`,
    buttonId: cancelId,
}));

newMessages = (await readOutbox()).slice(before.length);
const report = {
    simulation: true,
    duplicateIgnored: duplicate.duplicate === true,
    numberAReceipt: newMessages.some(message => message.to === numberA && message.text.includes('Folio: SIM-')),
    numberBNotification: newMessages.some(message => (
        message.to === numberB
        && message.text.includes('Recibiste una notificación de pago de prueba')
    )),
    numberBCancellation: newMessages.some(message => (
        message.to === numberB
        && message.text.toLowerCase().includes('cancelada')
    )),
    messagesProduced: newMessages.length,
    allClearlySimulated: newMessages.every(message => (
        message.simulation === true
        && message.text.includes('SIMULACIÓN')
    )),
};

assert(report.duplicateIgnored, 'duplicate webhook was not ignored');
assert(report.numberAReceipt, 'number A did not receive a simulated receipt');
assert(report.numberBNotification, 'number B did not receive the simulated notification');
assert(report.numberBCancellation, 'number B did not receive cancellation status');
assert(report.allClearlySimulated, 'an outbound message lacks the simulation label');

console.log(JSON.stringify(report, null, 2));
