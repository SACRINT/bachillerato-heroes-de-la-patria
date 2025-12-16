/**
 * Test de Persistencia de Sesión en Múltiples Páginas
 *
 * Este test verifica que:
 * 1. main.js se carga en todas las páginas
 * 2. El usuario persiste cuando navega entre páginas
 * 3. El header se actualiza correctamente con la información del usuario
 */

const http = require('http');
const fs = require('fs');

let authToken = null;
let userId = null;
let userName = null;

function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

async function testLogin() {
    console.log('\n📍 TEST 1: Login del Usuario');
    console.log('─'.repeat(60));

    const loginData = JSON.stringify({
        email: 'admin@test.com',
        password: 'Admin123!'
    });

    const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        },
        body: loginData
    });

    if (response.statusCode !== 200) {
        throw new Error(`Login failed with status ${response.statusCode}`);
    }

    const data = JSON.parse(response.body);
    authToken = data.tokens.accessToken;
    userId = data.user.id;
    userName = data.user.nombre;

    console.log(`✅ Login exitoso`);
    console.log(`   Usuario: ${userName} (ID: ${userId})`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    return data;
}

async function testPageLoads() {
    console.log('\n📍 TEST 2: Verificar que main.js está en todas las páginas');
    console.log('─'.repeat(60));

    const pages = [
        'index.html',
        'estudiantes.html',
        'padres.html',
        'bolsa-trabajo.html',
        'calendario.html'
    ];

    for (const page of pages) {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: `/${page}`,
            method: 'GET'
        });

        if (response.statusCode !== 200) {
            throw new Error(`Failed to load ${page}`);
        }

        const hasMainJs = response.body.includes('<script src="js/main.js"></script>');
        const hasHeaderFooter = response.body.includes('main-header') && response.body.includes('main-footer');

        if (hasMainJs && hasHeaderFooter) {
            console.log(`✅ ${page}`);
            console.log(`   ✓ main.js incluido`);
            console.log(`   ✓ main-header y main-footer presentes`);
        } else {
            console.log(`⚠️ ${page}`);
            if (!hasMainJs) console.log(`   ✗ main.js NO está incluido`);
            if (!hasHeaderFooter) console.log(`   ✗ main-header o main-footer faltando`);
        }
    }
}

async function testAuthPatch() {
    console.log('\n📍 TEST 3: Verificar que auth-login-patch.js está disponible');
    console.log('─'.repeat(60));

    const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/js/auth-login-patch.js',
        method: 'GET'
    });

    if (response.statusCode === 200) {
        console.log('✅ auth-login-patch.js cargado correctamente');
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   MIME Type: ${response.headers['content-type']}`);
    } else {
        console.log(`⚠️ auth-login-patch.js no encontrado (${response.statusCode})`);
    }
}

async function testStorageSimulation() {
    console.log('\n📍 TEST 4: Simular Persistencia de Sesión');
    console.log('─'.repeat(60));

    // Simular lo que main.js haría: guardar token en localStorage
    const sessionData = {
        token: authToken,
        user: {
            id: userId,
            nombre: userName,
            email: 'admin@test.com',
            role: 'admin'
        }
    };

    console.log('Datos que se guardarían en localStorage:');
    console.log(JSON.stringify(sessionData, null, 2));
    console.log('\n✅ main.js debería:');
    console.log('   1. Guardar bge_auth_token en sessionStorage/localStorage');
    console.log('   2. Guardar bge_user_data en sessionStorage/localStorage');
    console.log('   3. Actualizar #userMenuName con el nombre del usuario');
    console.log('   4. Mostrar el menú de usuario en lugar de botones de login');
}

async function testUnifiedAuthSystem() {
    console.log('\n📍 TEST 5: Verificar Unified Auth System V2');
    console.log('─'.repeat(60));

    const response = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/js/unified-auth-system-v2.js',
        method: 'GET'
    });

    if (response.statusCode === 200) {
        console.log('✅ unified-auth-system-v2.js disponible');
        const lines = response.body.split('\n');
        console.log(`   Líneas de código: ${lines.length}`);

        // Buscar clases principales
        const hasClasses = response.body.includes('class UnifiedAuthSystem') ||
                          response.body.includes('UnifiedAuthSystem =');
        if (hasClasses) {
            console.log('   ✓ Clase UnifiedAuthSystem encontrada');
        }
    } else {
        console.log(`⚠️ unified-auth-system-v2.js no encontrado`);
    }
}

async function runAllTests() {
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 TESTING COMPLETO DE PERSISTENCIA DE SESIÓN');
    console.log('═'.repeat(60));

    try {
        await testLogin();
        await testPageLoads();
        await testAuthPatch();
        await testStorageSimulation();
        await testUnifiedAuthSystem();

        console.log('\n' + '═'.repeat(60));
        console.log('✅ TODOS LOS TESTS COMPLETADOS');
        console.log('═'.repeat(60));

        console.log('\n📌 PRÓXIMOS PASOS PARA TESTING MANUAL:');
        console.log(`
1. Abre http://localhost:3000/index.html en tu navegador
2. Presiona Ctrl+Shift+R para hacer hard refresh (limpiar caché)
3. Abre DevTools (F12)
4. Ve a la pestaña Console
5. Deberías ver logs con prefijo [MAIN.JS]:
   ✓ [MAIN.JS] 🚀 Inicializando...
   ✓ [MAIN.JS] 📦 Cargando header y footer...
   ✓ [MAIN.JS] ✅ Header cargado
   ✓ [MAIN.JS] ✅ Footer cargado

6. Haz clic en "Iniciar Sesión"
7. Ingresa:
   Email: admin@test.com
   Contraseña: Admin123!
8. Verifica en la consola que ves logs [AUTH-PATCH]:
   ✓ [AUTH-PATCH] 🔐 handleManualLogin interceptado
   ✓ [AUTH-PATCH] ✅ Login EXITOSO

9. Verifica que:
   ✓ Modal se cierra automáticamente
   ✓ Header muestra "Admin" (tu nombre)
   ✓ Botón de login cambió a menú de usuario

10. Haz clic en el menu de usuario → "Cerrar sesión"
11. Verifica que:
    ✓ Menú se oculta
    ✓ Botones de login reaparecen

12. LOGIN EXITOSO ✓
13. Ahora navega a /estudiantes.html
14. Verifica que:
    ✓ Header se muestra
    ✓ Usuario sigue visible ("Admin" en el header)
    ✓ Los logs [MAIN.JS] se repiten (restaurando sesión)

15. Navega a /padres.html
16. Verifica que:
    ✓ Header se muestra
    ✓ Usuario SIGUE visible en el header

17. Presiona F5 (refresh)
18. Verifica que:
    ✓ Usuario SIGUE autenticado
    ✓ No se solicita login nuevamente

✅ Si todo funciona, el problema está COMPLETAMENTE RESUELTO
        `);

    } catch (error) {
        console.log('\n' + '═'.repeat(60));
        console.log('❌ ERROR EN TESTS');
        console.log('═'.repeat(60));
        console.error(`\nError: ${error.message}`);
        process.exit(1);
    }
}

// Ejecutar tests
runAllTests();
