/**
 * Script de Verificación de Salida: FASE 0 Cimentación Segura
 */

const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🔍 Iniciando verificación de Criterio de Salida: FASE 0...');
    let passed = 0;
    let total = 0;

    async function test(name, fn) {
        total++;
        try {
            const ok = await fn();
            if (ok) {
                console.log(`  ✅ [PASS] ${name}`);
                passed++;
            } else {
                console.log(`  ❌ [FAIL] ${name}`);
            }
        } catch (err) {
            console.log(`  ❌ [ERROR] ${name}: ${err.message}`);
        }
    }

    // 1. Health check
    await test('Backend Health Check (GET /api/health)', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/health',
            method: 'GET'
        });
        const body = JSON.parse(res.body);
        return (res.statusCode === 200 || res.statusCode === 503) && body && body.services && body.services.memory;
    });

    // 2. Parents Login Backdoor Closed
    await test('Parents Login con credenciales falsas devuelve 401 (sin backdoor)', async () => {
        const data = JSON.stringify({ email: 'fake_parent@escuela.mx', password: 'wrongpassword' });
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/parents/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, data);
        return res.statusCode === 401;
    });

    // 3. Parents Auth Check without token -> 401
    await test('Parents Auth Check sin token devuelve 401', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/parents/auth/check',
            method: 'GET'
        });
        return res.statusCode === 401;
    });

    // 4. Parents Auth Check with forged token -> 401
    await test('Parents Auth Check con token falso/manipulado devuelve 401', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/parents/auth/check',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.token'
            }
        });
        return res.statusCode === 401;
    });

    // 5. Google OAuth signature verification
    await test('Google OAuth con token inválido devuelve 401', async () => {
        const data = JSON.stringify({ credential: 'invalid_google_id_token_12345' });
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/google',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, data);
        return res.statusCode === 401;
    });

    // 6. Trivia leaderboard DAO route
    await test('Trivia Leaderboard (GET /api/games/trivia/leaderboard)', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/games/trivia/leaderboard',
            method: 'GET'
        });
        const body = JSON.parse(res.body);
        return res.statusCode === 200 && Array.isArray(body.leaderboard);
    });

    // 7. AR Experiences route
    await test('AR Experiences (GET /api/ar/experiences)', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/ar/experiences',
            method: 'GET'
        });
        const body = JSON.parse(res.body);
        return res.statusCode === 200 && Array.isArray(body.experiences);
    });

    // 8. AR Leaderboard route
    await test('AR Leaderboard (GET /api/ar/leaderboard)', async () => {
        const res = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/ar/leaderboard',
            method: 'GET'
        });
        const body = JSON.parse(res.body);
        return res.statusCode === 200 && Array.isArray(body.leaderboard);
    });

    console.log(`\n📊 RESULTADOS: ${passed}/${total} pruebas pasadas (${Math.round(passed/total*100)}%)`);
    if (passed === total) {
        console.log('🎉 CRITERIO DE SALIDA FASE 0 CUMPLIDO AL 100%');
        process.exit(0);
    } else {
        console.log('⚠️ Existen pruebas fallidas. Revisar logs.');
        process.exit(1);
    }
}

runTests();
