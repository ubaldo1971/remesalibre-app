// Test script for RemesaLibre Phase 2: QR Payments
// Usage: node src/test-qr.js

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const COLORS = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

const log = (msg, color = COLORS.reset) => console.log(`${color}${msg}${COLORS.reset}`);
const section = (msg) => console.log(`\n${COLORS.cyan}=== ${msg} ===${COLORS.reset}`);

async function runTests() {
    log("🚀 Starting Phase 2 (QR) Verification Tests...\n", COLORS.green);

    try {
        // 1. Generate QR
        section("TEST 1: Generate Payment QR");
        let qrPayload = '';
        let qrAmount = 500; // MXN

        try {
            log(`📷 Generating QR for $${qrAmount} MXN...`);
            const genRes = await axios.post(`${API_URL}/qr/generate`, {
                user_id: 'user-1', // Receiver
                amount_mxn: qrAmount,
                description: "Tacos y Refrescos"
            });

            if (genRes.data.success) {
                const qr = genRes.data.qr_code;
                qrPayload = qr.payload;
                log(`✅ QR Generated!`, COLORS.green);
                log(`   ID: ${qr.id}`);
                log(`   Payload: ${qr.payload.substring(0, 30)}...`);
                log(`   Expires: ${qr.expires_at}`);
            } else {
                throw new Error('QR Generation failed');
            }
        } catch (e) {
            log(`❌ Generate Failed: ${e.message}`, COLORS.red);
            process.exit(1);
        }

        // 2. Validate QR
        section("TEST 2: Validate QR Code");
        try {
            log(`🔍 Validating scanned payload...`);
            const valRes = await axios.post(`${API_URL}/qr/validate`, {
                qr_payload: qrPayload
            });

            if (valRes.data.valid) {
                const req = valRes.data.request;
                log(`✅ QR Valid!`, COLORS.green);
                log(`   Receiver: ${req.receiver_name}`);
                log(`   Amount: $${req.amount} MXN`);
                log(`   Desc: ${req.description}`);
            } else {
                log(`❌ QR Invalid: ${valRes.data.message}`, COLORS.red);
                process.exit(1);
            }
        } catch (e) {
            log(`❌ Validation Error: ${e.message}`, COLORS.red);
        }

        // 3. Pay QR
        section("TEST 3: Pay QR Code");
        try {
            log(`💸 Paying QR with User 2...`);
            const payRes = await axios.post(`${API_URL}/qr/pay`, {
                payer_id: 'user-2',
                qr_payload: qrPayload,
                amount_input: qrAmount,
                pin: '123456'
            });

            if (payRes.data.success) {
                log(`✅ Payment Successful!`, COLORS.green);
                log(`   Paid: $${payRes.data.amount_paid_usd.toFixed(2)} USD`);
                log(`   Received: $${payRes.data.amount_received_mxn.toFixed(2)} MXN`);
                log(`   Tx ID: ${payRes.data.transaction.id}`);
            } else {
                log(`❌ Payment Failed: ${payRes.data.message}`, COLORS.red);
            }
        } catch (e) {
            log(`❌ Payment Error: ${e.response ? JSON.stringify(e.response.data) : e.message}`, COLORS.red);
        }

        // 4. Validate QR Again (Should be invalid/paid)
        section("TEST 4: Validate Paid QR (Should fail)");
        try {
            const reValRes = await axios.post(`${API_URL}/qr/validate`, {
                qr_payload: qrPayload
            });

            if (!reValRes.data.valid) {
                log(`✅ Correctly identified as invalid/paid: ${reValRes.data.message}`, COLORS.green);
            } else {
                log(`❌ Error: QR should be invalid but returned valid`, COLORS.red);
            }
        } catch (e) {
            log(`❌ Re-validation Error: ${e.message}`, COLORS.red);
        }

        log("\n✨ All Phase 2 tests completed.", COLORS.blue);

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

runTests();
