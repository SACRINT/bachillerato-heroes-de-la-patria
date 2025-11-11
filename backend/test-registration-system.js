/**
 * 🧪 SCRIPT DE TESTING - SISTEMA DE REGISTRO DE USUARIOS
 * Prueba completa de todos los endpoints de registro
 */

const axios = require('axios');
const devLogger = require('../utils/devLogger');

// Configuración
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'Admin123!@#' // Contraseña que cumple requisitos de complejidad
};

// Colores para consola
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    devLogger.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function logTest(message) {
    log(`🧪 ${message}`, 'yellow');
}

// Variables globales para el testing
let adminToken = null;
let testRequestId = null;

/**
 * Test 1: Login de administrador
 */
async function testAdminLogin() {
    logTest('TEST 1: Login de administrador');

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, ADMIN_CREDENTIALS);

        if (response.status === 200 && response.data.tokens) {
            adminToken = response.data.tokens.accessToken;
            logSuccess(`Login exitoso - Token obtenido`);
            logInfo(`Usuario: ${response.data.user.email} (${response.data.user.role})`);
            return true;
        } else {
            logError('Login falló - Respuesta inválida');
            return false;
        }
    } catch (error) {
        logError(`Login falló: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

/**
 * Test 2: Enviar solicitud de registro válida
 */
async function testValidRegistrationRequest() {
    logTest('TEST 2: Enviar solicitud de registro válida');

    const validRequest = {
        fullName: 'Juan Carlos Pérez García',
        email: `test${Date.now()}@bge.edu.mx`,
        requestedRole: 'docente',
        reason: 'Necesito acceso al sistema para gestionar las calificaciones de mis grupos de matemáticas de tercero y quinto semestre.',
        phone: '3312345678'
    };

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-registration`, validRequest);

        if (response.status === 201) {
            testRequestId = response.data.requestId;
            logSuccess('Solicitud válida aceptada');
            logInfo(`Request ID: ${testRequestId}`);
            logInfo(`Email: ${response.data.data.email}`);
            return true;
        } else {
            logError('Solicitud válida rechazada incorrectamente');
            return false;
        }
    } catch (error) {
        logError(`Solicitud válida falló: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

/**
 * Test 3: Rechazar email no institucional
 */
async function testInvalidEmailDomain() {
    logTest('TEST 3: Rechazar email no institucional');

    const invalidRequest = {
        fullName: 'María López Hernández',
        email: `test@gmail.com`,
        requestedRole: 'estudiante',
        reason: 'Este es un motivo de prueba que debe tener al menos cincuenta caracteres para pasar la validación del sistema.',
        phone: '3312345678'
    };

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-registration`, invalidRequest);
        logError('Email no institucional aceptado incorrectamente');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess('Email no institucional rechazado correctamente');
            return true;
        } else {
            logError(`Error inesperado: ${error.message}`);
            return false;
        }
    }
}

/**
 * Test 4: Rechazar motivo muy corto
 */
async function testShortReason() {
    logTest('TEST 4: Rechazar motivo muy corto');

    const invalidRequest = {
        fullName: 'Pedro Ramírez Sánchez',
        email: `test2${Date.now()}@bge.edu.mx`,
        requestedRole: 'estudiante',
        reason: 'Motivo corto',
        phone: '3312345678'
    };

    try {
        const response = await axios.post(`${BASE_URL}/api/auth/request-registration`, invalidRequest);
        logError('Motivo corto aceptado incorrectamente');
        return false;
    } catch (error) {
        if (error.response?.status === 400) {
            logSuccess('Motivo corto rechazado correctamente');
            return true;
        } else {
            logError(`Error inesperado: ${error.message}`);
            return false;
        }
    }
}

/**
 * Test 5: Rechazar solicitud duplicada
 */
async function testDuplicateRequest() {
    logTest('TEST 5: Rechazar solicitud duplicada');

    const duplicateEmail = `duplicate${Date.now()}@bge.edu.mx`;

    const request = {
        fullName: 'Ana Torres Martínez',
        email: duplicateEmail,
        requestedRole: 'estudiante',
        reason: 'Este es el primer intento de registro con un motivo suficientemente largo para cumplir con los requisitos mínimos establecidos.',
        phone: '3312345678'
    };

    try {
        // Primera solicitud
        await axios.post(`${BASE_URL}/api/auth/request-registration`, request);

        // Segunda solicitud (duplicada)
        try {
            await axios.post(`${BASE_URL}/api/auth/request-registration`, request);
            logError('Solicitud duplicada aceptada incorrectamente');
            return false;
        } catch (duplicateError) {
            if (duplicateError.response?.status === 409) {
                logSuccess('Solicitud duplicada rechazada correctamente');
                return true;
            } else {
                logError(`Error inesperado: ${duplicateError.message}`);
                return false;
            }
        }
    } catch (error) {
        logError(`Error en primera solicitud: ${error.message}`);
        return false;
    }
}

/**
 * Test 6: Obtener solicitudes pendientes (con autenticación)
 */
async function testGetPendingRequests() {
    logTest('TEST 6: Obtener solicitudes pendientes (autenticado)');

    if (!adminToken) {
        logError('No hay token de administrador disponible');
        return false;
    }

    try {
        const response = await axios.get(`${BASE_URL}/api/admin/pending-registrations`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.status === 200) {
            logSuccess(`Solicitudes pendientes obtenidas: ${response.data.count}`);
            logInfo(`Total de solicitudes: ${response.data.totalRequests}`);
            return true;
        } else {
            logError('Respuesta inválida');
            return false;
        }
    } catch (error) {
        logError(`Error obteniendo solicitudes: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

/**
 * Test 7: Intentar acceso sin autenticación
 */
async function testUnauthorizedAccess() {
    logTest('TEST 7: Intentar acceso sin autenticación');

    try {
        await axios.get(`${BASE_URL}/api/admin/pending-registrations`);
        logError('Acceso no autenticado permitido incorrectamente');
        return false;
    } catch (error) {
        if (error.response?.status === 401) {
            logSuccess('Acceso no autenticado bloqueado correctamente');
            return true;
        } else {
            logError(`Error inesperado: ${error.message}`);
            return false;
        }
    }
}

/**
 * Test 8: Aprobar solicitud
 */
async function testApproveRequest() {
    logTest('TEST 8: Aprobar solicitud de registro');

    if (!adminToken || !testRequestId) {
        logError('No hay token de admin o requestId disponible');
        return false;
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/api/admin/approve-registration`,
            {
                requestId: testRequestId,
                reviewNotes: 'Solicitud aprobada durante testing automatizado'
            },
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (response.status === 201) {
            logSuccess('Solicitud aprobada exitosamente');
            logInfo(`Usuario creado: ${response.data.user.email}`);
            logInfo(`Contraseña temporal: ${response.data.user.temporaryPassword}`);
            logInfo(`Rol asignado: ${response.data.user.role}`);
            return true;
        } else {
            logError('Aprobación falló');
            return false;
        }
    } catch (error) {
        logError(`Error aprobando solicitud: ${error.response?.data?.message || error.message}`);
        if (error.response?.data?.details) {
            devLogger.log(error.response.data.details);
        }
        return false;
    }
}

/**
 * Test 9: Rechazar solicitud
 */
async function testRejectRequest() {
    logTest('TEST 9: Rechazar solicitud de registro');

    if (!adminToken) {
        logError('No hay token de administrador disponible');
        return false;
    }

    // Primero crear una solicitud para rechazar
    const rejectEmail = `reject${Date.now()}@bge.edu.mx`;
    const request = {
        fullName: 'Usuario Para Rechazar',
        email: rejectEmail,
        requestedRole: 'estudiante',
        reason: 'Esta solicitud será rechazada como parte del testing automatizado del sistema de registro de usuarios.',
        phone: '3312345678'
    };

    try {
        // Crear solicitud
        const createResponse = await axios.post(`${BASE_URL}/api/auth/request-registration`, request);
        const requestId = createResponse.data.requestId;

        // Rechazar solicitud
        const response = await axios.post(
            `${BASE_URL}/api/admin/reject-registration`,
            {
                requestId: requestId,
                reviewNotes: 'Solicitud rechazada durante testing automatizado - motivo insuficiente'
            },
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            }
        );

        if (response.status === 200) {
            logSuccess('Solicitud rechazada exitosamente');
            logInfo(`Email: ${response.data.request.email}`);
            logInfo(`Estado: ${response.data.request.status}`);
            return true;
        } else {
            logError('Rechazo falló');
            return false;
        }
    } catch (error) {
        logError(`Error rechazando solicitud: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

/**
 * Test 10: Obtener estadísticas
 */
async function testGetStats() {
    logTest('TEST 10: Obtener estadísticas de registro');

    if (!adminToken) {
        logError('No hay token de administrador disponible');
        return false;
    }

    try {
        const response = await axios.get(`${BASE_URL}/api/admin/registration-stats`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        if (response.status === 200) {
            const stats = response.data.stats;
            logSuccess('Estadísticas obtenidas exitosamente');
            logInfo(`Total: ${stats.total}`);
            logInfo(`Pendientes: ${stats.pending}`);
            logInfo(`Aprobadas: ${stats.approved}`);
            logInfo(`Rechazadas: ${stats.rejected}`);
            return true;
        } else {
            logError('Error obteniendo estadísticas');
            return false;
        }
    } catch (error) {
        logError(`Error: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
    log('\n╔══════════════════════════════════════════════════════════╗', 'blue');
    log('║  🧪 TESTING SISTEMA DE REGISTRO DE USUARIOS - FASE 2   ║', 'blue');
    log('╚══════════════════════════════════════════════════════════╝\n', 'blue');

    const tests = [
        { name: 'Login Administrador', func: testAdminLogin },
        { name: 'Solicitud Válida', func: testValidRegistrationRequest },
        { name: 'Email No Institucional', func: testInvalidEmailDomain },
        { name: 'Motivo Corto', func: testShortReason },
        { name: 'Solicitud Duplicada', func: testDuplicateRequest },
        { name: 'Obtener Pendientes', func: testGetPendingRequests },
        { name: 'Acceso No Autenticado', func: testUnauthorizedAccess },
        { name: 'Aprobar Solicitud', func: testApproveRequest },
        { name: 'Rechazar Solicitud', func: testRejectRequest },
        { name: 'Estadísticas', func: testGetStats }
    ];

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        log(`\n${'─'.repeat(60)}`, 'cyan');

        try {
            const result = await test.func();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            logError(`Test ${test.name} lanzó excepción: ${error.message}`);
            failed++;
        }

        // Pequeña pausa entre tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Resumen final
    log('\n' + '═'.repeat(60), 'blue');
    log('║                    RESUMEN DE PRUEBAS                    ║', 'blue');
    log('═'.repeat(60), 'blue');
    log(`  Tests ejecutados: ${tests.length}`, 'cyan');
    log(`  ✅ Exitosos: ${passed}`, 'green');
    log(`  ❌ Fallidos: ${failed}`, 'red');
    log(`  📊 Tasa de éxito: ${((passed / tests.length) * 100).toFixed(2)}%`, 'yellow');
    log('═'.repeat(60) + '\n', 'blue');

    if (failed === 0) {
        logSuccess('🎉 TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
        log('\n✅ El sistema está listo para FASE 3 (Dashboard)', 'green');
    } else {
        logError(`⚠️  ${failed} prueba(s) fallaron. Revisar implementación.`);
    }
}

// Ejecutar tests
runAllTests().catch(error => {
    logError(`Error fatal en testing: ${error.message}`);
    process.exit(1);
});
