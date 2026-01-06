/**
 * Script para ejecutar migración de Analytics
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📊 Ejecutando migration de Analytics...');

        const sqlPath = path.join(__dirname, '064-gamification-analytics.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        console.log('✅ Analíticas de Gamificación inicializadas');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
