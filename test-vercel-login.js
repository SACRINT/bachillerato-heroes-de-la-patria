/**
 * Test de Login en Vercel
 * Verifica que el endpoint POST /api/auth/login funciona correctamente
 * después del fix de parámetros de PostgreSQL
 */

const http = require('https');

function testVercelLogin() {
    return new Promise((resolve, reject) => {
        const loginData = JSON.stringify({
            email: 'admin@test.com',
            password: 'Admin123!'
        });

        // Cambiar a vercel.app en lugar de localhost
        const url = new URL('https://bge-heroesdelapatria.vercel.app/api/auth/login');

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
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
                    console.log('\n═══════════════════════════════════════');
                    console.log('🧪 TEST VERCEL LOGIN');
                    console.log('═══════════════════════════════════════\n');

                    console.log(`📍 URL: ${url.href}`);
                    console.log(`📊 HTTP Status: ${res.statusCode}`);
                    console.log(`📝 Content-Type: ${res.headers['content-type']}\n`);

                    if (res.statusCode === 200) {
                        console.log('✅ LOGIN EXITOSO EN VERCEL');
                        console.log(`\n👤 Usuario: ${response.user?.nombre || response.user?.email}`);
                        console.log(`🔐 Token: ${response.tokens?.accessToken?.substring(0, 30)}...`);
                        console.log(`⏱️  Expira: ${new Date(response.tokens?.accessTokenExpiry * 1000).toLocaleString()}`);
                        console.log(`📋 Mensajeer: ${response.message}`);

                        console.log('\n═══════════════════════════════════════');
                        console.log('🎉 EL PROBLEMA DE VERCEL ESTÁ RESUELTO');
                        console.log('═══════════════════════════════════════');

                    } else if (res.statusCode === 401) {
                        console.log('❌ LOGIN FALLÓ - HTTP 401 (Unauthorized)');
                        console.log(`\n📝 Respuesta: ${JSON.stringify(response, null, 2)}`);
                        console.log('\nEsto significa que el usuario no fue encontrado o la contraseña es incorrecta.');
                        console.log('Causas posibles:');
                        console.log('  1. El usuario admin@test.com no existe en la BD de Vercel');
                        console.log('  2. La contraseña es incorrecta');
                        console.log('  3. El usuario está inactivo (status != "activo")');

                    } else {
                        console.log(`⚠️ RESPUESTA INESPERADA - HTTP ${res.statusCode}`);
                        console.log(`\n${JSON.stringify(response, null, 2)}`);
                    }

                    resolve({ statusCode: res.statusCode, data: response });

                } catch (e) {
                    console.log('❌ Error parseando respuesta JSON');
                    console.log(`Contenido crudo: ${data.substring(0, 200)}`);
                    reject(e);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error de conexión:', error.message);
            reject(error);
        });

        req.write(loginData);
        req.end();
    });
}

// Ejecutar el test
testVercelLogin()
    .then((result) => {
        process.exit(result.statusCode === 200 ? 0 : 1);
    })
    .catch((error) => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
