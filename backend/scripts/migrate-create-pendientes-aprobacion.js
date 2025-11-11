#!/usr/bin/env node

/**
 * 🗄️ SCRIPT: Crear Tabla pendientes_aprobacion en Neon PostgreSQL
 * Propósito: Crear la tabla para almacenar solicitudes pendientes de aprobación
 *           de formularios de Egresados y Bolsa de Trabajo
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migratePendientesAprobacion() {
    const client = await pool.connect();

    try {
        devLogger.log('🚀 Iniciando migración: Crear tabla pendientes_aprobacion...\n');

        // Leer el SQL del archivo
        const sqlFilePath = path.join(__dirname, 'create-pendientes-aprobacion-table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Ejecutar el SQL
        devLogger.log('📝 Ejecutando SQL...\n');
        await client.query(sqlContent);

        devLogger.log('✅ ¡Tabla pendientes_aprobacion creada exitosamente!');
        devLogger.log('\n📊 INFORMACIÓN DE LA TABLA:');
        devLogger.log('  • id: Identificador único (BIGSERIAL)');
        devLogger.log('  • uuid: UUID único para referencias');
        devLogger.log('  • tipo_solicitud: egresado | bolsa_trabajo');
        devLogger.log('  • email_usuario: Email de quien envía la solicitud');
        devLogger.log('  • datos_json: Datos del formulario en JSON');
        devLogger.log('  • estado: pendiente | aprobada | rechazada');
        devLogger.log('  • fecha_solicitud: Timestamp de envío');
        devLogger.log('  • fecha_procesado: Timestamp de aprobación/rechazo');
        devLogger.log('  • admin_id: ID del administrador que aprueba/rechaza');
        devLogger.log('  • admin_notas: Comentarios del administrador');

        // Verificar la tabla
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'pendientes_aprobacion'
            ORDER BY ordinal_position
        `);

        devLogger.log('\n📋 COLUMNAS CREADAS:');
        result.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)';
            devLogger.log(`  • ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${nullable}`);
        });

        // Verificar índices
        const indexResult = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'pendientes_aprobacion'
            ORDER BY indexname
        `);

        devLogger.log('\n🔍 ÍNDICES CREADOS:');
        indexResult.rows.forEach(row => {
            devLogger.log(`  • ${row.indexname}`);
        });

    } catch (error) {
        devLogger.error('❌ Error durante la migración:', error.message);
        devLogger.error('\n📌 Detalles del error:');
        devLogger.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
migratePendientesAprobacion().then(() => {
    devLogger.log('\n✅ Proceso de migración completado exitosamente');
    process.exit(0);
}).catch((err) => {
    devLogger.error('❌ Error fatal:', err);
    process.exit(1);
});
