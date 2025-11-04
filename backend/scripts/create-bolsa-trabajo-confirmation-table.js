/**
 * 📧 Script: Crear tabla bolsa_trabajo_pending_confirmation
 * Ejecutar: node backend/scripts/create-bolsa-trabajo-confirmation-table.js
 */

require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createTable() {
    const client = await pool.connect();

    try {
        console.log('🔄 Iniciando creación de tabla bolsa_trabajo_pending_confirmation...\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-bolsa-trabajo-confirmation-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        console.log('📝 Ejecutando SQL...');
        await client.query(sql);
        console.log('✅ Tabla creada/verificada exitosamente\n');

        // Verificar estructura de la tabla
        console.log('📋 Verificando estructura de la tabla...');
        const columnsResult = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'bolsa_trabajo_pending_confirmation'
            ORDER BY ordinal_position
        `);

        console.log('\n📊 Columnas en la tabla:');
        columnsResult.rows.forEach((col, idx) => {
            console.log(`   ${idx + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
        });

        // Verificar índices
        console.log('\n🔍 Índices creados:');
        const indexResult = await client.query(`
            SELECT indexname FROM pg_indexes
            WHERE tablename = 'bolsa_trabajo_pending_confirmation'
            ORDER BY indexname
        `);

        indexResult.rows.forEach((idx, i) => {
            console.log(`   ${i + 1}. ${idx.indexname}`);
        });

        // Contar registros
        const countResult = await client.query(
            'SELECT COUNT(*) as total FROM bolsa_trabajo_pending_confirmation'
        );

        console.log('\n📈 Estado de la tabla:');
        console.log(`   Total registros: ${countResult.rows[0].total}`);

        console.log('\n✅ ¡Tabla creada exitosamente!');
        console.log('\n🚀 Próximos pasos:');
        console.log('   1. Modificar endpoint POST /api/bolsa-trabajo/cv');
        console.log('   2. Crear endpoint POST /api/bolsa-trabajo/confirm-email/:token');
        console.log('   3. Configurar servicio de email para enviar confirmación');
        console.log('   4. Actualizar el dashboard para mostrar aprobaciones');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error al crear tabla:', error.message);
        console.error('\nDetalles:', error);
        process.exit(1);

    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
