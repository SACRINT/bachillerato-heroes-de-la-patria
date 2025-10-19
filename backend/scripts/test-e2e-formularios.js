/**
 * SCRIPT DE TESTING END-TO-END
 * Prueba todos los formularios integrados del proyecto
 * Fecha: 18 de Octubre, 2025
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Función auxiliar para hacer requests
function makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);

        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => { responseData += chunk; });
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(responseData)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: responseData
                    });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

// Tests de formularios
const tests = [
    {
        nombre: '1. Quejas y Sugerencias',
        endpoint: '/api/quejas',
        metodo: 'POST',
        data: {
            nombre: 'Test E2E Quejas',
            email: 'quejas@test.com',
            subject: 'queja',
            message: 'Mensaje de prueba E2E'
        }
    },
    {
        nombre: '2. Recuperación de Contraseña',
        endpoint: '/api/password-recovery',
        metodo: 'POST',
        data: {
            email: 'test@example.com'
        }
    },
    {
        nombre: '3. Notificaciones de Convocatorias',
        endpoint: '/api/notificaciones',
        metodo: 'POST',
        data: {
            email: 'notif@test.com',
            tipo_contenido: 'noticias',
            frecuencia: 'diaria'
        }
    },
    {
        nombre: '4. Noticias (CMS)',
        endpoint: '/api/noticias',
        metodo: 'POST',
        data: {
            titulo: 'Noticia Test E2E',
            contenido: 'Contenido de prueba',
            resumen: 'Resumen de prueba',
            categoria: 'Pruebas',
            estado: 'publicada',
            autor: 'Test E2E'
        }
    },
    {
        nombre: '5. Eventos (CMS)',
        endpoint: '/api/eventos',
        metodo: 'POST',
        data: {
            titulo: 'Evento Test E2E',
            descripcion: 'Descripción del evento de prueba',
            fecha_inicio: '2025-12-01T10:00:00',
            ubicacion: 'Auditorio',
            modalidad: 'presencial',
            categoria: 'Pruebas',
            estado: 'publicado',
            organizador: 'Test E2E'
        }
    },
    {
        nombre: '6. Avisos (CMS)',
        endpoint: '/api/avisos',
        metodo: 'POST',
        data: {
            titulo: 'Aviso Test E2E',
            contenido: 'Contenido del aviso',
            categoria: 'Pruebas',
            estado: 'publicada',
            autor: 'Test E2E'
        }
    },
    {
        nombre: '7. Comunicados (CMS)',
        endpoint: '/api/comunicados',
        metodo: 'POST',
        data: {
            titulo: 'Comunicado Test E2E',
            contenido: 'Contenido del comunicado',
            categoria: 'Pruebas',
            estado: 'publicada',
            autor: 'Test E2E'
        }
    }
];

// Ejecutar tests
async function runTests() {
    console.log(colors.cyan + '\n==============================================');
    console.log('  TESTING END-TO-END - FORMULARIOS BGE');
    console.log('==============================================\n' + colors.reset);

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of tests) {
        try {
            const response = await makeRequest(test.metodo, test.endpoint, test.data);

            const success = response.status >= 200 && response.status < 300 && response.data.success !== false;

            results.push({
                nombre: test.nombre,
                endpoint: test.endpoint,
                status: response.status,
                success: success,
                response: response.data
            });

            if (success) {
                console.log(colors.green + '✅ PASS' + colors.reset + ' ' + test.nombre);
                passed++;
            } else {
                console.log(colors.red + '❌ FAIL' + colors.reset + ' ' + test.nombre);
                console.log(colors.yellow + '   Status: ' + response.status + colors.reset);
                if (response.data.error) {
                    console.log(colors.yellow + '   Error: ' + response.data.error + colors.reset);
                }
                if (response.data.errors) {
                    console.log(colors.yellow + '   Errors: ' + JSON.stringify(response.data.errors).substring(0, 100) + colors.reset);
                }
                failed++;
            }
        } catch (error) {
            console.log(colors.red + '❌ ERROR' + colors.reset + ' ' + test.nombre);
            console.log(colors.yellow + '   ' + error.message + colors.reset);
            failed++;
        }
    }

    // Resumen
    console.log(colors.cyan + '\n==============================================');
    console.log('  RESUMEN DE PRUEBAS');
    console.log('==============================================' + colors.reset);
    console.log(colors.green + `✅ Tests exitosos: ${passed}/${tests.length}` + colors.reset);
    console.log(colors.red + `❌ Tests fallidos: ${failed}/${tests.length}` + colors.reset);

    const successRate = ((passed / tests.length) * 100).toFixed(1);
    console.log(colors.blue + `📊 Tasa de éxito: ${successRate}%` + colors.reset);

    console.log(colors.cyan + '==============================================\n' + colors.reset);

    return {
        total: tests.length,
        passed,
        failed,
        successRate,
        results
    };
}

// Ejecutar
runTests()
    .then(results => {
        process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
        console.error(colors.red + '❌ Error ejecutando tests:', error.message + colors.reset);
        process.exit(1);
    });
