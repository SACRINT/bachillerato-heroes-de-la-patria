/**
 * 🌱 SCRIPT DE SEEDING: Generación Masiva de Datos de Prueba (VERSIÓN CORREGIDA FINAL)
 *
 * Propósito: Generar 50,000 registros de estudiantes con datos realistas
 * para simular carga de datos y validar que el índice se utilice.
 * Esta versión está 100% sincronizada con el esquema real de la BD.
 *
 * Dependencias: faker-js, pg (node-postgres)
 *
 * Uso: node backend/scripts/seed-estudiantes.js
 */

// Importar el pool de conexión configurado centralmente
const { pool } = require('../config/database');
const { faker } = require('@faker-js/faker/locale/es_MX');

// Especialidades disponibles en BGE
const ESPECIALIDADES = [
    'Administración',
    'Contabilidad',
    'Informática',
    'Enfermería',
    'Educación',
    'Ingeniería',
    'Recursos Humanos',
    'Logística',
];

// Estados académicos posibles (SINCRONIZADO CON LA BASE DE DATOS)
const STATUS_ACADEMICO = [
    'regular',
    'irregular',
    'baja',
    'egresado',
];

/**
 * Genera un registro de estudiante compatible con el esquema real de la BD
 * @param {number} userId - El ID del usuario de prueba a asociar
 * @returns {Object} Objeto estudiante con todas las columnas válidas
 */
function generarEstudiante(userId) {
    const nombre = faker.person.firstName();
    const apellido_paterno = faker.person.lastName();
    const apellido_materno = faker.person.lastName();
    const especialidad = faker.helpers.arrayElement(ESPECIALIDADES);
    const semestre = faker.number.int({ min: 1, max: 6 });
    const promedio = parseFloat((faker.number.float({ min: 0, max: 99.99 })).toFixed(2));
    const status_academico = faker.helpers.arrayElement(STATUS_ACADEMICO);
    const fecha_nacimiento = faker.date.birthdate({ min: 16, max: 40 });
    const genero = faker.helpers.arrayElement(['M', 'F']);
    const telefono = faker.phone.number('##########');
    const direccion = faker.location.streetAddress();
    const fecha_ingreso = faker.date.past({ years: 4 });
    const curp = faker.string.alphanumeric(18).toUpperCase();
    
    // CORRECCIÓN: Usar CURP como matrícula para cumplir con el límite de 20 caracteres
    const matricula = curp;

    return {
        usuario_id: userId, // CORRECCIÓN: Incluir el usuario_id
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        especialidad,
        semestre,
        promedio,
        status_academico,
        fecha_nacimiento,
        genero,
        telefono,
        direccion,
        fecha_ingreso,
        curp,
    };
}

/**
 * Realiza una inserción masiva en batches (CORREGIDO PARA EL ESQUEMA REAL)
 * @param {Array} estudiantes - Array de registros de estudiantes
 * @param {number} batchSize - Tamaño de cada batch
 */
async function insertarEnBatches(estudiantes, batchSize = 500) {
    const batches = [];

    for (let i = 0; i < estudiantes.length; i += batchSize) {
        batches.push(estudiantes.slice(i, i + batchSize));
    }

    devLogger.log(`📦 Se crearán ${batches.length} batches de ${batchSize} registros cada uno`);

    let totalInsertados = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        try {
            // Query de INSERT adaptada al esquema real con todas las columnas
            let query = `
                INSERT INTO estudiantes
                (usuario_id, nombre, apellido_paterno, apellido_materno, matricula, especialidad,
                 semestre, promedio, status_academico, fecha_nacimiento, genero,
                 telefono, direccion, fecha_ingreso, curp)
                VALUES
            `;

            const values = [];
            let paramIndex = 1;

            batch.forEach((est, idx) => {
                const params = [
                    est.usuario_id,
                    est.nombre,
                    est.apellido_paterno,
                    est.apellido_materno,
                    est.matricula,
                    est.especialidad,
                    est.semestre,
                    est.promedio,
                    est.status_academico,
                    est.fecha_nacimiento,
                    est.genero,
                    est.telefono,
                    est.direccion,
                    est.fecha_ingreso,
                    est.curp,
                ];

                values.push(...params);

                const placeholders = Array.from({ length: params.length },
                    () => `$${paramIndex++}`
                ).join(', ');

                if (idx > 0) query += ', ';
                query += `(${placeholders})`;
            });

            await pool.query(query, values);
            totalInsertados += batch.length;

            const porcentaje = ((batchIndex + 1) / batches.length * 100).toFixed(2);
            devLogger.log(`✅ Batch ${batchIndex + 1}/${batches.length} completado (${totalInsertados}/${estudiantes.length} registros, ${porcentaje}%)`);

        } catch (error) {
            devLogger.error(`❌ Error en batch ${batchIndex + 1}:`, error.message);
            throw error;
        }
    }

    return totalInsertados;
}

/**
 * Función principal de ejecución
 */
async function ejecutarSeeding() {
    const client = await pool.connect();

    try {
        devLogger.log('\n🌱 INICIANDO SCRIPT DE SEEDING DE ESTUDIANTES\n');
        devLogger.log('═'.repeat(60));

        // PASO 1: Vaciar la tabla
        devLogger.log('\n📋 PASO 1: Vaciando tablas (estudiantes y usuarios de prueba)...');
        await client.query('TRUNCATE TABLE estudiantes RESTART IDENTITY CASCADE;');
        await client.query("DELETE FROM usuarios WHERE email LIKE 'testuser.seeder@%'");
        devLogger.log('✅ Tablas vaciadas correctamente');

        // PASO 2: Crear un usuario de prueba para asociar a los estudiantes
        devLogger.log('\n👤 PASO 2: Creando usuario de prueba...');
        const userEmail = `testuser.seeder@${Date.now()}.com`;
        const userResult = await client.query(
            `INSERT INTO usuarios (nombre, apellido_paterno, email, username, role, status, password_hash)
             VALUES ('Seeder', 'Test', $1, $2, 'estudiante', 'activo', 'dummy_password_for_seeder')
             RETURNING id`,
            [userEmail, userEmail]
        );
        const testUserId = userResult.rows[0].id;
        devLogger.log(`✅ Usuario de prueba creado con ID: ${testUserId}`);

        // PASO 3: Generar datos de estudiantes
        devLogger.log('\n🔄 PASO 3: Generando 50,000 registros de estudiantes...');
        const estudiantes = Array.from({ length: 50000 }, () => generarEstudiante(testUserId));
        devLogger.log('✅ Registros generados exitosamente');

        // PASO 4: Insertar en batches
        devLogger.log('\n📤 PASO 4: Insertando registros en batches...');
        const totalInsertados = await insertarEnBatches(estudiantes, 500);
        devLogger.log(`✅ Total de registros insertados: ${totalInsertados}`);

        // PASO 5: Recrear el índice con COLLATE "C" para forzar Index Scan
        devLogger.log('\n🔧 PASO 5: Recreando índice con COLLATE "C" para forzar Index Scan...');

        // Eliminar índice anterior si existe
        await client.query('DROP INDEX IF EXISTS idx_estudiantes_apellidos_nombre;');
        devLogger.log('  ✓ Índice anterior eliminado');

        // Crear nuevo índice con COLLATE "C"
        await client.query(`
            CREATE INDEX CONCURRENTLY idx_estudiantes_apellidos_nombre_collate
            ON estudiantes (
                apellido_paterno COLLATE "C" ASC,
                apellido_materno COLLATE "C" ASC,
                nombre COLLATE "C" ASC
            );
        `);
        devLogger.log('  ✓ Nuevo índice con COLLATE "C" creado');

        // Actualizar estadísticas
        await client.query('ANALYZE estudiantes;');
        devLogger.log('✅ Índice recreado y estadísticas actualizadas');

        // PASO 6: Verificar conteo
        devLogger.log('\n✔️  PASO 6: Verificando conteo de registros...');
        const resultCount = await client.query('SELECT COUNT(*) as count FROM estudiantes;');
        const count = resultCount.rows[0].count;
        devLogger.log(`✅ Total de registros en la tabla: ${count}`);

        // PASO 7: Verificar índice creado
        devLogger.log('\n✔️  PASO 7: Verificando índice creado...');
        const indexCheck = await client.query(`
            SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
            FROM pg_indexes
            WHERE tablename = 'estudiantes'
            AND indexname LIKE '%apellidos%'
            ORDER BY indexname;
        `);
        if (indexCheck.rows.length > 0) {
            devLogger.log('✅ Índice verificado:');
            indexCheck.rows.forEach(idx => {
                devLogger.log(`   - ${idx.indexname} (${idx.index_size})`);
            });
        } else {
            devLogger.log('⚠️  ADVERTENCIA: No se encontró el índice con COLLATE');
        }

        devLogger.log('\n═'.repeat(60));
        devLogger.log('\n🎉 SEEDING COMPLETADO EXITOSAMENTE\n');
        devLogger.log('📌 La tabla ahora contiene datos suficientes para que el planificador de');
        devLogger.log('   PostgreSQL elija usar el Index Scan en lugar de Seq Scan.\n');
        devLogger.log('🔍 Próximo paso: Ejecutar EXPLAIN ANALYZE en Neon Console para validar\n');

    } catch (error) {
        devLogger.error('\n❌ ERROR DURANTE EL SEEDING:', error.message);
        devLogger.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar seeding
ejecutarSeeding().catch(error => {
    devLogger.error('❌ Error fatal:', error);
    process.exit(1);
});