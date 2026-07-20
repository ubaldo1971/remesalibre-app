// Test script for RemesaLibre Phase 1
// Usage: node src/test-tx.js

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
    log("🚀 Starting Phase 1 Verification Tests...\n", COLORS.green);

    try {
        // 1. Health Check
        section("TEST 1: Server Health");
        try {
            const health = await axios.get('http://localhost:3000/health');
            log(`✅ Server is UP: ${JSON.stringify(health.data)}`, COLORS.green);
        } catch (e) {
            log(`❌ Server is DOWN: ${e.message}`, COLORS.red);
            process.exit(1);
        }

        // 2. User Directory (DICT) Lookup
        section("TEST 2: User Directory (DICT) Lookup");
        const phone = '+5215512345678'; // Demo user 1
        try {
            log(`🔍 Looking up phone: ${phone}`);
            const userRes = await axios.get(`${API_URL}/user/by-phone?phone=${encodeURIComponent(phone)}`);

            if (userRes.data.exists) {
                log(`✅ User Found: ${userRes.data.user.full_name} (${userRes.data.user.status})`, COLORS.green);
            } else {
                log(`❌ User not found (Unexpected)`, COLORS.red);
            }
        } catch (e) {
            log(`❌ DICT Lookup Failed: ${e.message}`, COLORS.red);
        }

        // 3. Payment Engine Quote
        section("TEST 3: Payment Engine Quote (SPI)");
        const amount = 100;
        const currency = 'USD';
        try {
            log(`💰 Requesting quote for ${amount} ${currency}...`);
            const quoteRes = await axios.post(`${API_URL}/transactions/quote`, {
                amount,
                currency,
                type: 'send'
            });

            const q = quoteRes.data.quote;
            log(`✅ Quote Received:`, COLORS.green);
            log(`   Source: ${q.amount} ${q.currency}`);
            log(`   Target: ${q.amountReceived} MXN`);
            log(`   Rate: ${q.exchangeRate}`);
            log(`   Fee: ${q.fee} ${q.currency}`);
        } catch (e) {
            log(`❌ Quote Failed: ${e.message}`, COLORS.red);
        }

        // 4. Execute Transaction (Remittance)
        section("TEST 4: Execute Remittance (USDC -> MXN)");
        const recipientPhone = '+5215587654321'; // Demo user 2
        try {
            log(`💸 Sending ${amount} ${currency} to ${recipientPhone}...`);
            const txRes = await axios.post(`${API_URL}/transactions/send`, {
                amount,
                currency,
                recipient: recipientPhone,
                note: "Test Phase 1"
            });

            if (txRes.data.success) {
                const tx = txRes.data.transaction;
                log(`✅ Transaction Successful!`, COLORS.green);
                log(`   ID: ${tx.id}`);
                log(`   Status: ${tx.status}`);
                log(`   Converted: ${tx.amount_converted} ${tx.currency_converted}`);
                log(`   New Balance: ${txRes.data.newBalance}`);
            } else {
                log(`❌ Transaction Failed: ${JSON.stringify(txRes.data)}`, COLORS.red);
            }
        } catch (e) {
            log(`❌ Transaction Error: ${e.response ? JSON.stringify(e.response.data) : e.message}`, COLORS.red);
        }

        // 5. Verify Pre-Registration (New User)
        section("TEST 5: Pre-Registration (New User)");
        const newPhone = '+5215599998888';
        try {
            log(`🆕 Sending to unregistered number: ${newPhone}...`);
            const preRegTx = await axios.post(`${API_URL}/transactions/send`, {
                amount: 50,
                currency: 'USD',
                recipient: newPhone,
                note: "Welcome bonus"
            });

            if (preRegTx.data.success) {
                log(`✅ Auto-Pre-Registration Successful!`, COLORS.green);

                // Verify user exists now
                const checkUser = await axios.get(`${API_URL}/user/by-phone?phone=${encodeURIComponent(newPhone)}`);
                if (checkUser.data.exists && checkUser.data.user.status === 'pre_registered') {
                    log(`✅ User ${newPhone} is now 'pre_registered'`, COLORS.green);
                } else {
                    log(`❌ User status check failed`, COLORS.red);
                }
            }
        } catch (e) {
            log(`❌ Pre-Reg Error: ${e.message}`, COLORS.red);
        }

        log("\n✨ All Phase 1 tests completed.", COLORS.blue);

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

runTests();
