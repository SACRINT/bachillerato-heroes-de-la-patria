/**
 * Script para ejecutar migración de Tournaments
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🏆 Ejecutando migration de Torneos...');

        const sqlPath = path.join(__dirname, '063-tournaments-system.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        console.log('✅ Sistema de Torneos inicializado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
