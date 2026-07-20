const axios = require('axios');

async function testTransaction() {
    console.log('--- DIAGNOSTIC TRANSACTION TEST ---');
    try {
        // 1. Login to get token
        console.log('Step 1: Logging in...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            phoneNumber: '+5215512345678', // Demo user
            pin: '123456'
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
        }

        const token = loginRes.data.accessToken;
        console.log('Login successful. Token obtained.');

        // 2. Check balance before
        console.log('Step 2: Checking balance before...');
        const balanceBefore = await axios.get('http://localhost:3000/api/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Balance before:', balanceBefore.data.balance);

        // 3. Send transaction
        console.log('Step 3: Sending 10 USD to self (for test)...');
        const sendRes = await axios.post('http://localhost:3000/api/transactions/send', {
            amount: 10,
            currency: 'USD',
            recipient: '+5215512345678',
            note: 'Diagnostic test',
            donationAmount: 1
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Transaction response:', JSON.stringify(sendRes.data, null, 2));

        // 4. Check balance after
        console.log('Step 4: Checking balance after...');
        const balanceAfter = await axios.get('http://localhost:3000/api/wallet/balance', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Balance after:', balanceAfter.data.balance);

        console.log('--- TEST COMPLETE ---');
    } catch (err) {
        console.error('--- TEST FAILED ---');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error:', err.message);
        }
    }
}

testTransaction();
