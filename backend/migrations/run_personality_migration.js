/**
 * Script para ejecutar migración de Personality Profiling
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🧠 Ejecutando migration de Personality Profiling (Semana 9)...');

        const sqlPath = path.join(__dirname, '065-personality-profiling.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        await executeQuery(sql);

        console.log('✅ Tablas de Perfilado de Estudiante creadas');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
