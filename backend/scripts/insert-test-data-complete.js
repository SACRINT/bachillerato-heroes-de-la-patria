#!/usr/bin/env node

/**
 * 🗄️ SCRIPT: Insertar Datos de Prueba en Neon PostgreSQL
 * Propósito: Crear registros de prueba para todos los tabs del dashboard
 *
 * Tablas a poblar:
 * - estudiantes (adicionales a los 2 existentes)
 * - docentes (teachers)
 * - padres (parents)
 * - citas (appointments - adicionales)
 * - egresados (graduates)
 * - bolsa_trabajo (job portal)
 */

require('dotenv').config();
const { Pool } = require('pg');

// Crear conexión a PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function insertTestData() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando inserción de datos de prueba...\n');

        // BEGIN TRANSACTION
        await client.query('BEGIN');

        // ===== 1. INSERTAR DOCENTES (TEACHERS) =====
        console.log('📚 Insertando docentes...');
        const teachers = [
            { nombre: 'Juan', apellido_paterno: 'Martínez', apellido_materno: 'Pérez', especialidad: 'Matemáticas', email: 'juan.martinez@heroes.edu.mx', telefono: '2221234567', status: 'activo' },
            { nombre: 'María', apellido_paterno: 'González', apellido_materno: 'López', especialidad: 'Lengua Española', email: 'maria.gonzalez@heroes.edu.mx', telefono: '2221234568', status: 'activo' },
            { nombre: 'Carlos', apellido_paterno: 'López', apellido_materno: 'García', especialidad: 'Física', email: 'carlos.lopez@heroes.edu.mx', telefono: '2221234569', status: 'activo' },
            { nombre: 'Ana', apellido_paterno: 'Rodríguez', apellido_materno: 'Flores', especialidad: 'Química', email: 'ana.rodriguez@heroes.edu.mx', telefono: '2221234570', status: 'activo' },
            { nombre: 'Roberto', apellido_paterno: 'García', apellido_materno: 'Sánchez', especialidad: 'Historia', email: 'roberto.garcia@heroes.edu.mx', telefono: '2221234571', status: 'activo' },
            { nombre: 'Patricia', apellido_paterno: 'Sánchez', apellido_materno: 'Morales', especialidad: 'Biología', email: 'patricia.sanchez@heroes.edu.mx', telefono: '2221234572', status: 'activo' },
        ];

        for (const teacher of teachers) {
            await client.query(
                `INSERT INTO docentes (nombre, apellido_paterno, apellido_materno, especialidad, email_institucional, telefono, status, fecha_ingreso)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()::date)
                 ON CONFLICT DO NOTHING`,
                [teacher.nombre, teacher.apellido_paterno, teacher.apellido_materno, teacher.especialidad, teacher.email, teacher.telefono, teacher.status]
            );
        }
        console.log(`✅ ${teachers.length} docentes insertados\n`);

        // ===== 2. INSERTAR ESTUDIANTES ADICIONALES =====
        console.log('👥 Insertando estudiantes adicionales...');
        const additionalStudents = [
            { nombre: 'Luis', apellido_paterno: 'Hernández', apellido_materno: 'García', matricula: '20250003', semestre: 1, promedio: 8.5, status_academico: 'regular' },
            { nombre: 'Sofia', apellido_paterno: 'Flores', apellido_materno: 'López', matricula: '20250004', semestre: 1, promedio: 9.0, status_academico: 'regular' },
            { nombre: 'Diego', apellido_paterno: 'Torres', apellido_materno: 'Ruiz', matricula: '20250005', semestre: 3, promedio: 7.8, status_academico: 'regular' },
            { nombre: 'Valentina', apellido_paterno: 'Castro', apellido_materno: 'Flores', matricula: '20250006', semestre: 3, promedio: 8.9, status_academico: 'regular' },
            { nombre: 'Miguel', apellido_paterno: 'Romero', apellido_materno: 'Pérez', matricula: '20250007', semestre: 5, promedio: 8.2, status_academico: 'regular' },
            { nombre: 'Elena', apellido_paterno: 'Vargas', apellido_materno: 'Morales', matricula: '20250008', semestre: 5, promedio: 8.7, status_academico: 'regular' },
            { nombre: 'Felipe', apellido_paterno: 'Mendoza', apellido_materno: 'García', matricula: '20250009', semestre: 2, promedio: 7.5, status_academico: 'regular' },
            { nombre: 'Camila', apellido_paterno: 'Ruiz', apellido_materno: 'López', matricula: '20250010', semestre: 2, promedio: 9.1, status_academico: 'regular' },
        ];

        for (const student of additionalStudents) {
            await client.query(
                `INSERT INTO estudiantes (nombre, apellido_paterno, apellido_materno, matricula, semestre, promedio, status_academico, fecha_ingreso)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()::date)
                 ON CONFLICT (matricula) DO NOTHING`,
                [student.nombre, student.apellido_paterno, student.apellido_materno, student.matricula, student.semestre, student.promedio, student.status_academico]
            );
        }
        console.log(`✅ ${additionalStudents.length} estudiantes adicionales insertados\n`);

        // ===== 3. INSERTAR PADRES (PARENTS) =====
        console.log('👨‍👩‍👧 Insertando padres de familia...');
        const crypto = require('crypto');
        const parents = [
            { nombre: 'Dr. Pedro Hernández', email: 'pedro.hernandez@email.com', password: 'Padres123!', student_id: 1 },
            { nombre: 'Sra. Patricia Flores', email: 'patricia.flores@email.com', password: 'Padres123!', student_id: 2 },
            { nombre: 'Ing. Marco Torres', email: 'marco.torres@email.com', password: 'Padres123!', student_id: 3 },
            { nombre: 'Arq. Laura Castro', email: 'laura.castro@email.com', password: 'Padres123!', student_id: 4 },
            { nombre: 'Dr. Antonio Romero', email: 'antonio.romero@email.com', password: 'Padres123!', student_id: 5 },
            { nombre: 'Lic. Gabriela Vargas', email: 'gabriela.vargas@email.com', password: 'Padres123!', student_id: 6 },
        ];

        for (const parent of parents) {
            // Simple hash using sha256 for demonstration
            const passwordHash = crypto.createHash('sha256').update(parent.password).digest('hex');
            await client.query(
                `INSERT INTO parents (nombre, email, password_hash, student_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [parent.nombre, parent.email, passwordHash, parent.student_id]
            );
        }
        console.log(`✅ ${parents.length} padres insertados\n`);

        // ===== 4. INSERTAR CITAS ADICIONALES (APPOINTMENTS) =====
        console.log('📅 Insertando citas adicionales...');
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
        console.log(`✅ ${appointments.length} citas insertadas\n`);

        // ===== 5. INSERTAR EGRESADOS (GRADUATES) =====
        console.log('🎓 Insertando egresados...');
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
        console.log(`✅ ${graduates.length} egresados insertados\n`);

        // ===== 6. INSERTAR BOLSA DE TRABAJO (JOB SEEKERS) =====
        console.log('💼 Insertando registros en bolsa de trabajo...');
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
        console.log(`✅ ${jobSeekers.length} registros en bolsa de trabajo insertados\n`);

        // COMMIT TRANSACTION
        await client.query('COMMIT');

        console.log('✅ ¡Datos de prueba insertados exitosamente!');
        console.log('\n📊 RESUMEN:');
        console.log(`  • Docentes: ${teachers.length}`);
        console.log(`  • Estudiantes adicionales: ${additionalStudents.length}`);
        console.log(`  • Padres: ${parents.length}`);
        console.log(`  • Citas: ${appointments.length}`);
        console.log(`  • Egresados: ${graduates.length}`);
        console.log(`  • Registros en bolsa de trabajo: ${jobSeekers.length}`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al insertar datos:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
insertTestData().then(() => {
    console.log('\n✅ Proceso completado');
    process.exit(0);
}).catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
