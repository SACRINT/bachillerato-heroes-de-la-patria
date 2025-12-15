/**
 * Script de Testing Automatizado del Flujo de Login
 * Verifica que la sesión persiste en todas las páginas
 */

const http = require('http');

// Simular login
function testLogin() {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            email: 'admin@test.com',
            password: 'Admin123!'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': loginData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('\n✅ [TEST 1] Login Request');
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Response: ${JSON.stringify(response, null, 2)}`);

                    if (res.statusCode === 200 && response.tokens?.accessToken) {
                        console.log('   ✅ Token obtenido correctamente');
                        resolve(response);
                    } else {
                        console.log('   ❌ Login falló');
                        reject(new Error('Login failed'));
                    }
                } catch (e) {
                    console.log('   ❌ Error parsing response:', e.message);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.write(loginData);
        req.end();
    });
}

// Verificar que el archivo main.js existe y está siendo servido
function testMainJsFile() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/js/main.js',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log('\n✅ [TEST 2] Verificar main.js');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);

            if (res.statusCode === 200 && res.headers['content-type'].includes('javascript')) {
                console.log('   ✅ main.js se sirve correctamente');
                resolve();
            } else {
                console.log('   ❌ main.js no se sirve correctamente');
                reject(new Error('main.js file not found or wrong MIME type'));
            }
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.end();
    });
}

// Verificar que header.html existe
function testHeaderPartial() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/partials/header.html',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log('\n✅ [TEST 3] Verificar header.html partial');
            console.log(`   Status: ${res.statusCode}`);

            if (res.statusCode === 200) {
                console.log('   ✅ header.html se carga correctamente');
                resolve();
            } else {
                console.log('   ❌ header.html no encontrado');
                reject(new Error('header.html not found'));
            }
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.end();
    });
}

// Ejecutar todos los tests
async function runTests() {
    console.log('🧪 INICIANDO TESTS AUTOMATIZADOS DEL FLUJO DE LOGIN\n');
    console.log('=' .repeat(60));

    try {
        // Test 1: Verificar main.js
        await testMainJsFile();

        // Test 2: Verificar header.html
        await testHeaderPartial();

        // Test 3: Login
        const loginResponse = await testLogin();

        console.log('\n' + '=' .repeat(60));
        console.log('\n✅ TODOS LOS TESTS PASARON\n');
        console.log('📝 Resumen:');
        console.log('   ✅ main.js se sirve correctamente');
        console.log('   ✅ header.html partial se carga correctamente');
        console.log('   ✅ Login exitoso con token recibido');
        console.log('\n📌 Próximos pasos:');
        console.log('   1. Abre http://localhost:3000 en el navegador');
        console.log('   2. Abre DevTools (F12)');
        console.log('   3. Ve a la pestaña Console');
        console.log('   4. Verifica que ves logs [MAIN.JS] y [AUTH-PATCH]');
        console.log('   5. Haz login con admin@test.com / Admin123!');
        console.log('   6. Verifica que el usuario aparece en el header');
        console.log('   7. Navega a /estudiantes.html');
        console.log('   8. Verifica que el usuario SIGUE visible en el header');
        console.log('   9. Navega a /padres.html');
        console.log('  10. Verifica que el usuario SIGUE visible en el header');

    } catch (error) {
        console.log('\n' + '=' .repeat(60));
        console.log('\n❌ TESTS FALLARON');
        console.log(`\nError: ${error.message}`);
        process.exit(1);
    }
}

runTests();
