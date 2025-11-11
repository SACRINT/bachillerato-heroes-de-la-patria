#!/usr/bin/env node

/**
 * 🗄️ SCRIPT: Insertar Datos de Prueba en Neon PostgreSQL (VERSIÓN MEJORADA)
 * Propósito: Crear registros de prueba con gestión correcta de usuarios
 *
 * Flujo:
 * 1. Crear usuarios en tabla `usuarios`
 * 2. Crear docentes (teachers) con usuario_id
 * 3. Crear estudiantes
 * 4. Crear padres (parents)
 * 5. Crear citas (appointments)
 * 6. Crear egresados (graduates)
 * 7. Crear bolsa_trabajo (job seekers)
 */

require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');
const devLogger = require('../utils/devLogger');
const { v4: uuidv4 } = require('uuid');

// Crear conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function insertTestData() {
    const client = await pool.connect();

    try {
        devLogger.log('🚀 Iniciando inserción de datos de prueba...\n');

        // BEGIN TRANSACTION
        await client.query('BEGIN');

        // ===== 1. CREAR USUARIOS PARA DOCENTES =====
        devLogger.log('👤 Creando usuarios para docentes...');
        const teacherUsers = [
            { username: 'jmartinez', email: 'juan.martinez@heroes.edu.mx', nombre: 'Juan', apellido_paterno: 'Martínez', apellido_materno: 'Pérez' },
            { username: 'mgonzalez', email: 'maria.gonzalez@heroes.edu.mx', nombre: 'María', apellido_paterno: 'González', apellido_materno: 'López' },
            { username: 'clopez', email: 'carlos.lopez@heroes.edu.mx', nombre: 'Carlos', apellido_paterno: 'López', apellido_materno: 'García' },
            { username: 'arodriguez', email: 'ana.rodriguez@heroes.edu.mx', nombre: 'Ana', apellido_paterno: 'Rodríguez', apellido_materno: 'Flores' },
            { username: 'rgarcia', email: 'roberto.garcia@heroes.edu.mx', nombre: 'Roberto', apellido_paterno: 'García', apellido_materno: 'Sánchez' },
            { username: 'psanchez', email: 'patricia.sanchez@heroes.edu.mx', nombre: 'Patricia', apellido_paterno: 'Sánchez', apellido_materno: 'Morales' },
        ];

        const teacherUserIds = [];
        const defaultPassword = crypto.createHash('sha256').update('Teacher123!').digest('hex');

        for (const user of teacherUsers) {
            const result = await client.query(
                `INSERT INTO usuarios (uuid, username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [uuidv4(), user.username, user.email, defaultPassword, 'docente', 'activo', user.nombre, user.apellido_paterno, user.apellido_materno]
            );

            if (result.rows.length > 0) {
                teacherUserIds.push({ id: result.rows[0].id, ...user });
            }
        }
        devLogger.log(`✅ ${teacherUserIds.length} usuarios de docentes creados\n`);

        // ===== 2. INSERTAR DOCENTES (TEACHERS) =====
        devLogger.log('📚 Insertando docentes...');
        const teachers = [
            { usuario_id: teacherUserIds[0]?.id, especialidad: 'Matemáticas', telefono: '2221234567' },
            { usuario_id: teacherUserIds[1]?.id, especialidad: 'Lengua Española', telefono: '2221234568' },
            { usuario_id: teacherUserIds[2]?.id, especialidad: 'Física', telefono: '2221234569' },
            { usuario_id: teacherUserIds[3]?.id, especialidad: 'Química', telefono: '2221234570' },
            { usuario_id: teacherUserIds[4]?.id, especialidad: 'Historia', telefono: '2221234571' },
            { usuario_id: teacherUserIds[5]?.id, especialidad: 'Biología', telefono: '2221234572' },
        ];

        for (let i = 0; i < teachers.length; i++) {
            const teacher = teachers[i];
            if (teacher.usuario_id) {
                const userInfo = teacherUserIds.find(u => u.id === teacher.usuario_id);
                const numeroEmpleado = `DOC-${2025}-${(1001 + i).toString()}`;
                await client.query(
                    `INSERT INTO docentes (usuario_id, numero_empleado, nombre, apellido_paterno, apellido_materno, especialidad, email_institucional, telefono, status, fecha_ingreso)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()::date)
                     ON CONFLICT DO NOTHING`,
                    [teacher.usuario_id, numeroEmpleado, userInfo.nombre, userInfo.apellido_paterno, userInfo.apellido_materno, teacher.especialidad, userInfo.email, teacher.telefono, 'activo']
                );
            }
        }
        devLogger.log(`✅ ${teachers.filter(t => t.usuario_id).length} docentes insertados\n`);

        // ===== 3. CREAR USUARIOS Y INSERTAR ESTUDIANTES =====
        devLogger.log('👤 Creando usuarios para estudiantes...');
        const studentUsers = [
            { username: 'lhernandez', email: 'luis.hernandez@heroes.edu.mx', nombre: 'Luis', apellido_paterno: 'Hernández', apellido_materno: 'García' },
            { username: 'sflores', email: 'sofia.flores@heroes.edu.mx', nombre: 'Sofia', apellido_paterno: 'Flores', apellido_materno: 'López' },
            { username: 'dtorres', email: 'diego.torres@heroes.edu.mx', nombre: 'Diego', apellido_paterno: 'Torres', apellido_materno: 'Ruiz' },
            { username: 'vcastro', email: 'valentina.castro@heroes.edu.mx', nombre: 'Valentina', apellido_paterno: 'Castro', apellido_materno: 'Flores' },
            { username: 'mromero', email: 'miguel.romero@heroes.edu.mx', nombre: 'Miguel', apellido_paterno: 'Romero', apellido_materno: 'Pérez' },
            { username: 'evargas', email: 'elena.vargas@heroes.edu.mx', nombre: 'Elena', apellido_paterno: 'Vargas', apellido_materno: 'Morales' },
            { username: 'fmendoza', email: 'felipe.mendoza@heroes.edu.mx', nombre: 'Felipe', apellido_paterno: 'Mendoza', apellido_materno: 'García' },
            { username: 'cruiz', email: 'camila.ruiz@heroes.edu.mx', nombre: 'Camila', apellido_paterno: 'Ruiz', apellido_materno: 'López' },
        ];

        const studentUserIds = [];
        const studentPassword = crypto.createHash('sha256').update('Student123!').digest('hex');

        for (const user of studentUsers) {
            const result = await client.query(
                `INSERT INTO usuarios (uuid, username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id`,
                [uuidv4(), user.username, user.email, studentPassword, 'estudiante', 'activo', user.nombre, user.apellido_paterno, user.apellido_materno]
            );

            if (result.rows.length > 0) {
                studentUserIds.push({ id: result.rows[0].id, ...user });
            }
        }
        devLogger.log(`✅ ${studentUserIds.length} usuarios de estudiantes creados\n`);

        devLogger.log('👥 Insertando estudiantes adicionales...');
        const additionalStudents = [
            { usuario_id: studentUserIds[0]?.id, matricula: '20250003', semestre: 1, promedio: 8.5, status_academico: 'regular', genero: 'M' },
            { usuario_id: studentUserIds[1]?.id, matricula: '20250004', semestre: 1, promedio: 9.0, status_academico: 'regular', genero: 'F' },
            { usuario_id: studentUserIds[2]?.id, matricula: '20250005', semestre: 3, promedio: 7.8, status_academico: 'regular', genero: 'M' },
            { usuario_id: studentUserIds[3]?.id, matricula: '20250006', semestre: 3, promedio: 8.9, status_academico: 'regular', genero: 'F' },
            { usuario_id: studentUserIds[4]?.id, matricula: '20250007', semestre: 5, promedio: 8.2, status_academico: 'regular', genero: 'M' },
            { usuario_id: studentUserIds[5]?.id, matricula: '20250008', semestre: 5, promedio: 8.7, status_academico: 'regular', genero: 'F' },
            { usuario_id: studentUserIds[6]?.id, matricula: '20250009', semestre: 2, promedio: 7.5, status_academico: 'regular', genero: 'M' },
            { usuario_id: studentUserIds[7]?.id, matricula: '20250010', semestre: 2, promedio: 9.1, status_academico: 'regular', genero: 'F' },
        ];

        for (const student of additionalStudents) {
            if (student.usuario_id) {
                const userInfo = studentUserIds.find(u => u.id === student.usuario_id);
                await client.query(
                    `INSERT INTO estudiantes (usuario_id, nombre, apellido_paterno, apellido_materno, matricula, semestre, promedio, status_academico, genero, fecha_ingreso)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()::date)
                     ON CONFLICT (matricula) DO NOTHING`,
                    [student.usuario_id, userInfo.nombre, userInfo.apellido_paterno, userInfo.apellido_materno, student.matricula, student.semestre, student.promedio, student.status_academico, student.genero]
                );
            }
        }
        devLogger.log(`✅ ${additionalStudents.filter(s => s.usuario_id).length} estudiantes insertados\n`);

        // ===== 4. INSERTAR PADRES (PARENTS) - OPCIONAL =====
        devLogger.log('👨‍👩‍👧 Saltando padres por ahora (requiere estudiantes existentes)...\n');
        // Los padres se insertarán después cuando tengan referencias válidas a estudiantes
        // const parents = [...];  // Omitido por simplicidad

        // ===== 5. INSERTAR CITAS (APPOINTMENTS) =====
        devLogger.log('📅 Insertando citas...');
        const appointments = [
            { nombre_completo: 'Luis Hernández', email: 'luis.hernandez@email.com', telefono: '2221234501', tipo_persona: 'Estudiante', motivo: 'Consulta Académica', descripcion: 'Consulta sobre calificaciones', fecha_solicitada: '2025-11-10', hora_solicitada: '10:00', estado: 'Pendiente' },
            { nombre_completo: 'Sofia Flores', email: 'sofia.flores@email.com', telefono: '2221234502', tipo_persona: 'Estudiante', motivo: 'Revisión de Tareas', descripcion: 'Revisar tareas pendientes', fecha_solicitada: '2025-11-11', hora_solicitada: '11:00', estado: 'Pendiente' },
            { nombre_completo: 'Diego Torres', email: 'diego.torres@email.com', telefono: '2221234503', tipo_persona: 'Estudiante', motivo: 'Asesoría', descripcion: 'Asesoría en matemáticas', fecha_solicitada: '2025-11-12', hora_solicitada: '14:00', estado: 'Confirmada' },
            { nombre_completo: 'Valentina Castro', email: 'valentina.castro@email.com', telefono: '2221234504', tipo_persona: 'Estudiante', motivo: 'Retroalimentación', descripcion: 'Evaluación de desempeño', fecha_solicitada: '2025-11-13', hora_solicitada: '15:00', estado: 'Confirmada' },
            { nombre_completo: 'Miguel Romero', email: 'miguel.romero@email.com', telefono: '2221234505', tipo_persona: 'Estudiante', motivo: 'Tutoría', descripcion: 'Tutoría general', fecha_solicitada: '2025-11-14', hora_solicitada: '09:00', estado: 'Pendiente' },
        ];

        for (const apt of appointments) {
            await client.query(
                `INSERT INTO citas (nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado)
                 VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8::time, $9)
                 ON CONFLICT DO NOTHING`,
                [apt.nombre_completo, apt.email, apt.telefono, apt.tipo_persona, apt.motivo, apt.descripcion, apt.fecha_solicitada, apt.hora_solicitada, apt.estado]
            );
        }
        devLogger.log(`✅ ${appointments.length} citas insertadas\n`);

        // ===== 6. INSERTAR EGRESADOS (GRADUATES) =====
        devLogger.log('🎓 Insertando egresados...');
        const graduates = [
            { nombre: 'Alejandro Pérez', email: 'alejandro.perez@email.com', generacion: '2024', telefono: '2221234601', ciudad: 'Puebla', ocupacion_actual: 'Estudiante Universitario', universidad: 'BUAP', carrera: 'Ingeniería en Sistemas', estatus_estudios: 'Estudiando', anio_egreso: 2024 },
            { nombre: 'Sofía Jiménez', email: 'sofia.jimenez@email.com', generacion: '2024', telefono: '2221234602', ciudad: 'Puebla', ocupacion_actual: 'Ingeniera de Software', universidad: 'IPN', carrera: 'Ingeniería Informática', estatus_estudios: 'Empleado', anio_egreso: 2024 },
            { nombre: 'Ricardo Morales', email: 'ricardo.morales@email.com', generacion: '2024', telefono: '2221234603', ciudad: 'México', ocupacion_actual: 'Contador', universidad: 'UNAM', carrera: 'Contabilidad', estatus_estudios: 'Estudiando', anio_egreso: 2024 },
            { nombre: 'Valentina López', email: 'valentina.lopez@email.com', generacion: '2024', telefono: '2221234604', ciudad: 'Puebla', ocupacion_actual: 'Emprendedora', universidad: 'ITESM', carrera: 'Administración de Empresas', estatus_estudios: 'Empleado Independiente', anio_egreso: 2024 },
        ];

        for (const grad of graduates) {
            await client.query(
                `INSERT INTO egresados (nombre, email, generacion, telefono, ciudad, ocupacion_actual, universidad, carrera, estatus_estudios, anio_egreso)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT DO NOTHING`,
                [grad.nombre, grad.email, grad.generacion, grad.telefono, grad.ciudad, grad.ocupacion_actual, grad.universidad, grad.carrera, grad.estatus_estudios, grad.anio_egreso]
            );
        }
        devLogger.log(`✅ ${graduates.length} egresados insertados\n`);

        // ===== 7. INSERTAR BOLSA DE TRABAJO (JOB SEEKERS) =====
        devLogger.log('💼 Insertando registros en bolsa de trabajo...');
        const jobSeekers = [
            { nombre_completo: 'Alejandro Pérez Sánchez', email: 'alejandro.perez@email.com', telefono: '2221234601', generacion: '2024', habilidades: 'Programación Java, Python, Base de datos', experiencia: 'Practicante en TechSoft Solutions', estado: 'Activo' },
            { nombre_completo: 'Sofía Jiménez López', email: 'sofia.jimenez@email.com', telefono: '2221234602', generacion: '2024', habilidades: 'Marketing Digital, Social Media, Analytics', experiencia: 'Community Manager en Digital Marketing Pro', estado: 'Activo' },
            { nombre_completo: 'Ricardo Morales García', email: 'ricardo.morales@email.com', telefono: '2221234603', generacion: '2024', habilidades: 'Contabilidad, Impuestos, SAP', experiencia: 'Contador en Empresa Consultora', estado: 'Activo' },
            { nombre_completo: 'Valentina López Ruiz', email: 'valentina.lopez@email.com', telefono: '2221234604', generacion: '2024', habilidades: 'Administración, Liderazgo, Emprendimiento', experiencia: 'Coordinadora de Proyectos', estado: 'Activo' },
        ];

        for (const seeker of jobSeekers) {
            await client.query(
                `INSERT INTO bolsa_trabajo (nombre_completo, email, telefono, generacion, habilidades, experiencia, estado)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT DO NOTHING`,
                [seeker.nombre_completo, seeker.email, seeker.telefono, seeker.generacion, seeker.habilidades, seeker.experiencia, seeker.estado]
            );
        }
        devLogger.log(`✅ ${jobSeekers.length} registros en bolsa de trabajo insertados\n`);

        // COMMIT TRANSACTION
        await client.query('COMMIT');

        devLogger.log('✅ ¡Datos de prueba insertados exitosamente!');
        devLogger.log('\n📊 RESUMEN:');
        devLogger.log(`  • Usuarios de docentes: ${teacherUserIds.length}`);
        devLogger.log(`  • Docentes: ${teachers.filter(t => t.usuario_id).length}`);
        devLogger.log(`  • Estudiantes adicionales: ${additionalStudents.length}`);
        devLogger.log(`  • Padres: ${parents.length}`);
        devLogger.log(`  • Citas: ${appointments.length}`);
        devLogger.log(`  • Egresados: ${graduates.length}`);
        devLogger.log(`  • Registros en bolsa de trabajo: ${jobSeekers.length}`);

    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error('❌ Error al insertar datos:', error.message);
        devLogger.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
insertTestData().then(() => {
    devLogger.log('\n✅ Proceso completado');
    process.exit(0);
}).catch((err) => {
    devLogger.error('❌ Error fatal:', err);
    process.exit(1);
});
