/**
 * Script para ejecutar migración de Notification Center
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('✨ Ejecutando migration de Notification Center...');

        const sqlPath = path.join(__dirname, '107-notifications-system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        await executeQuery(sql);

        console.log('✅ Tablas de Notificaciones creadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
