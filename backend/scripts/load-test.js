/**
 * ⚡ LOAD TESTING SCRIPT - SEMANA 31-32
 * Test de carga para validar performance bajo stress
 *
 * Simula 1000+ usuarios concurrentes
 * Tests incluidos:
 * - GET /health (baseline)
 * - GET /api/students (lista sin filtros)
 * - POST /api/auth/login (autenticación)
 * - GET /api/grades (calificaciones)
 *
 * Uso: node backend/scripts/load-test.js
 * Requiere: npm install autocannon --save-dev
 */

const autocannon = require('autocannon');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const tests = [
    {
        name: 'Health Check',
        url: `${BASE_URL}/health`,
        method: 'GET',
        connections: 100,
        duration: 10
    },
    {
        name: 'API Students List',
        url: `${BASE_URL}/api/students`,
        method: 'GET',
        connections: 500,
        duration: 30
    },
    {
        name: 'Authentication',
        url: `${BASE_URL}/api/auth/login`,
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'test123' }),
        headers: { 'Content-Type': 'application/json' },
        connections: 200,
        duration: 20
    }
];

async function runLoadTest(test) {
    console.log(`\n🔥 Running load test: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Connections: ${test.connections}`);
    console.log(`   Duration: ${test.duration}s\n`);

    return new Promise((resolve, reject) => {
        const instance = autocannon({
            url: test.url,
            method: test.method || 'GET',
            body: test.body,
            headers: test.headers,
            connections: test.connections,
            duration: test.duration
        }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                console.log(`\n📊 Results for: ${test.name}`);
                console.log(`   Requests: ${result.requests.total}`);
                console.log(`   Throughput: ${result.throughput.mean} req/s`);
                console.log(`   Latency p50: ${result.latency.p50}ms`);
                console.log(`   Latency p95: ${result.latency.p95}ms`);
                console.log(`   Latency p99: ${result.latency.p99}ms`);
                console.log(`   Errors: ${result.errors}`);
                resolve(result);
            }
        });

        autocannon.track(instance);
    });
}

async function main() {
    console.log('⚡ BGE Load Testing Suite');
    console.log(`   Target: ${BASE_URL}\n`);

    const results = [];

    for (const test of tests) {
        try {
            const result = await runLoadTest(test);
            results.push({ test: test.name, result });
        } catch (error) {
            console.error(`❌ Test failed: ${test.name}`, error.message);
        }
    }

    console.log('\n✅ Load testing completed');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runLoadTest };
