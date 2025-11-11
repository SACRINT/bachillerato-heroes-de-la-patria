/**
 * 📧 Script: Crear tabla bolsa_trabajo_pending_confirmation
 * Ejecutar: node backend/scripts/create-bolsa-trabajo-confirmation-table.js
 */

require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

async function createTable() {
    const client = await pool.connect();

    try {
        devLogger.log('🔄 Iniciando creación de tabla bolsa_trabajo_pending_confirmation...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-bolsa-trabajo-confirmation-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        devLogger.log('📝 Ejecutando SQL...');
        await client.query(sql);
        devLogger.log('✅ Tabla creada/verificada exitosamente\n');

        // Verificar estructura de la tabla
        devLogger.log('📋 Verificando estructura de la tabla...');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'bolsa_trabajo_pending_confirmation'
            ORDER BY ordinal_position
        `);

        devLogger.log('\n📊 Columnas en la tabla:');
        columnsResult.rows.forEach((col, idx) => {
            devLogger.log(`   ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
        });

        // Verificar índices
        devLogger.log('\n🔍 Índices creados:');
        const indexResult = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'bolsa_trabajo_pending_confirmation'
            ORDER BY indexname
        `);

        indexResult.rows.forEach((idx, i) => {
            devLogger.log(`   ${i + 1}. ${idx.indexname}`);
        });

        // Contar registros
        const countResult = await client.query(
            'SELECT COUNT(*) as total FROM bolsa_trabajo_pending_confirmation'
        );

        devLogger.log('\n📈 Estado de la tabla:');
        devLogger.log(`   Total registros: ${countResult.rows[0].total}`);

        devLogger.log('\n✅ ¡Tabla creada exitosamente!');
        devLogger.log('\n🚀 Próximos pasos:');
        devLogger.log('   1. Modificar endpoint POST /api/bolsa-trabajo/cv');
        devLogger.log('   2. Crear endpoint POST /api/bolsa-trabajo/confirm-email/:token');
        devLogger.log('   3. Configurar servicio de email para enviar confirmación');
        devLogger.log('   4. Actualizar el dashboard para mostrar aprobaciones');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ Error al crear tabla:', error.message);
        devLogger.error('\nDetalles:', error);
        process.exit(1);

    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
