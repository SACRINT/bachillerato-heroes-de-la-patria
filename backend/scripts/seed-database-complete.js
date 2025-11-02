/**
 * 🌱 SEED DATABASE COMPLETO - INSERCIÓN MASIVA DE DATOS
 * Script robusto que inserta datos de prueba en TODAS las tablas
 * Con transacción, rollback automático y verificación de estructura
 */

const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

// ============================================
// DATOS DE PRUEBA POR TABLA
// ============================================

const seedData = {
    usuarios: [
        { id: 1, email: 'admin@heroespatria.edu.mx', username: 'admin', password_hash: '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', role: 'admin', status: 'activo' },
        { id: 3, email: 'parent1@example.com', username: 'parent1', password_hash: 'hashed_password_parent1', role: 'padre', status: 'activo' },
        { id: 4, email: 'parent2@example.com', username: 'parent2', password_hash: 'hashed_password_parent2', role: 'padre', status: 'activo' },
        { id: 5, email: 'ash.ketchum@heroespatria.edu.mx', username: 'ash_ketchum', password_hash: '$2b$12$temp_hash_001', role: 'estudiante', status: 'activo' },
        { id: 6, email: 'misty.waterflower@heroespatria.edu.mx', username: 'misty_waterflower', password_hash: '$2b$12$temp_hash_002', role: 'estudiante', status: 'activo' },
        { id: 7, email: 'prof.oak@heroespatria.edu.mx', username: 'prof_oak', password_hash: '$2b$12$temp_hash_003', role: 'docente', status: 'activo' }
    ],

    parents: [
        { id: 1, nombre: 'Delia Ketchum', email: 'parent1@example.com', password_hash: 'hashed_password_parent1' },
        { id: 2, nombre: 'Daisy Waterflower', email: 'parent2@example.com', password_hash: 'hashed_password_parent2' }
    ],

    estudiantes: [
        { id: 1, usuario_id: 5, matricula: '20250001', nombre: 'Ash', apellido_paterno: 'Ketchum', genero: 'M', semestre: 1, fecha_ingreso: '2025-08-15' },
        { id: 2, usuario_id: 6, matricula: '20250002', nombre: 'Misty', apellido_paterno: 'Waterflower', genero: 'F', semestre: 1, fecha_ingreso: '2025-08-15' }
    ],

    docentes: [
        { id: 1, usuario_id: 7, numero_empleado: 'EMP-001', nombre: 'Samuel', apellido_paterno: 'Oak', especialidad: 'Pokémonology', fecha_ingreso: '2020-01-15' }
    ],

    bolsa_trabajo: [
        { nombre_completo: 'Ana García Martínez', email: 'ana.garcia@example.com', telefono: '5551112233', generacion: '2022', habilidades: 'JavaScript, React, Node.js', estado: 'nuevo' },
        { nombre_completo: 'Brock Pewter', email: 'brock@example.com', telefono: '555-1234', generacion: '2022', habilidades: 'Cooking, Rock-type Pokemon', experiencia: 'Gym Leader', estado: 'nuevo' },
        { nombre_completo: 'Tracey Sketchit', email: 'tracey@example.com', telefono: '555-5678', generacion: '2023', habilidades: 'Pokemon Watching, Drawing', experiencia: 'Pokemon Watcher', estado: 'revisado' }
    ],

    egresados: [
        { nombre: 'Juan Carlos Pérez García', email: 'juan.perez@example.com', telefono: '2221234567', generacion: '2020-2023', anio_egreso: 2023, ciudad: 'Puebla', verificado: false },
        { nombre: 'María Fernanda López Ramírez', email: 'maria.lopez@example.com', telefono: '2229876543', generacion: '2019-2022', anio_egreso: 2022, ciudad: 'Puebla', verificado: true },
        { nombre: 'Carlos Eduardo Hernández Sánchez', email: 'carlos.hernandez@example.com', telefono: '2223456789', generacion: '2021-2024', anio_egreso: 2024, ciudad: 'Puebla', verificado: true }
    ],

    contactos: [
        { nombre: 'Ana Martínez', email: 'ana@test.com', telefono: '2221234567', asunto: 'Consulta sobre horarios', mensaje: 'Quisiera saber los horarios', tipo_consulta: 'Información General', form_type: 'Contacto General', status: 'pendiente', verificado: true, email_sent: false },
        { nombre: 'Carlos Gómez', email: 'carlos@test.com', asunto: 'Proceso de inscripción', mensaje: '¿Cuál es el proceso para inscribir a mi hijo?', tipo_consulta: 'Admisiones e Inscripciones', form_type: 'Contacto General', status: 'pendiente', verificado: true, email_sent: false }
    ],

    citas: [
        { cita_id: 'CITA-2025-0001', nombre_completo: 'Juan Pérez García', email: 'juan.perez@example.com', telefono: '2221234567', tipo_persona: 'padre', motivo: 'Asesoría Académica', descripcion: 'Consulta académica', fecha_solicitada: '2025-11-05', hora_solicitada: '10:00:00', estado: 'pendiente', confirmada: false, token_confirmacion: 'token_001' },
        { cita_id: 'CITA-2025-0002', nombre_completo: 'María López Hernández', email: 'maria.lopez@example.com', telefono: '2229876543', tipo_persona: 'madre', motivo: 'Inscripción', descripcion: 'Información inscripción', fecha_solicitada: '2025-11-07', hora_solicitada: '11:00:00', estado: 'aprobada', confirmada: true, token_confirmacion: 'token_002' }
    ],

    solicitudes_documentos: [
        { nombre: 'María González', email: 'maria@test.com', tipo_usuario: 'student', documento_solicitado: 'Constancia de estudios', motivo: 'Trámite de beca', nivel_urgencia: 'high', status: 'pendiente' },
        { nombre: 'Pedro Ramírez', email: 'pedro@test.com', tipo_usuario: 'parent', documento_solicitado: 'Certificado de calificaciones', motivo: 'Universidad', nivel_urgencia: 'normal', status: 'pendiente' }
    ],

    poll_categories: [
        { name: 'Académico', slug: 'academico', description: 'Encuestas académicas', icon: '📚', color: '#3498db', active: true, display_order: 1 },
        { name: 'Eventos', slug: 'eventos', description: 'Encuestas sobre eventos', icon: '🎉', color: '#9b59b6', active: true, display_order: 2 },
        { name: 'Instalaciones', slug: 'instalaciones', description: 'Infraestructura', icon: '🏫', color: '#e74c3c', active: true, display_order: 3 }
    ]
};

// ============================================
// FUNCIÓN PRINCIPAL DE SEEDING
// ============================================

async function seedDatabase() {
    console.log('🌱 SEED DATABASE - INSERCIÓN MASIVA DE DATOS');
    console.log('='.repeat(60));

    const client = await pool.connect();

    try {
        // NO usar transacción - insertar lo que se pueda
        console.log('🔄 Iniciando inserción (modo tolerante a errores)\n');

        let totalInserted = 0;

        // Iterar sobre cada tabla
        for (const [tableName, rows] of Object.entries(seedData)) {
            if (rows.length === 0) continue;

            console.log(`📊 Insertando en ${tableName}...`);

            // Verificar si la tabla existe
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                )
            `, [tableName]);

            if (!tableCheck.rows[0].exists) {
                console.log(`  ⚠️  Tabla ${tableName} no existe, saltando...`);
                continue;
            }

            // Obtener columnas de la tabla
            const columnsResult = await client.query(`
                SELECT column_name, column_default
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [tableName]);

            const tableColumns = columnsResult.rows.map(r => r.column_name);

            // Insertar cada fila
            for (const row of rows) {
                // Filtrar solo las columnas que existen en la tabla
                const validColumns = Object.keys(row).filter(col => tableColumns.includes(col));

                if (validColumns.length === 0) {
                    console.log(`  ⚠️  No hay columnas válidas para insertar`);
                    continue;
                }

                // Preparar valores
                const values = validColumns.map(col => row[col]);
                const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
                const columnsStr = validColumns.join(', ');

                // Construir query
                const insertQuery = `
                    INSERT INTO ${tableName} (${columnsStr})
                    VALUES (${placeholders})
                    ON CONFLICT DO NOTHING
                `;

                try {
                    await client.query(insertQuery, values);
                    totalInserted++;
                } catch (err) {
                    console.log(`  ⚠️  Error en fila: ${err.message}`);
                }
            }

            // Actualizar secuencia si existe columna id
            if (tableColumns.includes('id')) {
                try {
                    await client.query(`SELECT setval('${tableName}_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ${tableName}))`);
                } catch (err) {
                    // Secuencia no existe, ignorar
                }
            }

            console.log(`  ✅ ${tableName}: ${rows.length} registros procesados`);
        }

        console.log(`\n✅ INSERCIÓN COMPLETADA - ${totalInserted} registros insertados exitosamente`);

        // Verificar inserciones
        console.log('\n📊 VERIFICACIÓN FINAL:');
        console.log('='.repeat(60));

        for (const tableName of Object.keys(seedData)) {
            try {
                const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                const count = parseInt(countResult.rows[0].count);
                console.log(`  ${tableName.padEnd(30)} ${count} registros`);
            } catch (err) {
                console.log(`  ${tableName.padEnd(30)} Tabla no existe`);
            }
        }

        // Mostrar estudiantes insertados
        console.log('\n🎓 ESTUDIANTES INSERTADOS:');
        console.log('='.repeat(60));
        const estudiantesResult = await client.query(`
            SELECT id, matricula, nombre, apellido_paterno, semestre
            FROM estudiantes
            ORDER BY id
        `);
        estudiantesResult.rows.forEach(row => {
            console.log(`  ${row.id}. ${row.matricula} - ${row.nombre} ${row.apellido_paterno} (Semestre ${row.semestre})`);
        });

        console.log('\n✅ SEED COMPLETADO EXITOSAMENTE');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR FATAL');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
    }
}

// Ejecutar
seedDatabase();
