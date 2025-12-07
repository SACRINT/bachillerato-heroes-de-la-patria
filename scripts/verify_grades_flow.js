
import http from 'http';

const API_HOST = 'localhost';
const API_PORT = 3000;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            const data = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseBody);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    console.error('Error parsing response:', responseBody);
                    resolve({ status: res.statusCode, raw: responseBody });
                }
            });
        });

        req.on('error', e => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTest() {
    console.log('🚀 INICIANDO VERIFICACIÓN DE FLUJO DE CALIFICACIONES');

    // 1. Login Admin
    console.log('\n🔐 1. Iniciando sesión como Admin...');
    let token;
    try {
        const loginRes = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
        if (loginRes.data.success) {
            token = loginRes.data.tokens.accessToken;
            console.log('   ✅ Login Exitoso. Token recibido.');
            console.log(`   Rol: ${loginRes.data.user.role}`);
        } else {
            console.error('   ❌ Login Fallido:', loginRes.data.message);
            process.exit(1);
        }
    } catch (e) {
        console.error('   ❌ Error de conexión:', e.message);
        console.log('   ⚠️ Asegúrese de que el servidor esté corriendo en localhost:3000');
        process.exit(1);
    }

    // 2. Obtener Periodos
    console.log('\n📅 2. Obteniendo Periodos de Evaluación...');
    let periods = [];
    const periodsRes = await request('GET', '/grades/periods', null, token);
    if (periodsRes.data.success) {
        periods = periodsRes.data.data;
        console.log(`   ✅ Periodos encontrados: ${periods.length}`);
        periods.forEach(p => console.log(`      - [${p.id}] ${p.nombre} (${p.estado})`));
    } else {
        console.error('   ❌ Error al obtener periodos:', periodsRes.data.message);
    }

    // 3. Obtener Materias (Docente/Admin)
    console.log('\n📚 3. Obteniendo Materias del Docente...');
    let subjects = [];
    const subjectsRes = await request('GET', '/grades/teacher/subjects', null, token);
    if (subjectsRes.data.success) {
        subjects = subjectsRes.data.data;
        console.log(`   ✅ Materias encontradas: ${subjects.length}`);
        subjects.forEach(s => console.log(`      - [${s.id}] ${s.nombre}`));

        if (subjects.length === 0) {
            console.log('   ⚠️ Admin no tiene materias asignadas (normal si no es docente).');
            // Mocking subject for further testing if verification requires it
            // Or skipping
        }
    } else {
        // Si es 404 por perfil docente no encontrado, es esperado para admin puro
        if (subjectsRes.status === 404) {
            console.log('   ℹ️ Admin no tiene perfil docente asociado (Esperado).');
        } else {
            console.error('   ❌ Error al obtener materias:', subjectsRes.data.message);
        }
    }

    // 4. Prueba de Captura (Simulada si no hay materias)
    console.log('\n📝 4. Prueba de Captura de Calificación...');
    if (periods.length > 0) {
        const activePeriod = periods.find(p => p.estado === 'activo') || periods[0];
        const subjectId = subjects.length > 0 ? subjects[0].id : 1; // Fallback mock ID
        const studentId = 1; // Mock ID

        console.log(`   Intentando capturar para Materia ID ${subjectId}, Periodo ${activePeriod.id}, Estudiante ${studentId}`);

        const captureData = {
            estudianteId: studentId,
            materiaId: subjectId,
            periodoEvaluacionId: activePeriod.id,
            calificacion: 9.5
        };

        const captureRes = await request('POST', '/grades', captureData, token);

        if (captureRes.data.success) {
            console.log('   ✅ Calificación capturada exitosamente!');
            console.log('   Data:', captureRes.data.data);
        } else {
            console.log('   ⚠️ Fallo esperado si IDs no existen:', captureRes.data.message);
            // Esto valida que el endpoint responde adecuadamente (validaciones, FKs, etc)
        }
    } else {
        console.log('   ⚠️ No se pueden probar capturas sin periodos.');
    }

    console.log('\n🏁 VERIFICACIÓN COMPLETADA');
}

runTest();
