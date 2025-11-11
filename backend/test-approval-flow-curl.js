/**
 * 🧪 SUITE DE TESTS AUTOMATIZADOS - FLUJO DE APROBACIÓN (VERSIÓN CURL)
 *
 * Sistema a probar:
 * 1. Backend endpoint: GET /api/admin/check-approval/:email
 * 2. Frontend integration: isAccountApproved() en google-auth-integration.js
 * 3. Flujo completo: Registro → Aprobación Admin → Login Usuario
 *
 * Fecha: 04 de Octubre 2025
 */

const { exec } = require('child_process');
const util = require('util');
const devLogger = require('../utils/devLogger');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);

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
            devLogger.error(`${colors.red}❌ Error leyendo archivo de registros:${colors.reset}`, error.message);
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
            devLogger.error(`${colors.red}❌ Error escribiendo archivo de registros:${colors.reset}`, error.message);
            return false;
        }
    }

    static async curlRequest(url) {
        try {
            const { stdout, stderr } = await execPromise(`curl -s "${url}"`);
            if (stderr) {
                devLogger.error(`${colors.yellow}⚠️ CURL stderr:${colors.reset}`, stderr);
            }
            return JSON.parse(stdout);
        } catch (error) {
            return { error: error.message, raw: error.stdout || '' };
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
        devLogger.log(`${typeColors[type] || colors.reset}${message}${colors.reset}`);
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

    const testEmail = 'aprobado@test.com'; // Ya existe en los datos

    try {
        TestUtils.log('1️⃣ Consultando endpoint /api/admin/check-approval...', 'info');
        const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(testEmail)}`;
        const result = await TestUtils.curlRequest(url);

        TestUtils.log(`   📡 URL: ${url}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result, null, 2)}`, 'info');

        TestUtils.log('\n2️⃣ Verificando respuesta...', 'info');

        const checks = [
            { name: 'success: true', pass: result?.success === true },
            { name: 'approved: true', pass: result?.approved === true },
            { name: 'email correcto', pass: result?.email === testEmail },
            { name: 'approvedAt presente', pass: !!result?.approvedAt },
            { name: 'role presente', pass: !!result?.role }
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

    const pendingEmail = 'pendiente@test.com';  // Ya existe como pending
    const noRequestEmail = 'sin.solicitud@bge.edu.mx';

    try {
        // Test 2A: Usuario con solicitud pending
        TestUtils.log('\n🔸 Test 2A: Usuario con solicitud "pending"', 'info');

        const url1 = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(pendingEmail)}`;
        const result1 = await TestUtils.curlRequest(url1);

        TestUtils.log(`   📡 URL: ${url1}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result1, null, 2)}`, 'info');

        const test2A_passed = result1?.success === true && result1?.approved === false;

        TestUtils.logTestResult(
            'Escenario 2A: Usuario pendiente bloqueado',
            test2A_passed,
            test2A_passed ? 'Usuario pendiente correctamente marcado como NO aprobado' : 'Usuario pendiente no bloqueado correctamente'
        );

        // Test 2B: Usuario sin solicitud
        TestUtils.log('\n🔸 Test 2B: Usuario sin solicitud', 'info');

        const url2 = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(noRequestEmail)}`;
        const result2 = await TestUtils.curlRequest(url2);

        TestUtils.log(`   📡 URL: ${url2}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result2, null, 2)}`, 'info');

        const test2B_passed = result2?.success === true && result2?.approved === false;

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
        // Test 3A: Usuario rechazado
        TestUtils.log('\n🔸 Test 3A: Usuario rechazado', 'info');

        const rejectedEmail = 'rechazado@test.com'; // Ya existe como rejected
        const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(rejectedEmail)}`;
        const result = await TestUtils.curlRequest(url);

        TestUtils.log(`   📡 URL: ${url}`, 'info');
        TestUtils.log(`   📦 Response: ${JSON.stringify(result, null, 2)}`, 'info');

        const test3A_passed = result?.success === true && result?.approved === false;
        TestUtils.logTestResult(
            'Escenario 3A: Usuario rechazado bloqueado',
            test3A_passed,
            test3A_passed ? 'Usuario rechazado correctamente marcado como NO aprobado' : 'Usuario rechazado no manejado correctamente'
        );

        // Test 3B: Verificar estructura de archivo
        TestUtils.log('\n🔸 Test 3B: Archivo de datos válido', 'info');

        const data = await TestUtils.readRegistrationData();
        const test3B_passed = !!data && Array.isArray(data.requests);

        TestUtils.log(`   📁 Archivo: ${CONFIG.registrationFile}`, 'info');
        TestUtils.log(`   📊 Registros: ${data.requests?.length || 0}`, 'info');
        TestUtils.log(`   📦 Estructura: ${JSON.stringify(data, null, 2)}`, 'info');

        TestUtils.logTestResult(
            'Escenario 3B: Archivo de datos válido',
            test3B_passed,
            test3B_passed ? 'Archivo de datos cargado correctamente' : 'Archivo de datos inválido'
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

    const baseEmail = 'MAYUSCULAS@TEST.COM'; // Ya existe aprobado
    const variants = [
        'mayusculas@test.com',
        'MAYUSCULAS@TEST.COM',
        'Mayusculas@Test.Com',
        'mAyUsCuLaS@TeSt.CoM'
    ];

    try {
        TestUtils.log('1️⃣ Probando variantes de case...', 'info');

        let allVariantsPassed = true;

        for (const variant of variants) {
            const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(variant)}`;
            const result = await TestUtils.curlRequest(url);

            const passed = result?.success === true && result?.approved === true;

            const icon = passed ? '✓' : '✗';
            const color = passed ? colors.green : colors.red;
            TestUtils.log(`   ${color}${icon} ${variant} → ${passed ? 'APROBADO' : 'RECHAZADO'}${colors.reset}`, passed ? 'success' : 'error');

            if (!passed) {
                allVariantsPassed = false;
                TestUtils.log(`      📦 Response: ${JSON.stringify(result)}`, 'warning');
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

    const testEmail = 'aprobado@test.com';

    try {
        const url = `${CONFIG.backendUrl}/api/admin/check-approval/${encodeURIComponent(testEmail)}`;
        const result = await TestUtils.curlRequest(url);

        TestUtils.log('📊 Verificando estructura de respuesta:', 'info');
        TestUtils.log(JSON.stringify(result, null, 2), 'info');

        const requiredFields = [
            { field: 'success', type: 'boolean', present: typeof result?.success === 'boolean' },
            { field: 'email', type: 'string', present: typeof result?.email === 'string' },
            { field: 'approved', type: 'boolean', present: typeof result?.approved === 'boolean' },
            { field: 'approvedAt', type: 'string|null', present: result?.approvedAt !== undefined },
            { field: 'role', type: 'string', present: typeof result?.role === 'string' }
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
 * TEST DE INTEGRACIÓN FRONTEND: Verificar método isAccountApproved
 */
async function test_FrontendIntegration() {
    TestUtils.log('\n📋 TEST DE INTEGRACIÓN FRONTEND', 'test');
    TestUtils.log('━'.repeat(70), 'test');

    try {
        TestUtils.log('📝 Verificando implementación del método isAccountApproved()...', 'info');

        const frontendFile = path.join(__dirname, '..', 'js', 'google-auth-integration.js');
        const content = await fs.readFile(frontendFile, 'utf8');

        const checks = [
            {
                name: 'Método isAccountApproved es async',
                pass: content.includes('async isAccountApproved')
            },
            {
                name: 'Usa fetch para consultar backend',
                pass: content.includes('await fetch') && content.includes('/api/admin/check-approval/')
            },
            {
                name: 'Maneja errores correctamente',
                pass: content.includes('try') && content.includes('catch') && content.includes('return false')
            },
            {
                name: 'Verifica campo approved en respuesta',
                pass: content.includes('data.approved')
            },
            {
                name: 'Usa encodeURIComponent para email',
                pass: content.includes('encodeURIComponent(email)')
            }
        ];

        TestUtils.log('\n🔍 Verificaciones de código frontend:', 'info');
        checks.forEach(check => {
            const icon = check.pass ? '✓' : '✗';
            const color = check.pass ? colors.green : colors.red;
            TestUtils.log(`   ${color}${icon} ${check.name}${colors.reset}`, check.pass ? 'success' : 'error');
        });

        const allChecksPassed = checks.every(c => c.pass);
        TestUtils.logTestResult(
            'Test Integración Frontend: isAccountApproved implementado correctamente',
            allChecksPassed,
            allChecksPassed ? 'Método frontend correctamente implementado' : 'Método frontend tiene problemas'
        );

    } catch (error) {
        TestUtils.logTestResult('Test Integración Frontend', false, `Error: ${error.message}`);
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

    // Conclusiones
    TestUtils.log('\n🎯 CONCLUSIONES:', 'test');
    if (testResults.failed === 0) {
        TestUtils.log('   ✅ El sistema de aprobación funciona correctamente', 'success');
        TestUtils.log('   ✅ Backend responde según especificación', 'success');
        TestUtils.log('   ✅ Frontend está correctamente integrado', 'success');
        TestUtils.log('   ✅ Casos edge (case sensitivity, usuarios no aprobados) manejados', 'success');
    } else {
        TestUtils.log('   ⚠️  Hay problemas que requieren atención', 'warning');
        TestUtils.log('   📝 Revisa los detalles de los tests fallidos arriba', 'warning');
    }

    TestUtils.log('═'.repeat(70) + '\n', 'test');

    return testResults;
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
    const healthCheck = await TestUtils.curlRequest(`${CONFIG.backendUrl}/api/admin/check-approval/healthcheck@test.com`);

    if (healthCheck.error) {
        TestUtils.log(`${colors.red}❌ BACKEND NO DISPONIBLE${colors.reset}`, 'error');
        TestUtils.log(`   Error: ${healthCheck.error}`, 'error');
        TestUtils.log('   Por favor, inicia el servidor backend con: npm start', 'warning');
        process.exit(1);
    }

    TestUtils.log(`${colors.green}✅ Backend disponible${colors.reset}\n`, 'success');

    // Ejecutar tests
    await test_ApprovedUserCanLogin();
    await test_UnapprovedUserIsBlocked();
    await test_BackendErrorHandling();
    await test_CaseInsensitiveEmail();
    await test_ResponseStructure();
    await test_FrontendIntegration();

    // Generar reporte
    const results = generateReport();

    // Guardar reporte en archivo
    const reportFile = path.join(__dirname, 'test-report-approval-flow.json');
    await fs.writeFile(reportFile, JSON.stringify(results, null, 2), 'utf8');
    TestUtils.log(`📄 Reporte guardado en: ${reportFile}`, 'success');

    const exitCode = results.failed === 0 ? 0 : 1;
    process.exit(exitCode);
}

// Ejecutar tests
runAllTests().catch(error => {
    devLogger.error(`${colors.red}💥 ERROR CRÍTICO EN TESTS:${colors.reset}`, error);
    process.exit(1);
});
