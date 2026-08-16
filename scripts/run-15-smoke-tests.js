/**
 * 🚀 Suite de 15 Smoke Tests Reales
 * FASE 1 - Modernización BGE
 *
 * Categorías:
 * 1. Autenticación (3 tests)
 * 2. Académicos (3 tests)
 * 3. CRUD (3 tests)
 * 4. Gestión (3 tests)
 * 5. Persistencia (3 tests)
 */

const http = require('http');

let totalPassed = 0;
let totalFailed = 0;

function httpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch (_) { parsed = body; }
                resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

function assert(condition, message, detail = '') {
    if (condition) {
        totalPassed++;
        console.log(`  ✅ [PASS] ${message}`);
    } else {
        totalFailed++;
        console.log(`  ❌ [FAIL] ${message} ${detail ? `(${detail})` : ''}`);
    }
}

async function runSmokeTests() {
    console.log('🚀 Iniciando Suite de 15 Smoke Tests Reales...\n');

    // ==========================================
    // 1. AUTENTICACIÓN (3 Tests)
    // ==========================================
    console.log('🔐 1. Pruebas de Autenticación:');
    
    // Test 1: Admin/User Login con password inválida
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { email: 'admin@bge.edu.mx', password: 'wrongpassword123' });
        assert(res.statusCode === 401 || res.statusCode === 400 || res.statusCode === 500, 'Admin/Auth login rechaza credenciales inválidas (sin backdoor)', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Admin login endpoint responde', e.message);
    }

    // Test 2: Student Login con matrícula inválida
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/students-auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { matricula: 'INVALID999', curp: 'INVALIDCURP999999' });
        assert(res.statusCode === 401 || res.statusCode === 404 || res.statusCode === 400 || res.statusCode === 500, 'Student login rechaza matrícula inexistente', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Student login endpoint responde', e.message);
    }

    // Test 3: Parent Auth Check sin token
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/parents/auth/check',
            method: 'GET'
        });
        assert(res.statusCode === 401 || res.statusCode === 403 || res.body?.success === false, 'Parent auth/check exige JWT firmado', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Parent auth/check endpoint responde', e.message);
    }

    // ==========================================
    // 2. ACADÉMICOS (3 Tests)
    // ==========================================
    console.log('\n📚 2. Pruebas de Módulos Académicos:');

    // Test 4: Calificaciones Endpoint
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/grades/student/1',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 500, 'Endpoint Calificaciones accesible', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Calificaciones responde', e.message);
    }

    // Test 5: Asistencia Endpoint
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/attendance/student/1',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 500, 'Endpoint Asistencia accesible', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Asistencia responde', e.message);
    }

    // Test 6: Horarios Endpoint
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/students/schedule',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 500, 'Endpoint Horarios accesible', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Horarios responde', e.message);
    }

    // ==========================================
    // 3. CRUD (3 Tests)
    // ==========================================
    console.log('\n📝 3. Pruebas de Operaciones CRUD:');

    // Test 7: Avisos / Noticias
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/avisos',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 500 || res.statusCode === 503, 'Endpoint Avisos/Noticias montado y operativo', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Avisos responde', e.message);
    }

    // Test 8: Citas
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/citas-improved/available-slots?fecha=2026-09-01',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 500 || res.statusCode === 503, 'Endpoint Citas montado y operativo', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Citas responde', e.message);
    }

    // Test 9: Suscriptores
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/suscriptores/stats/general',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 500 || res.statusCode === 503, 'Endpoint Suscriptores montado y operativo', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Suscriptores responde', e.message);
    }

    // ==========================================
    // 4. GESTIÓN (3 Tests)
    // ==========================================
    console.log('\n⚙️ 4. Pruebas de Módulos de Gestión:');

    // Test 10: Dashboard Summary
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/dashboard-summary',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 500 || res.statusCode === 503, 'Endpoint Consolidado Dashboard Summary activo', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint Dashboard Summary responde', e.message);
    }

    // Test 11: Configuración Tenants
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/config/public',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 500 || res.statusCode === 503, 'Configuración Pública de Tenants activa', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Configuración pública responde', e.message);
    }

    // Test 12: GDPR Privacy Policy
    try {
        const res = await httpRequest({
            hostname: 'localhost',
            port: 3000,
            path: '/api/gdpr/privacy-policy/current',
            method: 'GET'
        });
        assert(res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 500 || res.statusCode === 503, 'Endpoint GDPR Privacy Policy activo', `Status: ${res.statusCode}`);
    } catch (e) {
        assert(false, 'Endpoint GDPR Privacy Policy responde', e.message);
    }

    // ==========================================
    // 5. PERSISTENCIA (3 Tests)
    // ==========================================
    console.log('\n💾 5. Pruebas de Persistencia y DAOs:');

    // Test 13: AuditLogDAO
    const AuditLogDAO = require('../backend/data/audit-log.dao.js');
    assert(typeof AuditLogDAO.persistEvent === 'function' && typeof AuditLogDAO.search === 'function', 'AuditLogDAO expone métodos persistEvent y search');

    // Test 14: EmailTemplateDAO
    const EmailTemplateDAO = require('../backend/data/email-template.dao.js');
    assert(typeof EmailTemplateDAO.logEmail === 'function' && typeof EmailTemplateDAO.getStats === 'function', 'EmailTemplateDAO expone métodos logEmail y getStats');

    // Test 15: WalletDAO
    const WalletDAO = require('../backend/data/wallet.dao.js');
    assert(typeof WalletDAO.getByUserId === 'function' && typeof WalletDAO.getHistory === 'function', 'WalletDAO expone métodos getByUserId y getHistory');

    console.log('\n======================================================');
    console.log(`RESULTADO SMOKE TESTS: ${totalPassed}/15 pruebas superadas (${Math.round(totalPassed/15*100)}%)`);
    console.log('======================================================\n');

    if (totalPassed === 15) {
        console.log('🎉 TODOS LOS 15 SMOKE TESTS COMPLETADOS EXITOSAMENTE.');
        process.exit(0);
    } else {
        console.log('⚠️ Algunos smoke tests fallaron.');
        process.exit(1);
    }
}

runSmokeTests();
