
const API_URL = 'http://localhost:3000/api';

async function testIntervention() {
    try {
        console.log(`1. Autenticando como Estudiante...`);

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

        console.log('\n2. Simulando emociones negativas (3x Frustrated)...');
        // Enviar 3 emociones negativas seguidas
        for (let i = 0; i < 3; i++) {
            await fetch(`${API_URL}/emotions/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emotion: 'Frustrated', source: 'TEST' })
            });
            console.log(`   - Frustrated logged (${i + 1}/3)`);
        }

        console.log('\n3. Checking Intervention (GET /emotions/check-intervention)...');
        const checkRes = await fetch(`${API_URL}/emotions/check-intervention`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const checkData = await checkRes.json();
        console.log('✅ Intervention Check Result:', JSON.stringify(checkData, null, 2));

        if (checkData.data && checkData.data.shouldIntervene) {
            console.log('🎉 SUCCESS: Sistema recomendó intervención correctamente.');
        } else {
            console.error('❌ FAILURE: Sistema NO recomendó intervención.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testIntervention();
