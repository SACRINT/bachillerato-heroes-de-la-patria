/**
 * 🔍 SCRIPT DE DIAGNÓSTICO - PRUEBA DE CONEXIÓN A BASE DE DATOS
 * Verifica que el .env se cargue correctamente y muestra información de la BD
 */

const path = require('path');
const devLogger = require('../utils/devLogger');

// 🔴 CARGAR .ENV DESDE LA RAÍZ DEL PROYECTO
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

devLogger.log('🔍 DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS');
devLogger.log('='.repeat(60));

// Verificar variables de entorno
devLogger.log('\n📋 VARIABLES DE ENTORNO:');
devLogger.log(`DATABASE_URL presente: ${!!process.env.DATABASE_URL}`);
devLogger.log(`DATABASE_URL empieza con: ${process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'N/A'}`);
devLogger.log(`DB_SSL: ${process.env.DB_SSL}`);
devLogger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Importar pool DESPUÉS de cargar .env
const { pool } = require('../config/database');

async function testConnection() {
    try {
        devLogger.log('\n🔌 INTENTANDO CONECTAR...');

        const client = await pool.connect();
        devLogger.log('✅ Conexión exitosa');

        // Verificar versión de PostgreSQL
        devLogger.log('\n📊 INFORMACIÓN DE LA BASE DE DATOS:');
        const versionResult = await client.query('SELECT version()');
        devLogger.log(`PostgreSQL Version: ${versionResult.rows[0].version}`);

        // Obtener nombre de la base de datos actual
        const dbNameResult = await client.query('SELECT current_database()');
        devLogger.log(`Base de datos actual: ${dbNameResult.rows[0].current_database}`);

        // Listar todas las tablas
        devLogger.log('\n📋 TABLAS DISPONIBLES:');
        const tablesResult = await client.query(`
            SELECT table_name,
                   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        devLogger.log(`Total de tablas: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(row => {
            devLogger.log(`  - ${row.table_name} (${row.column_count} columnas)`);
        });

        // Verificar tabla estudiantes específicamente
        devLogger.log('\n🎓 TABLA ESTUDIANTES:');
        const estudiantesCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'estudiantes'
            ) as table_exists
        `);

        if (estudiantesCheck.rows[0].table_exists) {
            devLogger.log('✅ Tabla "estudiantes" existe');

            // Contar registros
            const countResult = await client.query('SELECT COUNT(*) as total FROM estudiantes');
            devLogger.log(`Registros en estudiantes: ${countResult.rows[0].total}`);

            // Mostrar primeros 3 registros (sin datos sensibles)
            if (parseInt(countResult.rows[0].total) > 0) {
                const sampleResult = await client.query('SELECT id, nombre, apellido_paterno, apellido_materno FROM estudiantes LIMIT 3');
                devLogger.log('\nPrimeros registros:');
                sampleResult.rows.forEach((row, idx) => {
                    devLogger.log(`  ${idx + 1}. ID: ${row.id}, Nombre: ${row.nombre} ${row.apellido_paterno} ${row.apellido_materno}`);
                });
            } else {
                devLogger.log('⚠️ La tabla estudiantes está VACÍA');
            }
        } else {
            devLogger.log('❌ Tabla "estudiantes" NO existe');
        }

        // Verificar otras tablas importantes
        devLogger.log('\n📊 VERIFICACIÓN DE TABLAS CRÍTICAS:');
        const criticalTables = ['users', 'docentes', 'estudiantes', 'parents', 'user_sessions'];
        for (const tableName of criticalTables) {
            const checkResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                ) as exists
            `, [tableName]);

            if (checkResult.rows[0].exists) {
                const countResult = await client.query(`SELECT COUNT(*) as total FROM ${tableName}`);
                devLogger.log(`  ✅ ${tableName}: ${countResult.rows[0].total} registros`);
            } else {
                devLogger.log(`  ❌ ${tableName}: NO EXISTE`);
            }
        }

        client.release();
        devLogger.log('\n✅ DIAGNÓSTICO COMPLETADO');
        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ ERROR EN LA CONEXIÓN:', error.message);
        devLogger.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConnection();
