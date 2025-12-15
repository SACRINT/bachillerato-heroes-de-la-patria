#!/usr/bin/env node

/**
 * Test Script: Verificar que el modal de autenticación funciona
 * Este script simula lo que hace un navegador
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data,
                    path: path
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 TEST DE AUTENTICACIÓN MODAL - BGE');
    console.log('=' .repeat(60));
    console.log(`📍 Servidor: ${BASE_URL}`);
    console.log(`🕐 Timestamp: ${new Date().toISOString()}\n`);

    try {
        // TEST 1: Cargar index.html
        console.log('TEST 1: Cargar index.html');
        console.log('-'.repeat(60));
        const htmlRes = await makeRequest('GET', '/');
        console.log(`✅ Status: ${htmlRes.status}`);
        console.log(`📄 Tamaño HTML: ${(htmlRes.body.length / 1024).toFixed(2)} KB`);

        // Verificar que header.html está siendo cargado
        if (htmlRes.body.includes('unified-auth-system-v2.js')) {
            console.log('✅ unified-auth-system-v2.js está cargado');
        } else {
            console.log('❌ unified-auth-system-v2.js NO está cargado');
        }

        // Verificar que el fetch interceptor está presente
        if (htmlRes.body.includes('AUTH-INTERCEPTOR')) {
            console.log('✅ Fetch interceptor está presente');
        } else {
            console.log('❌ Fetch interceptor NO está presente');
        }

        // Verificar que el modal está en el HTML
        if (htmlRes.body.includes('unified-auth-modal')) {
            console.log('✅ Modal HTML está presente');
        } else {
            console.log('❌ Modal HTML NO está presente');
        }

        console.log('\n');

        // TEST 2: Prueba POST /api/auth/login
        console.log('TEST 2: POST /api/auth/login (email/contraseña)');
        console.log('-'.repeat(60));
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'test123'
        });
        console.log(`✅ Status: ${loginRes.status}`);
        console.log(`📋 Response:`);
        try {
            const loginData = JSON.parse(loginRes.body);
            console.log(JSON.stringify(loginData, null, 2));
            if (loginRes.status === 401) {
                console.log('✅ Retorna HTTP 401 (esperado - backend rechaza sin DB)');
                if (loginData.message && loginData.message.includes('Google')) {
                    console.log('✅ Mensaje menciona Google');
                } else {
                    console.log('⚠️  Mensaje no menciona Google');
                }
            } else {
                console.log(`⚠️  Status no es 401 (esperado), es ${loginRes.status}`);
            }
        } catch (e) {
            console.log('❌ Respuesta no es JSON válido');
            console.log(loginRes.body.substring(0, 200));
        }

        console.log('\n');

        // TEST 3: Prueba POST /api/auth/google
        console.log('TEST 3: POST /api/auth/google (OAuth)');
        console.log('-'.repeat(60));
        const googleRes = await makeRequest('POST', '/api/auth/google', {
            credential: 'mock-jwt-token-for-testing'
        });
        console.log(`✅ Status: ${googleRes.status}`);
        console.log(`📋 Response:`);
        try {
            const googleData = JSON.parse(googleRes.body);
            console.log(JSON.stringify(googleData, null, 2).substring(0, 500));
            if (googleRes.status === 400) {
                console.log('ℹ️  Status 400 (esperado - token inválido)');
            }
        } catch (e) {
            console.log('❌ Respuesta no es JSON válido');
        }

        console.log('\n');

        // TEST 4: Prueba POST /api/auth/register
        console.log('TEST 4: POST /api/auth/register (Registro)');
        console.log('-'.repeat(60));
        const registerRes = await makeRequest('POST', '/api/auth/register', {
            email: 'newuser@example.com',
            password: 'pass123',
            nombre: 'Test User'
        });
        console.log(`✅ Status: ${registerRes.status}`);
        console.log(`📋 Response:`);
        try {
            const registerData = JSON.parse(registerRes.body);
            console.log(JSON.stringify(registerData, null, 2));
            if (registerRes.status === 503) {
                console.log('✅ Retorna HTTP 503 (esperado - registro no disponible en Vercel)');
                if (registerData.message && registerData.message.includes('Google')) {
                    console.log('✅ Mensaje menciona Google');
                }
            }
        } catch (e) {
            console.log('❌ Respuesta no es JSON válido');
        }

        console.log('\n');

        // TEST 5: Verificar que /dist/assets/main.js existe
        console.log('TEST 5: Verificar /dist/assets/main.js');
        console.log('-'.repeat(60));
        const distRes = await makeRequest('GET', '/dist/assets/main.js');
        console.log(`✅ Status: ${distRes.status}`);
        if (distRes.status === 200) {
            console.log(`✅ /dist/assets/main.js existe (${(distRes.body.length / 1024).toFixed(2)} KB)`);
            if (distRes.body.includes('loadHeaderFooter')) {
                console.log('✅ Contiene loadHeaderFooter');
            }
        } else {
            console.log(`❌ /dist/assets/main.js retorna Status ${distRes.status}`);
        }

        console.log('\n');
        console.log('=' .repeat(60));
        console.log('✅ TESTS COMPLETADOS');
        console.log('=' .repeat(60));

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        process.exit(1);
    }
}

// Esperar a que el servidor esté listo
async function waitForServer(maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await makeRequest('GET', '/');
            console.log('✅ Servidor está listo\n');
            return;
        } catch (e) {
            if (i < maxRetries - 1) {
                console.log(`⏳ Esperando servidor... (intento ${i + 1}/${maxRetries})`);
                await new Promise(r => setTimeout(r, 1000));
            } else {
                throw e;
            }
        }
    }
}

(async () => {
    try {
        await waitForServer();
        await runTests();
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
})();
