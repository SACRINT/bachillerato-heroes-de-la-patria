/**
 * Script de migración: Crear columna email_confirmado en pendientes_aprobacion
 * Ejecutar: node backend/scripts/migrate-email-confirmado.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function migrate() {
    const client = await pool.connect();

    try {
        devLogger.log('🔄 Iniciando migración...');

        // Agregar columna email_confirmado
        devLogger.log('📝 Creando columna email_confirmado...');
        await client.query(`
            ALTER TABLE pendientes_aprobacion
            ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN DEFAULT false
        `);
        devLogger.log('✅ Columna email_confirmado creada/verificada');

        // Crear índice para performance
        devLogger.log('📝 Creando índice...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pendientes_email_confirmado
            ON pendientes_aprobacion(email_confirmado, estado)
        `);
        devLogger.log('✅ Índice creado/verificado');

        // Verificar
        const result = await client.query(`
            SELECT COUNT(*) as total,
                   COUNT(*) FILTER (WHERE email_confirmado = true) as confirmados,
                   COUNT(*) FILTER (WHERE email_confirmado = false) as no_confirmados
            FROM pendientes_aprobacion
        `);

        devLogger.log('\n📊 Estado de la tabla:');
        devLogger.log('   Total registros:', result.rows[0].total);
        devLogger.log('   Confirmados:', result.rows[0].confirmados);
        devLogger.log('   No confirmados:', result.rows[0].no_confirmados);

        // Listar columnas
        const cols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name='pendientes_aprobacion'
            ORDER BY ordinal_position
        `);

        devLogger.log('\n📋 Columnas en tabla:');
        cols.rows.forEach(row => devLogger.log('   -', row.column_name));

        devLogger.log('\n✅ ¡Migración completada exitosamente!');
        process.exit(0);

    } catch (error) {
        devLogger.error('❌ Error en migración:', error.message);
        devLogger.error('Detalles:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
