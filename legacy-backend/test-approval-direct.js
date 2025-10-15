/**
 * 🧪 TEST DIRECTO DEL SISTEMA DE APROBACIÓN
 *
 * Este test NO requiere servidor corriendo.
 * Prueba directamente los componentes del sistema.
 */

const path = require('path');
const fs = require('fs').promises;

// Colores
const c = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m'
};

let results = { total: 0, passed: 0, failed: 0, details: [] };

function test(name, passed, details = '') {
    results.total++;
    if (passed) {
        results.passed++;
        console.log(`${c.green}✅ PASS:${c.reset} ${name}`);
    } else {
        results.failed++;
        console.log(`${c.red}❌ FAIL:${c.reset} ${name}`);
    }
    if (details) console.log(`   ${c.cyan}${details}${c.reset}`);
    results.details.push({ name, passed, details });
}

async function runTests() {
    console.log(`\n${c.cyan}${'='.repeat(70)}${c.reset}`);
    console.log(`${c.cyan}🧪 TEST DIRECTO DEL SISTEMA DE APROBACIÓN${c.reset}`);
    console.log(`${c.cyan}${'='.repeat(70)}${c.reset}\n`);

    // ==============================================
    // TEST 1: Archivo de datos existe y es válido
    // ==============================================
    console.log(`${c.blue}📋 TEST 1: Verificar archivo de datos${c.reset}\n`);

    const dataFile = path.join(__dirname, 'data', 'registration-requests.json');

    try {
        const rawData = await fs.readFile(dataFile, 'utf8');
        test(
            '1.1 - Archivo registration-requests.json existe',
            true,
            `Ubicación: ${dataFile}`
        );

        const data = JSON.parse(rawData);
        test(
            '1.2 - JSON es válido',
            true,
            `Parseado correctamente`
        );

        test(
            '1.3 - Estructura correcta (tiene "requests" array)',
            Array.isArray(data.requests),
            `Requests encontrados: ${data.requests.length}`
        );

        test(
            '1.4 - Tiene campo "lastId"',
            typeof data.lastId === 'number',
            `lastId: ${data.lastId}`
        );

        console.log(`\n   ${c.yellow}📊 Contenido del archivo:${c.reset}`);
        console.log(`   ${JSON.stringify(data, null, 2)}\n`);

        // ==============================================
        // TEST 2: Verificar usuarios de prueba
        // ==============================================
        console.log(`${c.blue}📋 TEST 2: Verificar usuarios de prueba${c.reset}\n`);

        const approvedUser = data.requests.find(r => r.email === 'aprobado@test.com');
        test(
            '2.1 - Usuario "aprobado@test.com" existe',
            !!approvedUser,
            approvedUser ? `Encontrado: ${JSON.stringify(approvedUser)}` : 'No encontrado'
        );

        test(
            '2.2 - Usuario aprobado tiene status "approved"',
            approvedUser?.status === 'approved',
            `Status: ${approvedUser?.status || 'N/A'}`
        );

        const pendingUser = data.requests.find(r => r.email === 'pendiente@test.com');
        test(
            '2.3 - Usuario "pendiente@test.com" existe',
            !!pendingUser,
            pendingUser ? `Encontrado: ${JSON.stringify(pendingUser)}` : 'No encontrado'
        );

        test(
            '2.4 - Usuario pendiente tiene status "pending"',
            pendingUser?.status === 'pending',
            `Status: ${pendingUser?.status || 'N/A'}`
        );

        // ==============================================
        // TEST 3: Verificar lógica de aprobación
        // ==============================================
        console.log(`\n${c.blue}📋 TEST 3: Lógica de aprobación (simulada)${c.reset}\n`);

        // Simular la lógica del endpoint /check-approval
        function checkApproval(email) {
            const request = data.requests.find(
                r => r.email.toLowerCase() === email.toLowerCase() && r.status === 'approved'
            );
            return {
                success: true,
                email: email,
                approved: !!request,
                approvedAt: request?.approvedAt || null,
                role: request?.requestedRole || 'estudiante'
            };
        }

        const testCases = [
            { email: 'aprobado@test.com', expectedApproved: true },
            { email: 'pendiente@test.com', expectedApproved: false },
            { email: 'rechazado@test.com', expectedApproved: false },
            { email: 'noexiste@test.com', expectedApproved: false }
        ];

        testCases.forEach((tc, index) => {
            const result = checkApproval(tc.email);
            test(
                `3.${index + 1} - ${tc.email} → approved=${tc.expectedApproved}`,
                result.approved === tc.expectedApproved,
                `Resultado: ${JSON.stringify(result)}`
            );
        });

        // ==============================================
        // TEST 4: Case insensitive
        // ==============================================
        console.log(`\n${c.blue}📋 TEST 4: Case insensitive email${c.reset}\n`);

        const caseVariants = [
            'MAYUSCULAS@TEST.COM',
            'mayusculas@test.com',
            'MaYuScUlAs@TeSt.CoM'
        ];

        const upperCaseUser = data.requests.find(r => r.email.toLowerCase() === 'mayusculas@test.com');

        test(
            '4.1 - Usuario "MAYUSCULAS@TEST.COM" existe en datos',
            !!upperCaseUser,
            upperCaseUser ? `Email en datos: ${upperCaseUser.email}` : 'No encontrado'
        );

        caseVariants.forEach((variant, index) => {
            const result = checkApproval(variant);
            test(
                `4.${index + 2} - ${variant} reconocido correctamente`,
                result.approved === (upperCaseUser?.status === 'approved'),
                `approved: ${result.approved}`
            );
        });

        // ==============================================
        // TEST 5: Verificar frontend integration
        // ==============================================
        console.log(`\n${c.blue}📋 TEST 5: Frontend Integration${c.reset}\n`);

        const frontendFile = path.join(__dirname, '..', 'js', 'google-auth-integration.js');
        const frontendCode = await fs.readFile(frontendFile, 'utf8');

        const checks = [
            {
                name: '5.1 - Método isAccountApproved es async',
                check: frontendCode.includes('async isAccountApproved')
            },
            {
                name: '5.2 - Usa fetch para backend',
                check: frontendCode.includes('await fetch') && frontendCode.includes('/api/admin/check-approval/')
            },
            {
                name: '5.3 - Maneja errores con try/catch',
                check: frontendCode.includes('try') && frontendCode.includes('catch') && frontendCode.includes('return false')
            },
            {
                name: '5.4 - Verifica campo "approved" en respuesta',
                check: frontendCode.includes('data.approved')
            },
            {
                name: '5.5 - Usa encodeURIComponent',
                check: frontendCode.includes('encodeURIComponent(email)')
            },
            {
                name: '5.6 - Retorna false en caso de error (seguridad)',
                check: frontendCode.match(/catch.*return false/s) !== null
            }
        ];

        checks.forEach(({ name, check }) => {
            test(name, check, check ? 'Implementado correctamente' : 'No implementado o incorrecto');
        });

        // ==============================================
        // TEST 6: Verificar backend route
        // ==============================================
        console.log(`\n${c.blue}📋 TEST 6: Backend Route Configuration${c.reset}\n`);

        const adminRouteFile = path.join(__dirname, 'routes', 'admin.js');
        const adminCode = await fs.readFile(adminRouteFile, 'utf8');

        const routeChecks = [
            {
                name: '6.1 - Ruta /check-approval/:email existe',
                check: adminCode.includes("router.get('/check-approval/:email'")
            },
            {
                name: '6.2 - No requiere autenticación (público)',
                check: !adminCode.match(/check-approval.*authenticateToken/s)
            },
            {
                name: '6.3 - Usa toLowerCase para comparar emails',
                check: adminCode.includes('.toLowerCase()') && adminCode.includes('check-approval')
            },
            {
                name: '6.4 - Verifica status === "approved"',
                check: adminCode.includes('status === \'approved\'')
            },
            {
                name: '6.5 - Retorna estructura correcta (success, approved, email)',
                check: adminCode.includes('success:') && adminCode.includes('approved:') && adminCode.includes('email:')
            }
        ];

        routeChecks.forEach(({ name, check }) => {
            test(name, check, check ? 'Configurado correctamente' : 'Configuración incorrecta');
        });

    } catch (error) {
        test('Error crítico en tests', false, error.message);
    }

    // ==============================================
    // REPORTE FINAL
    // ==============================================
    console.log(`\n${c.cyan}${'='.repeat(70)}${c.reset}`);
    console.log(`${c.cyan}📊 REPORTE FINAL${c.reset}`);
    console.log(`${c.cyan}${'='.repeat(70)}${c.reset}\n`);

    const passRate = (results.passed / results.total * 100).toFixed(1);

    console.log(`   Total tests: ${results.total}`);
    console.log(`   ${c.green}✅ Pasados: ${results.passed}${c.reset}`);
    console.log(`   ${c.red}❌ Fallidos: ${results.failed}${c.reset}`);
    console.log(`   📊 Tasa de éxito: ${passRate}%\n`);

    const status = results.failed === 0 ? `${c.green}TODOS LOS TESTS PASARON ✅${c.reset}` : `${c.red}HAY TESTS FALLIDOS ❌${c.reset}`;
    console.log(`   🏁 Estado: ${status}\n`);

    // Conclusiones específicas
    console.log(`${c.yellow}🎯 CONCLUSIONES:${c.reset}\n`);

    if (results.failed === 0) {
        console.log(`   ${c.green}✅ Sistema de aprobación correctamente implementado${c.reset}`);
        console.log(`   ${c.green}✅ Datos de prueba configurados correctamente${c.reset}`);
        console.log(`   ${c.green}✅ Frontend integrado con backend${c.reset}`);
        console.log(`   ${c.green}✅ Case sensitivity manejada correctamente${c.reset}`);
        console.log(`   ${c.green}✅ Seguridad: errores retornan false (denegar acceso)${c.reset}`);
    } else {
        console.log(`   ${c.yellow}⚠️  Hay ${results.failed} problema(s) que requieren atención${c.reset}`);
        console.log(`\n   ${c.yellow}Tests fallidos:${c.reset}`);
        results.details.filter(d => !d.passed).forEach(d => {
            console.log(`   ${c.red}  • ${d.name}${c.reset}`);
            if (d.details) console.log(`     ${d.details}`);
        });
    }

    console.log(`\n${c.cyan}${'='.repeat(70)}${c.reset}\n`);

    // Guardar reporte
    const reportFile = path.join(__dirname, 'test-report-direct.json');
    await fs.writeFile(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        summary: {
            total: results.total,
            passed: results.passed,
            failed: results.failed,
            passRate: `${passRate}%`
        }
    }, null, 2));

    console.log(`${c.blue}📄 Reporte guardado en: ${reportFile}${c.reset}\n`);

    process.exit(results.failed === 0 ? 0 : 1);
}

runTests().catch(err => {
    console.error(`${c.red}💥 ERROR CRÍTICO:${c.reset}`, err);
    process.exit(1);
});
