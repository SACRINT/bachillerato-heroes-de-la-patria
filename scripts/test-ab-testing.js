// Native fetch in Node 18+

// Configuración
const BASE_URL = 'http://localhost:3005/api';

const ADMIN_CREDENTIALS = {
    email: 'superadmin_mlops@heroes.edu.mx',
    password: 'AdminPower123!'
};

async function runABTest() {
    console.log('🚀 Iniciando prueba A/B Testing...');

    // 1. Login Admin
    let adminToken;
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const data = await loginRes.json();
        if (!data.success && !data.tokens) throw new Error('Login Admin falló');
        adminToken = data.tokens ? data.tokens.accessToken : data.token;
        console.log('✅ Admin autenticado.');
    } catch (e) {
        console.error('❌ Error auth admin:', e.message);
        return;
    }

    // 2. Verificar Experimentos Activos
    try {
        const expRes = await fetch(`${BASE_URL}/ai/mlops/experiments`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const expData = await expRes.json();
        console.log(`📋 Experimentos activos: ${expData.data.length}`);
        if (expData.data.length > 0) {
            console.log(`   - Exp: ${expData.data[0].name} (Status: ${expData.data[0].status})`);
        }
    } catch (e) {
        console.error('Error fetching experiments:', e);
    }

    // 3. Usar usuarios pre-creados
    console.log('\n🔄 Probando asignación de variantes con usuarios persistentes (ab_1@test.com, etc)...');

    // Usuarios creados por scripts/create-ab-users.js
    const testUsers = [
        { email: 'ab_1@test.com', password: 'TestPass123!' },
        { email: 'ab_2@test.com', password: 'TestPass123!' },
        { email: 'ab_3@test.com', password: 'TestPass123!' }
    ];

    // 4. Probar Inferencia para cada usuario (Sticky Session Check)
    // El objetivo es ver si reciben siempre la misma variante.

    for (const user of testUsers) {
        // Login as user to get token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error(`❌ Login falló para ${user.email}:`, loginData);
            continue;
        }

        const userToken = loginData.tokens.accessToken;
        // console.log(`   🔑 Token obtenido para ${user.email}`);

        // Call Inference (2 veces para verificar consistencia)
        process.stdout.write(`   👤 ${user.email}: `);

        for (let k = 0; k < 2; k++) {
            const infRes = await fetch(`${BASE_URL}/ai/mlops/inference/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`
                },
                body: JSON.stringify({
                    modelName: 'dropout_prediction',
                    inputData: { grades: [8, 9, 7] }
                })
            });
            const infData = await infRes.json();

            if (infData.success && infData.meta.experiment) {
                const variantName = infData.meta.experiment.variant;
                process.stdout.write(`[Iter ${k + 1}: ${variantName}] `);
            } else {
                process.stdout.write(`[Iter ${k + 1}: NO VARIANT] `);
            }
        }
        console.log(''); // Newline
    }
}

runABTest();
