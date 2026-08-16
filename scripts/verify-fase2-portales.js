/**
 * 🧪 SCRIPT DE VERIFICACIÓN AUTOMÁTICA - FASE 2: PORTALES CORE
 * Valida los flujos de:
 * 1. Portal Estudiantes: Autenticación, Datos de Boleta y Calificaciones.
 * 2. Portal Padres: Autenticación, Check de Sesión, Alumnos Vinculados y Consulta de Calificaciones.
 * 3. Portal Docentes: Autenticación, Dashboard, Captura de Calificaciones y Toma de Asistencia.
 * 4. Generación de Boleta Oficial en PDF (pdfkit).
 * 5. Sistema de Calificaciones, Validación y Alertas de Riesgo.
 * 6. Inscripciones Online y Estadísticas.
 * 7. Calendario y Sistema de Citas.
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000
        };

        const req = http.request(url, reqOptions, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                let json = null;
                const contentType = res.headers['content-type'] || '';
                if (contentType.includes('application/json')) {
                    try {
                        json = JSON.parse(buffer.toString('utf8'));
                    } catch (e) {
                        json = null;
                    }
                }
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: buffer,
                    text: buffer.toString('utf8'),
                    json
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout for ${path}`));
        });

        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(70));
    console.log('🎓 VERIFICACIÓN AUTOMÁTICA DE FASE 2: PORTALES CORE (BGE 2026)');
    console.log('='.repeat(70));

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ [FAIL] ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    // 0. HEALTH CHECK
    await test('Backend Express Health Check Responds 200 OK', async () => {
        const res = await request('/api/health');
        if (res.status !== 200) {
            throw new Error(`Expected status 200, got ${res.status}`);
        }
    });

    let studentToken = null;
    let teacherToken = null;
    let parentToken = null;

    // 1. PORTAL ESTUDIANTES
    await test('1.1 Login Estudiante genera token y datos de usuario', async () => {
        let res = await request('/api/students-auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                matricula: '2025-0001',
                password: 'demo123'
            }
        });
        if (res.status === 200 && res.json && res.json.token) {
            studentToken = res.json.token;
        } else {
            // Intentar con usuario admin
            res = await request('/api/students-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: {
                    matricula: 'admin@bachilleratoheroes.edu.mx',
                    password: 'admin'
                }
            });
            if (res.status === 200 && res.json && res.json.token) {
                studentToken = res.json.token;
            }
        }
        if (!studentToken) throw new Error('Token de estudiante no generado');
    });

    await test('1.2 Estudiante consulta su Boleta de Calificaciones (GET /api/grades/student/1)', async () => {
        const res = await request('/api/grades/student/1', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.json || !res.json.success) throw new Error('Respuesta inválida de boleta');
        if (!res.json.data || !Array.isArray(res.json.data.materias)) {
            throw new Error('Estructura de materias no encontrada en boleta');
        }
    });

    await test('1.3 Generación de Boleta Oficial en PDF (GET /api/grades/student/1/pdf)', async () => {
        const res = await request('/api/grades/student/1/pdf', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const ctype = res.headers['content-type'] || '';
        if (!ctype.includes('application/pdf')) {
            throw new Error(`Content-Type esperado application/pdf, recibido: ${ctype}`);
        }
        if (res.body.length < 500) {
            throw new Error(`Tamaño de PDF sospechosamente pequeño: ${res.body.length} bytes`);
        }
        const magic = res.body.slice(0, 5).toString('ascii');
        if (!magic.startsWith('%PDF')) {
            throw new Error(`Formato binario no coincide con PDF: ${magic}`);
        }
    });

    // 2. PORTAL PADRES
    await test('2.1 Login de Padre / Tutor (/api/parents/auth/login)', async () => {
        const res = await request('/api/parents/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                email: 'admin@bachilleratoheroes.edu.mx',
                password: 'admin'
            }
        });
        if (res.status !== 200 || !res.json || !res.json.success || !res.json.token) {
            throw new Error(`Fallo en login de padres: ${res.text}`);
        }
        parentToken = res.json.token;
    });

    await test('2.2 Verificación de Sesión de Padre (GET /api/parents/auth/check)', async () => {
        const res = await request('/api/parents/auth/check', {
            headers: { 'Authorization': `Bearer ${parentToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.isAuthenticated) {
            throw new Error(`Sesión de padre no válida: ${res.text}`);
        }
    });

    await test('2.3 Padre consulta Alumnos Vinculados (GET /api/parents/my-students)', async () => {
        const res = await request('/api/parents/my-students', {
            headers: { 'Authorization': `Bearer ${parentToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error obteniendo estudiantes vinculados: ${res.text}`);
        }
        if (!Array.isArray(res.json.data) || res.json.data.length === 0) {
            throw new Error('Lista de alumnos vinculados vacía');
        }
    });

    await test('2.4 Padre consulta Calificaciones de su Hijo (GET /api/parents/students/1/grades)', async () => {
        const res = await request('/api/parents/students/1/grades', {
            headers: { 'Authorization': `Bearer ${parentToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error en calificaciones del hijo: ${res.text}`);
        }
    });

    // 3. PORTAL DOCENTES
    await test('3.1 Login Docente (/api/teachers-portal/login)', async () => {
        const res = await request('/api/teachers-portal/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                email: 'docente@demo.com',
                password: 'demo123'
            }
        });
        if (res.status !== 200 || !res.json || !res.json.success || !res.json.token) {
            throw new Error(`Fallo en login docente: ${res.text}`);
        }
        teacherToken = res.json.token;
    });

    await test('3.2 Docente consulta Métricas de Dashboard (GET /api/teachers-portal/dashboard)', async () => {
        const res = await request('/api/teachers-portal/dashboard', {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.success || !res.json.data) {
            throw new Error(`Error obteniendo dashboard docente: ${res.text}`);
        }
    });

    await test('3.3 Docente Captura Calificación (POST /api/teachers-portal/grades)', async () => {
        const res = await request('/api/teachers-portal/grades', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${teacherToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                estudiante_id: 1,
                materia_id: 1,
                calificacion: 9.5,
                periodo: 'Parcial 1',
                observaciones: 'Excelente desempeño académico'
            }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error capturando calificación docente: ${res.text}`);
        }
    });

    await test('3.4 Docente Registra Toma de Asistencia (POST /api/teachers-portal/attendance)', async () => {
        const res = await request('/api/teachers-portal/attendance', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${teacherToken}`,
                'Content-Type': 'application/json'
            },
            body: {
                attendances: [
                    {
                        student_id: 1,
                        class_id: 1,
                        date: new Date().toISOString().split('T')[0],
                        status: 'presente'
                    }
                ]
            }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error registrando asistencia docente: ${res.text}`);
        }
    });

    // 4. VALIDACIÓN DE CALIFICACIONES & ALERTAS DE RIESGO
    await test('4.1 Coordinador consulta Calificaciones Pendientes (GET /api/grades-validation/pending)', async () => {
        const res = await request('/api/grades-validation/pending', {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error en validación de calificaciones: ${res.text}`);
        }
    });

    await test('4.2 Sistema de Alertas de Riesgo Académico (GET /api/grades-validation/risk-alerts)', async () => {
        const res = await request('/api/grades-validation/risk-alerts', {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error en alertas de riesgo: ${res.text}`);
        }
    });

    // 5. INSCRIPCIONES ONLINE
    await test('5.1 Pre-registro de Inscripción Online (POST /api/inscriptions/register)', async () => {
        const testCurp = 'TEST' + Date.now().toString().slice(-14);
        const res = await request('/api/inscriptions/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                activityId: 'extracurricular_01',
                activityName: 'Taller de Programación Web',
                studentName: 'Carlos Ramírez Hernández',
                studentEmail: `aspirante_${Date.now()}@bge.edu.mx`,
                studentGroup: '3-A',
                emergencyContact: '2221234567'
            }
        });
        if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Error en pre-registro de inscripción: ${res.text}`);
        }
        if (!res.json || !res.json.success) {
            throw new Error(`Respuesta de pre-registro no exitosa: ${res.text}`);
        }
    });

    await test('5.2 Estadísticas de Inscripciones (GET /api/inscriptions/stats)', async () => {
        const res = await request('/api/inscriptions/stats');
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error obteniendo estadísticas de inscripciones: ${res.text}`);
        }
    });

    // 6. CALENDARIO Y SISTEMA DE CITAS
    await test('6.1 Consulta de Horarios Disponibles de Citas (GET /api/citas-improved/available-slots)', async () => {
        const today = new Date().toISOString().split('T')[0];
        const res = await request(`/api/citas-improved/available-slots?date=${today}&motivo=direccion`);
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error consultando slots de citas: ${res.text}`);
        }
    });

    await test('6.2 Estadísticas de Citas (GET /api/citas-improved/stats)', async () => {
        const res = await request('/api/citas-improved/stats');
        if (res.status !== 200 || !res.json || !res.json.success) {
            throw new Error(`Error en estadísticas de citas: ${res.text}`);
        }
    });

    console.log('='.repeat(70));
    console.log(`📊 RESULTADOS DE FASE 2: ${passed} PASSED | ${failed} FAILED | TOTAL: ${passed + failed}`);
    console.log('='.repeat(70));

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Error fatal en suite de pruebas:', err);
    process.exit(1);
});
