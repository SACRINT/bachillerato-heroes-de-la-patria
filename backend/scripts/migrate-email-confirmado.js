/**
 * Script de migración: Crear columna email_confirmado en pendientes_aprobacion
 * Ejecutar: node backend/scripts/migrate-email-confirmado.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('🔄 Iniciando migración...');

        // Agregar columna email_confirmado
        console.log('📝 Creando columna email_confirmado...');
        await client.query(`
            ALTER TABLE pendientes_aprobacion
            ADD COLUMN IF NOT EXISTS email_confirmado BOOLEAN DEFAULT false
        `);
        console.log('✅ Columna email_confirmado creada/verificada');

        // Crear índice para performance
        console.log('📝 Creando índice...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_pendientes_email_confirmado
            ON pendientes_aprobacion(email_confirmado, estado)
        `);
        console.log('✅ Índice creado/verificado');

        // Verificar
        const result = await client.query(`
            SELECT COUNT(*) as total,
                   COUNT(*) FILTER (WHERE email_confirmado = true) as confirmados,
                   COUNT(*) FILTER (WHERE email_confirmado = false) as no_confirmados
            FROM pendientes_aprobacion
        `);

        console.log('\n📊 Estado de la tabla:');
        console.log('   Total registros:', result.rows[0].total);
        console.log('   Confirmados:', result.rows[0].confirmados);
        console.log('   No confirmados:', result.rows[0].no_confirmados);

        // Listar columnas
        const cols = await client.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name='pendientes_aprobacion'
            ORDER BY ordinal_position
        `);

        console.log('\n📋 Columnas en tabla:');
        cols.rows.forEach(row => console.log('   -', row.column_name));

        console.log('\n✅ ¡Migración completada exitosamente!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        console.error('Detalles:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
