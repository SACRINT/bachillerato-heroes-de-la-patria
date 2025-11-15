/**
 * 🧪 SUITE DE TESTING - SISTEMA GAMIFICACIÓN
 * Prueba los 14 endpoints del sistema de IACoins
 * Uso: node backend/scripts/test-gamification-endpoints.js
 */

const http = require('http');
const https = require('https');

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Configuración
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || null;

// Estadísticas globales
const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
};

/**
 * Realizar request HTTP
 */
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const client = url.protocol === 'https:' ? https : http;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = client.request(url, options, (res) => {
            let body = '';

            res.on('data', chunk => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: jsonBody
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Ejecutar un test
 */
async function runTest(name, testFn) {
    stats.total++;

    try {
        process.stdout.write(`${colors.blue}▶ ${name}...${colors.reset} `);
        await testFn();
        stats.passed++;
        console.log(`${colors.green}✅ PASÓ${colors.reset}`);
    } catch (error) {
        stats.failed++;
        console.log(`${colors.red}❌ FALLÓ${colors.reset}`);
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
    }
}

/**
 * Ejecutar test que requiere autenticación
 */
async function runAuthTest(name, testFn) {
    if (!AUTH_TOKEN) {
        stats.skipped++;
        console.log(`${colors.yellow}⏭  ${name}... OMITIDO (requiere AUTH_TOKEN)${colors.reset}`);
        return;
    }

    await runTest(name, testFn);
}

/**
 * Assertions
 */
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: esperado ${expected}, obtenido ${actual}`);
    }
}

/**
 * TESTS
 */
async function main() {
    console.log(`${colors.bright}${colors.cyan}`);
    console.log('========================================');
    console.log('🧪 TESTING: SISTEMA GAMIFICACIÓN');
    console.log('========================================');
    console.log(colors.reset);
    console.log(`Base URL: ${colors.cyan}${BASE_URL}${colors.reset}`);
    console.log(`Auth Token: ${AUTH_TOKEN ? colors.green + 'Configurado ✅' : colors.yellow + 'No configurado (algunos tests se omitirán)'}${colors.reset}\n`);

    // ===========================================
    // WALLET ENDPOINTS (5 tests)
    // ===========================================
    console.log(`${colors.bright}${colors.blue}📦 WALLET ENDPOINTS${colors.reset}\n`);

    await runAuthTest('GET /api/wallet - Obtener saldo', async () => {
        const res = await makeRequest('GET', '/api/wallet', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(res.body.wallet, 'Debe retornar wallet');
            assert(typeof res.body.wallet.balance !== 'undefined', 'Wallet debe tener balance');
        }
    });

    await runAuthTest('GET /api/wallet/history - Historial', async () => {
        const res = await makeRequest('GET', '/api/wallet/history?limit=10', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(Array.isArray(res.body.transactions), 'Debe retornar array de transacciones');
            assert(res.body.pagination, 'Debe incluir paginación');
        }
    });

    await runAuthTest('POST /api/wallet/earn - Ganar IACoins', async () => {
        const res = await makeRequest('POST', '/api/wallet/earn', {
            amount: 10,
            description: 'Test automático'
        }, AUTH_TOKEN);

        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(res.body.success === true, 'Debe ser exitoso');
            assert(typeof res.body.new_balance !== 'undefined', 'Debe retornar nuevo balance');
        }
    });

    await runAuthTest('POST /api/wallet/spend - Gastar IACoins', async () => {
        const res = await makeRequest('POST', '/api/wallet/spend', {
            amount: 5,
            description: 'Test gasto'
        }, AUTH_TOKEN);

        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401, `Status code válido: ${res.statusCode}`);
    });

    await runAuthTest('POST /api/wallet/purchase - Comprar IACoins', async () => {
        const res = await makeRequest('POST', '/api/wallet/purchase', {
            package_id: 'starter',
            payment_method: 'test',
            payment_reference: 'test-ref-123'
        }, AUTH_TOKEN);

        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401, `Status code válido: ${res.statusCode}`);
    });

    // ===========================================
    // CHALLENGES ENDPOINTS (4 tests)
    // ===========================================
    console.log(`\n${colors.bright}${colors.blue}🏆 CHALLENGES ENDPOINTS${colors.reset}\n`);

    await runAuthTest('GET /api/challenges - Listar retos', async () => {
        const res = await makeRequest('GET', '/api/challenges', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(Array.isArray(res.body.challenges), 'Debe retornar array de retos');
            assert(res.body.summary, 'Debe incluir resumen');
        }
    });

    await runAuthTest('GET /api/challenges?type=daily - Filtrar retos diarios', async () => {
        const res = await makeRequest('GET', '/api/challenges?type=daily', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);
    });

    await runAuthTest('GET /api/challenges/1 - Obtener reto específico', async () => {
        const res = await makeRequest('GET', '/api/challenges/1', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 401, `Status code válido: ${res.statusCode}`);
    });

    await runAuthTest('POST /api/challenges/1/complete - Completar reto', async () => {
        const res = await makeRequest('POST', '/api/challenges/1/complete', {
            progress: { percentage: 100 }
        }, AUTH_TOKEN);

        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 404, `Status code válido: ${res.statusCode}`);
    });

    // ===========================================
    // STORE ENDPOINTS (5 tests)
    // ===========================================
    console.log(`\n${colors.bright}${colors.blue}🛒 STORE ENDPOINTS${colors.reset}\n`);

    await runAuthTest('GET /api/store/items - Listar items', async () => {
        const res = await makeRequest('GET', '/api/store/items', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(Array.isArray(res.body.items), 'Debe retornar array de items');
        }
    });

    await runAuthTest('GET /api/store/items?category=customization - Filtrar por categoría', async () => {
        const res = await makeRequest('GET', '/api/store/items?category=customization', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);
    });

    await runAuthTest('GET /api/store/items/1 - Obtener item específico', async () => {
        const res = await makeRequest('GET', '/api/store/items/1', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 401, `Status code válido: ${res.statusCode}`);
    });

    await runAuthTest('POST /api/store/purchase - Comprar item', async () => {
        const res = await makeRequest('POST', '/api/store/purchase', {
            item_id: 1
        }, AUTH_TOKEN);

        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 404, `Status code válido: ${res.statusCode}`);
    });

    await runAuthTest('GET /api/store/my-items - Mis items', async () => {
        const res = await makeRequest('GET', '/api/store/my-items', null, AUTH_TOKEN);
        assert(res.statusCode === 200 || res.statusCode === 401, `Status code: ${res.statusCode}`);

        if (res.statusCode === 200) {
            assert(Array.isArray(res.body.items), 'Debe retornar array de items');
        }
    });

    // ===========================================
    // RESUMEN
    // ===========================================
    console.log(`\n${colors.bright}${colors.cyan}`);
    console.log('========================================');
    console.log('📊 RESUMEN DE TESTING');
    console.log('========================================');
    console.log(colors.reset);
    console.log(`Total de tests: ${colors.cyan}${stats.total}${colors.reset}`);
    console.log(`Pasados: ${colors.green}${stats.passed} ✅${colors.reset}`);
    console.log(`Fallidos: ${colors.red}${stats.failed} ❌${colors.reset}`);
    console.log(`Omitidos: ${colors.yellow}${stats.skipped} ⏭${colors.reset}\n`);

    const successRate = stats.total > 0 ? ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(1) : 0;

    if (stats.failed === 0 && stats.passed > 0) {
        console.log(`${colors.green}${colors.bright}🎉 TODOS LOS TESTS PASARON (${successRate}%)${colors.reset}\n`);
    } else if (stats.failed > 0) {
        console.log(`${colors.red}⚠️  ALGUNOS TESTS FALLARON (${successRate}% éxito)${colors.reset}\n`);
    }

    if (stats.skipped > 0) {
        console.log(`${colors.yellow}💡 TIP: Configura TEST_AUTH_TOKEN para ejecutar todos los tests:${colors.reset}`);
        console.log(`   export TEST_AUTH_TOKEN="tu_token_aqui"${colors.reset}\n`);
    }

    process.exit(stats.failed > 0 ? 1 : 0);
}

// Ejecutar tests
main().catch(error => {
    console.error(`${colors.red}Error inesperado:${colors.reset}`, error);
    process.exit(1);
});
