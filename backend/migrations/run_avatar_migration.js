/**
 * Script para ejecutar migración de Avatares
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('✨ Ejecutando migration de Avatar System...');

        const sqlPath = path.join(__dirname, '061-avatar-system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        console.log('✅ Tablas de avatares creadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
