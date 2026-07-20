import axios from 'axios';

const API_URL = 'http://localhost:3000/api/voting';

async function testVoting() {
    console.log('--- Starting Voting System Tests ---');

    try {
        // 1. Cast a successful vote
        console.log('\n[Test 1] Casting first vote...');
        const res1 = await axios.post(`${API_URL}/vote`, {
            choice: 'optionA',
            reason: 'Me encantan los pagos programados',
            userId: 'test-user-1',
            phone: '+5215500000001'
        });
        console.log('Response:', res1.data.message);

        // 2. Attempt to vote again with same userId
        console.log('\n[Test 2] Casting vote with same userId (should fail)...');
        try {
            await axios.post(`${API_URL}/vote`, {
                choice: 'optionB',
                reason: 'Quiero votar otra vez',
                userId: 'test-user-1',
                phone: '+5215500000002'
            });
        } catch (err) {
            console.log('Caught Expected Error:', err.response.data.error);
        }

        // 3. Attempt to vote with same phone
        console.log('\n[Test 3] Casting vote with same phone (should fail)...');
        try {
            await axios.post(`${API_URL}/vote`, {
                choice: 'optionB',
                reason: 'Quiero votar otra vez con mismo cel',
                userId: 'test-user-2',
                phone: '+5215500000001'
            });
        } catch (err) {
            console.log('Caught Expected Error:', err.response.data.error);
        }

        // 4. Verify results
        console.log('\n[Test 4] Verifying results updated...');
        const res4 = await axios.get(`${API_URL}/status?userId=test-user-1`);
        console.log('Status result:', res4.data.optionA.votes, 'votos en A');
        console.log('User has voted:', res4.data.hasVoted);

        console.log('\n--- Voting System Tests Completed ---');
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) console.error('Data:', error.response.data);
    }
}

testVoting();
