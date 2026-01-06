// Native fetch in Node 18+

// Configuración
// Configuración
const BASE_URL = 'http://localhost:3005/api';
const ADMIN_CREDENTIALS = {
    email: 'superadmin_mlops@heroes.edu.mx',
    password: 'AdminPower123!'
};

async function runPipeline() {
    console.log('🚀 Iniciando simulación MLOps Pipeline...');

    // 1. Login
    console.log('🔑 Autenticando con superadmin_mlops...');
    let token;
    try {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });

        const data = await loginRes.json();

        // Manejar respuesta
        if ((!data.success) && (!data.tokens)) {
            console.error('Login Response:', data);
            throw new Error('Login fallido: ' + (data.message || data.error));
        }

        token = data.tokens ? data.tokens.accessToken : data.token;
        console.log('✅ Token obtenido.');

    } catch (e) {
        console.error('❌ Error fatal en autenticación:', e.message);
        return;
    }

    // 2. Registrar Modelo
    console.log('📝 Registrando modelo "dropout_prediction_v2"...');
    const regRes = await fetch(`${BASE_URL}/ai/mlops/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            name: 'dropout_prediction_v2',
            description: 'Red neuronal profunda para predecir deserción escolar',
            framework: 'tensorflow'
        })
    });
    console.log('Registration Status:', regRes.status);
    if (!regRes.ok) {
        const errData = await regRes.json();
        console.log('❌ Registration Error:', JSON.stringify(errData, null, 2));
    }

    // 3. Publicar Versión
    console.log('📦 Publicando versión 1.0.0-beta...');
    const verRes = await fetch(`${BASE_URL}/ai/mlops/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            modelName: 'dropout_prediction_v2',
            version: '1.0.0-beta',
            config: { layers: [64, 32, 1], optimizer: 'adam' },
            metrics: { accuracy: 0.92, f1_score: 0.89 }
        })
    });
    const verData = await verRes.json();
    console.log('Version Created:', verData.success ? 'SI' : verData.error);

    // 4. Reportar Métricas de Prod (Simulado)
    console.log('📊 Reportando métricas de producción...');
    await fetch(`${BASE_URL}/ai/mlops/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            modelName: 'dropout_prediction_v2',
            metrics: { latency: 45, errorRate: 0.01, driftScore: 0.05 }
        })
    });

    // 5. Consultar Dashboard
    console.log('📈 Consultando Dashboard MLOps...');
    const dashRes = await fetch(`${BASE_URL}/ai/mlops/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const dashData = await dashRes.json();
    console.log('Dashboard Data:', JSON.stringify(dashData.data, null, 2));
}

runPipeline();
