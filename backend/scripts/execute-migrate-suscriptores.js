/**
 * 📝 Script para migrar tabla suscriptores_notificaciones
 * Agrega columnas faltantes sin perder datos existentes
 * Ejecuta: node backend/scripts/execute-migrate-suscriptores.js
 */

const { pool } = require('../config/database');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');

async function migrateSuscriptoresTable() {
    try {
        devLogger.log('📝 Migrando tabla suscriptores_notificaciones...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'migrate-suscriptores-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Ejecutar el SQL
        await pool.query(sql);

        devLogger.log('✅ Migración completada exitosamente');

        // Verificar que la tabla tiene las columnas necesarias
        const checkQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'suscriptores_notificaciones'
            ORDER BY ordinal_position
        `;

        const result = await pool.query(checkQuery);

        devLogger.log('\n📊 Estructura actualizada de la tabla:');
        console.table(result.rows);

        // Contar suscriptores
        const countQuery = 'SELECT COUNT(*) as total FROM suscriptores_notificaciones';
        const countResult = await pool.query(countQuery);
        devLogger.log(`\n✅ Total de suscriptores: ${countResult.rows[0].total}`);

        process.exit(0);

    } catch (error) {
        devLogger.error('❌ Error al migrar la tabla:', error.message);
        devLogger.error(error);
        process.exit(1);
    }
}

// Ejecutar
migrateSuscriptoresTable();
