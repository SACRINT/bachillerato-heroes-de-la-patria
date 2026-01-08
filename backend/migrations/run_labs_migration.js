/**
 * Script para ejecutar migración de Virtual Labs
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('✨ Ejecutando migration de Virtual Labs...');

        const sqlPath = path.join(__dirname, '096-virtual-labs.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        await executeQuery(sql);

        console.log('✅ Tablas de Virtual Labs creadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
