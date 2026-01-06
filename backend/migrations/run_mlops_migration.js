const { executeQuery } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('🤖 Ejecutando migration de MLOps Registry (Semana 11)...');
        const sqlPath = path.join(__dirname, '067-mlops-registry.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        await executeQuery(sql);
        console.log('✅ Sistema MLOps inicializado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migration:', error.message);
        process.exit(1);
    }
}

runMigration();
