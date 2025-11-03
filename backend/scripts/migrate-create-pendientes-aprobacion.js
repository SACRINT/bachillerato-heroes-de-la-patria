#!/usr/bin/env node

/**
 * 🗄️ SCRIPT: Crear Tabla pendientes_aprobacion en Neon PostgreSQL
 * Propósito: Crear la tabla para almacenar solicitudes pendientes de aprobación
 *           de formularios de Egresados y Bolsa de Trabajo
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migratePendientesAprobacion() {
    const client = await pool.connect();

    try {
        console.log('🚀 Iniciando migración: Crear tabla pendientes_aprobacion...\n');

        // Leer el SQL del archivo
        const sqlFilePath = path.join(__dirname, 'create-pendientes-aprobacion-table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // Ejecutar el SQL
        console.log('📝 Ejecutando SQL...\n');
        await client.query(sqlContent);

        console.log('✅ ¡Tabla pendientes_aprobacion creada exitosamente!');
        console.log('\n📊 INFORMACIÓN DE LA TABLA:');
        console.log('  • id: Identificador único (BIGSERIAL)');
        console.log('  • uuid: UUID único para referencias');
        console.log('  • tipo_solicitud: egresado | bolsa_trabajo');
        console.log('  • email_usuario: Email de quien envía la solicitud');
        console.log('  • datos_json: Datos del formulario en JSON');
        console.log('  • estado: pendiente | aprobada | rechazada');
        console.log('  • fecha_solicitud: Timestamp de envío');
        console.log('  • fecha_procesado: Timestamp de aprobación/rechazo');
        console.log('  • admin_id: ID del administrador que aprueba/rechaza');
        console.log('  • admin_notas: Comentarios del administrador');

        // Verificar la tabla
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'pendientes_aprobacion'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 COLUMNAS CREADAS:');
        result.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)';
            console.log(`  • ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${nullable}`);
        });

        // Verificar índices
        const indexResult = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'pendientes_aprobacion'
            ORDER BY indexname
        `);

        console.log('\n🔍 ÍNDICES CREADOS:');
        indexResult.rows.forEach(row => {
            console.log(`  • ${row.indexname}`);
        });

    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.error('\n📌 Detalles del error:');
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
migratePendientesAprobacion().then(() => {
    console.log('\n✅ Proceso de migración completado exitosamente');
    process.exit(0);
}).catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
});
