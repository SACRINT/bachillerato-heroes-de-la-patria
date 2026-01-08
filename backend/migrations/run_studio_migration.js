/**
 * Script para ejecutar migración de Interactive Content Studio
 */
const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('✨ Ejecutando migration de Interactive Content Studio...');

        const sqlPath = path.join(__dirname, '093-interactive-content-studio.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Ejecutar las queries
        // Nota: executeQuery maneja el pool.query. 
        // Para scripts múltiples, es mejor ejecutar por partes si falla, o usar el cliente directamente.
        // Pero para el schema inicial debería funcionar.
        await executeQuery(sql);

        console.log('✅ Tablas de Content Studio creadas exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
