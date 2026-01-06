
const API_URL = 'http://localhost:3000/api';

async function testEmotionalAnalytics() {
    try {
        console.log(`1. Autenticando como Admin...`);

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'estudiante@heroes.edu.mx',
                password: 'StudentPass123!'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Auth exitosa.');

        console.log('\n2. Tracking Emotion (POST /emotions/track)...');
        const trackRes = await fetch(`${API_URL}/emotions/track`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                emotion: 'Flow',
                source: 'TEST_SCRIPT',
                context: { test: true }
            })
        });

        const trackData = await trackRes.json();
        console.log('✅ Emotion Tracked:', trackData);

        console.log('\n3. Getting Current State (GET /emotions/current)...');
        const currentRes = await fetch(`${API_URL}/emotions/current`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const currentData = await currentRes.json();
        console.log('✅ Current State:', currentData);

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testEmotionalAnalytics();
