// SCRIPT DE PRUEBAS - FORMULARIOS FASES 4 Y 5
const http = require('http');

const tests = [];
let passed = 0;
let failed = 0;

function testRequest(name, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/contact/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({ name, status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ name, status: res.statusCode, data: { raw: responseData } });
                }
            });
        });

        req.on('error', (error) => reject({ name, error }));
        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('\n========================================');
    console.log('PRUEBAS - FORMULARIOS FASES 4 Y 5');
    console.log('========================================\n');

    // Test 1: CV
    console.log('TEST 1: Formulario CV');
    try {
        const result = await testRequest('CV', {
            nombre: 'Ana Garcia Prueba',
            email: 'test.cv@example.com',
            telefono: '222-555-0101',
            asunto: 'Administracion Area Profesional',
            mensaje: 'Recien egresada buscando oportunidades laborales en el area administrativa',
            form_type: 'Registro Bolsa de Trabajo'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data)}\n`);
        if (result.status === 200) passed++; else failed++;
        tests.push(result);
    } catch (e) {
        console.log(`ERROR: ${e.error || e}\n`);
        failed++;
    }

    // Test 2: Notificaciones
    console.log('TEST 2: Formulario Notificaciones');
    try {
        const result = await testRequest('Notificaciones', {
            email: 'test.notif@example.com',
            asunto: 'Todas las convocatorias disponibles',
            nombre: 'Suscriptor Test',
            mensaje: 'Solicitud de suscripcion a notificaciones de convocatorias del bachillerato',
            form_type: 'Suscripcion a Notificaciones'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data)}\n`);
        if (result.status === 200) passed++; else failed++;
        tests.push(result);
    } catch (e) {
        console.log(`ERROR: ${e.error || e}\n`);
        failed++;
    }

    // Test 3: Citas
    console.log('TEST 3: Formulario Citas');
    try {
        const result = await testRequest('Citas', {
            nombre: 'Carlos Mendoza Prueba',
            email: 'test.cita@example.com',
            telefono: '222-555-0102',
            reason: 'Prueba de sistema',
            department: 'Orientacion Educativa',
            date: 'lunes, 7 de octubre de 2025',
            time: '09:00',
            asunto: 'Nueva Cita - Orientacion Educativa',
            mensaje: 'NUEVA CITA AGENDADA\n\nDepartamento: Orientacion Educativa\nFecha: lunes, 7 de octubre de 2025\nHora: 09:00\n\nNombre: Carlos Mendoza Prueba\nEmail: test.cita@example.com\nTelefono: 222-555-0102\n\nMotivo: Prueba de sistema de agendamiento automatizado',
            form_type: 'Agendamiento de Cita'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data)}\n`);
        if (result.status === 200) passed++; else failed++;
        tests.push(result);
    } catch (e) {
        console.log(`ERROR: ${e.error || e}\n`);
        failed++;
    }

    // Test 4: Email invalido
    console.log('TEST 4: Email Invalido (debe fallar)');
    try {
        const result = await testRequest('Email Invalido', {
            nombre: 'Test Usuario',
            email: 'email-invalido',
            telefono: '222-555-0103',
            asunto: 'Test de validacion',
            mensaje: 'Test de validacion de email invalido',
            form_type: 'Test'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data)}\n`);
        if (result.status === 400 || result.status === 422) passed++; else failed++;
        tests.push(result);
    } catch (e) {
        console.log(`ERROR: ${e.error || e}\n`);
        failed++;
    }

    // Test 5: Campos faltantes
    console.log('TEST 5: Campos Faltantes (debe fallar)');
    try {
        const result = await testRequest('Campos Faltantes', {
            nombre: 'Test',
            telefono: '222-555-0104',
            mensaje: 'Test sin email para validacion',
            form_type: 'Test'
        });
        console.log(`Status: ${result.status}`);
        console.log(`Response: ${JSON.stringify(result.data)}\n`);
        if (result.status === 400 || result.status === 422) passed++; else failed++;
        tests.push(result);
    } catch (e) {
        console.log(`ERROR: ${e.error || e}\n`);
        failed++;
    }

    // Resumen
    console.log('\n========================================');
    console.log('RESUMEN DE PRUEBAS');
    console.log('========================================');
    console.log(`Total: ${tests.length}`);
    console.log(`Exitosos: ${passed}`);
    console.log(`Fallidos: ${failed}`);
    console.log(`Tasa exito: ${((passed / tests.length) * 100).toFixed(1)}%`);
    console.log('========================================\n');
}

runTests().then(() => process.exit(0)).catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
});
