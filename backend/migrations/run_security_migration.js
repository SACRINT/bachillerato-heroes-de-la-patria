/**
 * Script para ejecutar migración de Security Audit
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('✨ Ejecutando migration de Security Audit...');

        const sqlPath = path.join(__dirname, '300-security-audit.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        await executeQuery(sql);

        console.log('✅ Auditoría de Seguridad y Optimizaciones aplicadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
