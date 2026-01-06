
const API_URL = 'http://localhost:3000/api';

async function testAnalytics() {
    try {
        console.log(`1. Autenticando como Admin en ${API_URL}...`);

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@heroes.edu.mx',
                password: 'AdminPass123!'
            })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Auth exitosa. Token recibido.');

        console.log('\n2. Ejecutando Análisis de Riesgo (POST /analytics/predict/run)...');
        const runRes = await fetch(`${API_URL}/analytics/predict/run`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const runData = await runRes.json();
        console.log('✅ Análisis ejecutado:', runData);

        console.log('\n3. Obteniendo Dashboard (GET /analytics/dashboard/risk)...');
        const dashRes = await fetch(`${API_URL}/analytics/dashboard/risk`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const dashData = await dashRes.json();
        console.log('✅ Datos de Dashboard:', JSON.stringify(dashData, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testAnalytics();
