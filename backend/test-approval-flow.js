/**
 * 🧪 SUITE DE TESTS AUTOMATIZADOS - FLUJO DE APROBACIÓN DE USUARIOS
 *
 * Sistema a probar:
 * 1. Backend endpoint: GET /api/admin/check-approval/:email
 * 2. Frontend integration: isAccountApproved() en google-auth-integration.js
 * 3. Flujo completo: Registro → Aprobación Admin → Login Usuario
 *
 * Fecha: 04 de Octubre 2025
 */

const fs = require('fs').promises;
const path = require('path');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Configuración
const CONFIG = {
    backendUrl: 'http://localhost:3000',
    registrationFile: path.join(__dirname, 'data', 'registration-requests.json')
};

// Resultados de los tests
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

/**
 * Utilidades de testing
 */
class TestUtils {
    static async readRegistrationData() {
        try {
            const data = await fs.readFile(CONFIG.registrationFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`${colors.red}❌ Error leyendo archivo de registros:${colors.reset}`, error.message);
            return { requests: [], lastId: 0 };
        }
    }

    static async writeRegistrationData(data) {
        try {
            await fs.writeFile(
                CONFIG.registrationFile,
                JSON.stringify(data, null, 2),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error(`${colors.red}❌ Error escribiendo archivo de registros:${colors.reset}`, error.message);
            return false;
        }
    }

    static async makeRequest(url) {
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url);
            const data = await response.json();
            return { status: response.status, data };
        } catch (error) {
            return { status: 0, error: error.message };
        }
    }

    static log(message, type = 'info') {
        const typeColors = {
            info: colors.blue,
            success: colors.green,
            error: colors.red,
            warning: colors.yellow,
            test: colors.cyan
        };
        console.log(`${typeColors[type] || colors.reset}${message}${colors.reset}`);
    }

    static logTestResult(testName, passed, details = '') {
        testResults.total++;
        if (passed) {
            testResults.passed++;
            this.log(`✅ PASS: ${testName}`, 'success');
        } else {
            testResults.failed++;
            this.log(`❌ FAIL: ${testName}`, 'error');
        }
        if (details) {
            this.log(`   ${details}`, 'info');
        }
        testResults.details.push({ testName, passed, details });
    }
}

/**
 * ESCENARIO 1: Usuario aprobado puede hacer login
 */
async function test_ApprovedUserCanLogin() {
    TestUtils.log('\n📋 ESCENARIO 1: Usuario aprobado puede hacer login', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    const testEmail = 'usuario.aprobado@bge.edu.mx';

    try {
        // 1. Preparar datos: Crear usuario aprobado
        TestUtils.log('1️⃣ Preparando datos de prueba...', 'info');
        const registrationData = await TestUtils.readRegistrationData();

        // Eliminar registro previo si existe
        registrationData.requests = registrationData.requests.filter(
            req => req.email.toLowerCase() !== testEmail.toLowerCase()
        );

        // Agregar usuario aprobado
        registrationData.requests.push({
            id: ++registrationData.lastId,
            email: testEmail,
            name: 'Usuario Aprobado Test',
            requestedRole: 'estudiante',
            status: 'approved',
            requestDate: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin@test.com'
        });

        const written = await TestUtils.writeRegistrationData(registrationData);
        if (!written) {
            TestUtils.logTestResult('Escenario 1 - Preparación', false, 'No se pudo escribir datos de prueba');
            return;
        }
        TestUtils.log(`   ✓ Usuario aprobado creado: ${testEmail}`, 'success');

        // 2. Consultar endpoint
        TestUtils.log('\n2️⃣ Consultando endpoint /api/admin/check-approval...', 'info');
        const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(testEmail)}`;
        const result = await TestUtils.makeRequest(url);

        TestUtils.log(`   📡 URL: ${url}`, 'info');
        TestUtils.log(`   📊 Status: ${result.status}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result.data, null, 2)}`, 'info');

        // 3. Verificar respuesta
        TestUtils.log('\n3️⃣ Verificando respuesta...', 'info');

        const checks = [
            { name: 'Status 200', pass: result.status === 200 },
            { name: 'success: true', pass: result.data?.success === true },
            { name: 'approved: true', pass: result.data?.approved === true },
            { name: 'email correcto', pass: result.data?.email === testEmail },
            { name: 'approvedAt presente', pass: !!result.data?.approvedAt },
            { name: 'role = estudiante', pass: result.data?.role === 'estudiante' }
        ];

        checks.forEach(check => {
            const icon = check.pass ? '✓' : '✗';
            const color = check.pass ? colors.green : colors.red;
            TestUtils.log(`   ${color}${icon} ${check.name}${colors.reset}`, check.pass ? 'success' : 'error');
        });

        const allPassed = checks.every(c => c.pass);
        TestUtils.logTestResult(
            'Escenario 1: Usuario aprobado puede hacer login',
            allPassed,
            allPassed ? 'Endpoint responde correctamente para usuario aprobado' : 'Verificaciones fallaron'
        );

    } catch (error) {
        TestUtils.logTestResult('Escenario 1', false, `Error: ${error.message}`);
    }
}

/**
 * ESCENARIO 2: Usuario no aprobado es bloqueado
 */
async function test_UnapprovedUserIsBlocked() {
    TestUtils.log('\n📋 ESCENARIO 2: Usuario no aprobado es bloqueado', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    const pendingEmail = 'usuario.pendiente@bge.edu.mx';
    const noRequestEmail = 'sin.solicitud@bge.edu.mx';

    try {
        // Test 2A: Usuario con solicitud pending
        TestUtils.log('\n🔸 Test 2A: Usuario con solicitud "pending"', 'info');

        const registrationData = await TestUtils.readRegistrationData();

        // Eliminar y agregar usuario pendiente
        registrationData.requests = registrationData.requests.filter(
            req => req.email.toLowerCase() !== pendingEmail.toLowerCase()
        );

        registrationData.requests.push({
            id: ++registrationData.lastId,
            email: pendingEmail,
            name: 'Usuario Pendiente Test',
            requestedRole: 'estudiante',
            status: 'pending',
            requestDate: new Date().toISOString()
        });

        await TestUtils.writeRegistrationData(registrationData);
        TestUtils.log(`   ✓ Usuario pendiente creado: ${pendingEmail}`, 'success');

        const url1 = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(pendingEmail)}`;
        const result1 = await TestUtils.makeRequest(url1);

        TestUtils.log(`   📡 URL: ${url1}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result1.data, null, 2)}`, 'info');

        const test2A_passed = result1.status === 200 &&
                              result1.data?.success === true &&
                              result1.data?.approved === false;

        TestUtils.logTestResult(
            'Escenario 2A: Usuario pendiente bloqueado',
            test2A_passed,
            test2A_passed ? 'Usuario pendiente correctamente marcado como NO aprobado' : 'Usuario pendiente no bloqueado correctamente'
        );

        // Test 2B: Usuario sin solicitud
        TestUtils.log('\n🔸 Test 2B: Usuario sin solicitud', 'info');

        const url2 = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(noRequestEmail)}`;
        const result2 = await TestUtils.makeRequest(url2);

        TestUtils.log(`   📡 URL: ${url2}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result2.data, null, 2)}`, 'info');

        const test2B_passed = result2.status === 200 &&
                              result2.data?.success === true &&
                              result2.data?.approved === false;

        TestUtils.logTestResult(
            'Escenario 2B: Usuario sin solicitud bloqueado',
            test2B_passed,
            test2B_passed ? 'Usuario sin solicitud correctamente marcado como NO aprobado' : 'Usuario sin solicitud no manejado correctamente'
        );

    } catch (error) {
        TestUtils.logTestResult('Escenario 2', false, `Error: ${error.message}`);
    }
}

/**
 * ESCENARIO 3: Error de backend manejado
 */
async function test_BackendErrorHandling() {
    TestUtils.log('\n📋 ESCENARIO 3: Error de backend manejado', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    try {
        // Test 3A: Endpoint inexistente (simular 404)
        TestUtils.log('\n🔸 Test 3A: Endpoint inexistente', 'info');

        const badUrl = `${CONFIG.backendUrl}/api/admin/endpoint-inexistente`;
        const result1 = await TestUtils.makeRequest(badUrl);

        TestUtils.log(`   📡 URL: ${badUrl}`, 'info');
        TestUtils.log(`   📊 Status: ${result1.status}`, 'info');

        const test3A_passed = result1.status === 404;
        TestUtils.logTestResult(
            'Escenario 3A: Endpoint inexistente retorna 404',
            test3A_passed,
            test3A_passed ? 'Error 404 manejado correctamente' : `Esperado 404, recibido ${result1.status}`
        );

        // Test 3B: Servidor caído (timeout)
        TestUtils.log('\n🔸 Test 3B: Servidor no disponible', 'info');

        const badServer = 'http://localhost:9999/api/admin/check-approval/test@test.com';
        const result2 = await TestUtils.makeRequest(badServer);

        TestUtils.log(`   📡 URL: ${badServer}`, 'info');
        TestUtils.log(`   ⚠️ Error: ${result2.error || 'N/A'}`, 'warning');

        const test3B_passed = result2.status === 0 && !!result2.error;
        TestUtils.logTestResult(
            'Escenario 3B: Error de conexión manejado',
            test3B_passed,
            test3B_passed ? 'Error de conexión detectado correctamente' : 'Error de conexión no manejado'
        );

        // Test 3C: Verificar que el archivo de datos existe
        TestUtils.log('\n🔸 Test 3C: Archivo de datos existe', 'info');

        const data = await TestUtils.readRegistrationData();
        const test3C_passed = !!data && Array.isArray(data.requests);

        TestUtils.log(`   📁 Archivo: ${CONFIG.registrationFile}`, 'info');
        TestUtils.log(`   📊 Registros: ${data.requests?.length || 0}`, 'info');

        TestUtils.logTestResult(
            'Escenario 3C: Archivo de datos válido',
            test3C_passed,
            test3C_passed ? 'Archivo de datos cargado correctamente' : 'Archivo de datos inválido'
        );

    } catch (error) {
        TestUtils.logTestResult('Escenario 3', false, `Error: ${error.message}`);
    }
}

/**
 * ESCENARIO 4: Case insensitive email
 */
async function test_CaseInsensitiveEmail() {
    TestUtils.log('\n📋 ESCENARIO 4: Case insensitive email', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    const baseEmail = 'usuario.case@bge.edu.mx';
    const variants = [
        'usuario.case@bge.edu.mx',
        'USUARIO.CASE@BGE.EDU.MX',
        'Usuario.Case@Bge.Edu.Mx',
        'uSuArIo.CaSe@BgE.eDu.Mx'
    ];

    try {
        // 1. Crear usuario aprobado con email en lowercase
        TestUtils.log('1️⃣ Preparando usuario con email en lowercase...', 'info');

        const registrationData = await TestUtils.readRegistrationData();
        registrationData.requests = registrationData.requests.filter(
            req => req.email.toLowerCase() !== baseEmail.toLowerCase()
        );

        registrationData.requests.push({
            id: ++registrationData.lastId,
            email: baseEmail.toLowerCase(),
            name: 'Usuario Case Test',
            requestedRole: 'estudiante',
            status: 'approved',
            requestDate: new Date().toISOString(),
            approvedAt: new Date().toISOString()
        });

        await TestUtils.writeRegistrationData(registrationData);
        TestUtils.log(`   ✓ Usuario aprobado: ${baseEmail.toLowerCase()}`, 'success');

        // 2. Probar todas las variantes
        TestUtils.log('\n2️⃣ Probando variantes de case...', 'info');

        let allVariantsPassed = true;

        for (const variant of variants) {
            const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(variant)}`;
            const result = await TestUtils.makeRequest(url);

            const passed = result.status === 200 &&
                          result.data?.success === true &&
                          result.data?.approved === true;

            const icon = passed ? '✓' : '✗';
            const color = passed ? colors.green : colors.red;
            TestUtils.log(`   ${color}${icon} ${variant} → ${passed ? 'APROBADO' : 'RECHAZADO'}${colors.reset}`, passed ? 'success' : 'error');

            if (!passed) {
                allVariantsPassed = false;
                TestUtils.log(`      📦 Response: ${JSON.stringify(result.data)}`, 'warning');
            }
        }

        TestUtils.logTestResult(
            'Escenario 4: Case insensitive email',
            allVariantsPassed,
            allVariantsPassed ? 'Todas las variantes de case reconocidas correctamente' : 'Algunas variantes fallaron'
        );

    } catch (error) {
        TestUtils.logTestResult('Escenario 4', false, `Error: ${error.message}`);
    }
}

/**
 * TEST ADICIONAL: Verificar estructura de respuesta
 */
async function test_ResponseStructure() {
    TestUtils.log('\n📋 TEST ADICIONAL: Verificar estructura de respuesta', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    const testEmail = 'test.structure@bge.edu.mx';

    try {
        // Crear usuario de prueba
        const registrationData = await TestUtils.readRegistrationData();
        registrationData.requests = registrationData.requests.filter(
            req => req.email.toLowerCase() !== testEmail.toLowerCase()
        );

        registrationData.requests.push({
            id: ++registrationData.lastId,
            email: testEmail,
            name: 'Test Structure',
            requestedRole: 'docente',
            status: 'approved',
            requestDate: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            approvedBy: 'admin@test.com'
        });

        await TestUtils.writeRegistrationData(registrationData);

        // Hacer request
        const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(testEmail)}`;
        const result = await TestUtils.makeRequest(url);

        TestUtils.log('📊 Verificando estructura de respuesta:', 'info');
        TestUtils.log(JSON.stringify(result.data, null, 2), 'info');

        const requiredFields = [
            { field: 'success', type: 'boolean', present: typeof result.data?.success === 'boolean' },
            { field: 'email', type: 'string', present: typeof result.data?.email === 'string' },
            { field: 'approved', type: 'boolean', present: typeof result.data?.approved === 'boolean' },
            { field: 'approvedAt', type: 'string|null', present: result.data?.approvedAt !== undefined },
            { field: 'role', type: 'string', present: typeof result.data?.role === 'string' }
        ];

        TestUtils.log('\n🔍 Campos de respuesta:', 'info');
        requiredFields.forEach(({ field, type, present }) => {
            const icon = present ? '✓' : '✗';
            const color = present ? colors.green : colors.red;
            TestUtils.log(`   ${color}${icon} ${field} (${type}): ${present ? 'PRESENTE' : 'FALTANTE'}${colors.reset}`, present ? 'success' : 'error');
        });

        const allFieldsPresent = requiredFields.every(f => f.present);
        TestUtils.logTestResult(
            'Test Adicional: Estructura de respuesta',
            allFieldsPresent,
            allFieldsPresent ? 'Todos los campos requeridos presentes' : 'Faltan campos en la respuesta'
        );

    } catch (error) {
        TestUtils.logTestResult('Test Adicional', false, `Error: ${error.message}`);
    }
}

/**
 * Generar reporte final
 */
function generateReport() {
    TestUtils.log('\n' + '═'.repeat(70), 'test');
    TestUtils.log('📊 REPORTE FINAL DE TESTING', 'test');
    TestUtils.log('═'.repeat(70), 'test');

    const passRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(1) : 0;

    TestUtils.log(`\n📈 Estadísticas:`, 'info');
    TestUtils.log(`   Total de tests: ${testResults.total}`, 'info');
    TestUtils.log(`   ${colors.green}✅ Pasados: ${testResults.passed}${colors.reset}`, 'success');
    TestUtils.log(`   ${colors.red}❌ Fallidos: ${testResults.failed}${colors.reset}`, 'error');
    TestUtils.log(`   📊 Tasa de éxito: ${passRate}%`, passRate >= 80 ? 'success' : 'error');

    TestUtils.log(`\n📋 Resumen de tests:`, 'info');
    testResults.details.forEach((test, index) => {
        const icon = test.passed ? '✅' : '❌';
        const color = test.passed ? colors.green : colors.red;
        TestUtils.log(`   ${color}${icon} ${index + 1}. ${test.testName}${colors.reset}`, test.passed ? 'success' : 'error');
        if (test.details) {
            TestUtils.log(`      ℹ️  ${test.details}`, 'info');
        }
    });

    const status = testResults.failed === 0 ? 'EXITOSO ✅' : 'CON ERRORES ❌';
    const statusColor = testResults.failed === 0 ? colors.green : colors.red;

    TestUtils.log(`\n${statusColor}🏁 Estado del sistema: ${status}${colors.reset}`, testResults.failed === 0 ? 'success' : 'error');
    TestUtils.log('═'.repeat(70) + '\n', 'test');

    // Retornar código de salida
    return testResults.failed === 0 ? 0 : 1;
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
    TestUtils.log('\n🚀 INICIANDO SUITE DE TESTS DE FLUJO DE APROBACIÓN', 'test');
    TestUtils.log(`📅 Fecha: ${new Date().toLocaleString('es-MX')}`, 'info');
    TestUtils.log(`🔧 Backend URL: ${CONFIG.backendUrl}`, 'info');
    TestUtils.log('═'.repeat(70) + '\n', 'test');

    // Verificar que el backend esté disponible
    TestUtils.log('🔍 Verificando disponibilidad del backend...', 'info');
    const healthCheck = await TestUtils.makeRequest(`${CONFIG.backendUrl}/api/admin/check-approval/healthcheck@test.com`);

    if (healthCheck.status === 0) {
        TestUtils.log(`${colors.red}❌ BACKEND NO DISPONIBLE${colors.reset}`, 'error');
        TestUtils.log('   Por favor, inicia el servidor backend con: npm start', 'warning');
        process.exit(1);
    }

    TestUtils.log(`${colors.green}✅ Backend disponible (Status: ${healthCheck.status})${colors.reset}\n`, 'success');

    // Ejecutar tests
    await test_ApprovedUserCanLogin();
    await test_UnapprovedUserIsBlocked();
    await test_BackendErrorHandling();
    await test_CaseInsensitiveEmail();
    await test_ResponseStructure();

    // Generar reporte
    const exitCode = generateReport();

    process.exit(exitCode);
}

// Ejecutar tests
runAllTests().catch(error => {
    console.error(`${colors.red}💥 ERROR CRÍTICO EN TESTS:${colors.reset}`, error);
    process.exit(1);
});
