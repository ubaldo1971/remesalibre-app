// Test script for RemesaLibre Phase 3: Cash-out
// Usage: node src/test-cashout.js

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
    log("🚀 Starting Phase 3 (Cash-out) Verification Tests...\n", COLORS.green);

    try {
        // 1. SPEI Withdrawal
        section("TEST 1: SPEI Withdrawal (Bank Transfer)");
        const speiAmount = 200;
        try {
            log(`🏦 Requesting SPEI withdrawal of $${speiAmount} MXN for User 2...`);
            const speiRes = await axios.post(`${API_URL}/cashout/request`, {
                user_id: 'user-2',
                amount_mxn: speiAmount,
                method: 'bank_spei',
                destination: {
                    clabe: '012345678901234567',
                    bank_name: 'BBVA'
                }
            });

            if (speiRes.data.success) {
                const req = speiRes.data.request;
                log(`✅ SPEI Successful!`, COLORS.green);
                log(`   ID: ${req.id}`);
                log(`   Ref: ${req.reference_code}`);
                log(`   Status: ${req.status}`);
                log(`   New Balance: $${speiRes.data.new_balance_mxn} MXN`);
            } else {
                throw new Error('SPEI Request failed');
            }
        } catch (e) {
            log(`❌ SPEI Failed: ${e.response ? JSON.stringify(e.response.data) : e.message}`, COLORS.red);
        }

        // 2. OXXO Withdrawal
        section("TEST 2: OXXO Withdrawal (Cash Pickup)");
        const oxxoAmount = 150;
        try {
            log(`🏪 Requesting OXXO withdrawal of $${oxxoAmount} MXN for User 2...`);
            const oxxoRes = await axios.post(`${API_URL}/cashout/request`, {
                user_id: 'user-2',
                amount_mxn: oxxoAmount,
                method: 'oxxo'
            });

            if (oxxoRes.data.success) {
                const req = oxxoRes.data.request;
                log(`✅ OXXO Successful!`, COLORS.green);
                log(`   ID: ${req.id}`);
                log(`   Ref: ${req.reference_code} (SHOW THIS AT STORE)`);
                log(`   Status: ${req.status}`);
                log(`   Msg: ${oxxoRes.data.message}`);
            } else {
                throw new Error('OXXO Request failed');
            }
        } catch (e) {
            log(`❌ OXXO Failed: ${e.response ? JSON.stringify(e.response.data) : e.message}`, COLORS.red);
        }

        // 3. Insufficient Funds
        section("TEST 3: Insufficient Funds Check");
        try {
            log(`💸 Attempting to withdraw $1,000,000 MXN...`);
            await axios.post(`${API_URL}/cashout/request`, {
                user_id: 'user-2',
                amount_mxn: 1000000,
                method: 'oxxo'
            });
            log(`❌ Error: Should have failed but succeeded`, COLORS.red);
        } catch (e) {
            if (e.response && e.response.status === 400) {
                log(`✅ Correctly rejected: ${e.response.data.message}`, COLORS.green);
            } else {
                log(`❌ Unexpected Error: ${e.message}`, COLORS.red);
            }
        }

        // 4. History
        section("TEST 4: Cashout History");
        try {
            log(`📜 Fetching history for User 2...`);
            const histRes = await axios.get(`${API_URL}/cashout/history?user_id=user-2`);

            if (histRes.data.success) {
                log(`✅ History Retrieved! Found ${histRes.data.history.length} records.`, COLORS.green);
                histRes.data.history.forEach(h => {
                    log(`   - ${h.method.toUpperCase()} $${h.amount_mxn} (${h.status})`);
                });
            }
        } catch (e) {
            log(`❌ History Failed: ${e.message}`, COLORS.red);
        }

        log("\n✨ All Phase 3 tests completed.", COLORS.blue);

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

runTests();
