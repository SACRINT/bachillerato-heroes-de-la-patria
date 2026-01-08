/**
 * 🏃 PERFORMANCE BENCHMARKING
 * Propósito: Scripts de pruebas de carga simple (Fase 7 - Semana 55)
 */

if (process.env.NODE_ENV === 'production') {
    console.error('❌ No ejecutar benchmarks en producción.');
    process.exit(1);
}

const apiEndpoint = 'http://localhost:3000/api/health';
const requests = 1000;
const concurrency = 50;

console.log(`🔥 Iniciando benchmark: ${requests} requests a ${apiEndpoint}, concurrencia: ${concurrency}`);

const startTime = Date.now();
let completed = 0;
let errors = 0;

async function sendRequest() {
    try {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(apiEndpoint);
        if (!res.ok) errors++;
    } catch (e) {
        errors++;
    } finally {
        completed++;
        if (completed % 100 === 0) process.stdout.write('.');
    }
}

// Simple async queue logic
async function run() {
    const promises = [];
    for (let i = 0; i < requests; i++) {
        if (promises.length >= concurrency) {
            await Promise.race(promises);
        }
        const p = sendRequest();
        p.then(() => promises.splice(promises.indexOf(p), 1));
        promises.push(p);
    }
    await Promise.all(promises);

    const duration = (Date.now() - startTime) / 1000;
    console.log('\n\n📊 Resultados:');
    console.log(`Total Requests: ${requests}`);
    console.log(`Errores: ${errors}`);
    console.log(`Tiempo Total: ${duration.toFixed(2)}s`);
    console.log(`RPS (Req/sec): ${(requests / duration).toFixed(2)}`);
}

run();
