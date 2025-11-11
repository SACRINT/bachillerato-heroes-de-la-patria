/**
 * TEST UNITARIO: Endpoint check-approval
 * Prueba directa del endpoint sin servidor HTTP
 */

const path = require('path');
const devLogger = require('../utils/devLogger');

// Mock de express request/response
function createMockRequest(email) {
    return {
        params: { email: email }
    };
}

function createMockResponse() {
    let responseData = null;
    let statusCode = 200;

    return {
        status: function(code) {
            statusCode = code;
            return this;
        },
        json: function(data) {
            responseData = { statusCode, data };
            return this;
        },
        getResponse: function() {
            return responseData;
        }
    };
}

// Importar el helper de lectura de solicitudes
const fs = require('fs').promises;
const REGISTRATION_REQUESTS_PATH = path.join(__dirname, 'data', 'registration-requests.json');

async function readRegistrationRequests() {
    try {
        const data = await fs.readFile(REGISTRATION_REQUESTS_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const initialData = { requests: [], lastId: 0 };
        await fs.writeFile(REGISTRATION_REQUESTS_PATH, JSON.stringify(initialData, null, 2));
        return initialData;
    }
}

// Implementación del endpoint (copiada del código real)
async function checkApprovalEndpoint(req, res) {
    try {
        const { email } = req.params;
        const data = await readRegistrationRequests();

        // Buscar solicitud aprobada para este email
        const approvedRequest = data.requests.find(
            req => req.email.toLowerCase() === email.toLowerCase() &&
                   req.status === 'approved'
        );

        res.json({
            success: true,
            email: email,
            approved: !!approvedRequest,
            approvedAt: approvedRequest?.approvedAt || null,
            role: approvedRequest?.requestedRole || 'estudiante'
        });

    } catch (error) {
        devLogger.error('❌ Error verificando aprobación:', error);
        res.status(500).json({
            success: false,
            approved: false
        });
    }
}

// TESTS
async function runTests() {
    devLogger.log('🧪 EJECUTANDO TESTS DEL ENDPOINT check-approval\n');
    devLogger.log('='.repeat(60));

    const tests = [
        {
            name: 'Test 1: Email aprobado (minúsculas)',
            email: 'aprobado@test.com',
            expectedApproved: true,
            expectedRole: 'estudiante'
        },
        {
            name: 'Test 2: Email aprobado (MAYÚSCULAS - case insensitive)',
            email: 'APROBADO@TEST.COM',
            expectedApproved: true,
            expectedRole: 'estudiante'
        },
        {
            name: 'Test 3: Email pendiente (no aprobado)',
            email: 'pendiente@test.com',
            expectedApproved: false,
            expectedRole: 'estudiante'
        },
        {
            name: 'Test 4: Email rechazado (no aprobado)',
            email: 'rechazado@test.com',
            expectedApproved: false,
            expectedRole: 'estudiante'
        },
        {
            name: 'Test 5: Email no existente',
            email: 'noexiste@test.com',
            expectedApproved: false,
            expectedRole: 'estudiante'
        },
        {
            name: 'Test 6: Email con case diferente al almacenado',
            email: 'mayusculas@test.com',
            expectedApproved: true,
            expectedRole: 'docente'
        },
        {
            name: 'Test 7: Email almacenado en MAYÚSCULAS',
            email: 'MAYUSCULAS@TEST.COM',
            expectedApproved: true,
            expectedRole: 'docente'
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        devLogger.log(`\n📝 ${test.name}`);
        devLogger.log(`   Email: ${test.email}`);

        const req = createMockRequest(test.email);
        const res = createMockResponse();

        await checkApprovalEndpoint(req, res);
        const response = res.getResponse();

        const success = response.data.success;
        const approved = response.data.approved;
        const role = response.data.role;

        const isCorrect =
            success === true &&
            approved === test.expectedApproved &&
            (approved === false || role === test.expectedRole);

        if (isCorrect) {
            devLogger.log(`   ✅ PASÓ`);
            devLogger.log(`      - Aprobado: ${approved} (esperado: ${test.expectedApproved})`);
            devLogger.log(`      - Rol: ${role} (esperado: ${test.expectedRole})`);
            passed++;
        } else {
            devLogger.log(`   ❌ FALLÓ`);
            devLogger.log(`      - Respuesta completa:`, JSON.stringify(response.data, null, 2));
            devLogger.log(`      - Esperado: approved=${test.expectedApproved}, role=${test.expectedRole}`);
            failed++;
        }
    }

    devLogger.log('\n' + '='.repeat(60));
    devLogger.log(`\n📊 RESULTADOS:`);
    devLogger.log(`   ✅ Pasaron: ${passed}/${tests.length}`);
    devLogger.log(`   ❌ Fallaron: ${failed}/${tests.length}`);
    devLogger.log(`   📈 Porcentaje: ${((passed/tests.length)*100).toFixed(1)}%`);

    if (failed === 0) {
        devLogger.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    } else {
        devLogger.log(`\n⚠️  ${failed} test(s) fallaron`);
    }

    devLogger.log('\n' + '='.repeat(60));
}

// Ejecutar tests
runTests().catch(error => {
    devLogger.error('❌ Error ejecutando tests:', error);
    process.exit(1);
});
