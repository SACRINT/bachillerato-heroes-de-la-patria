const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🚀 Iniciando migración 068: A/B Testing...');

        const sqlPath = path.join(__dirname, '068-ab-testing.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migración A/B Testing completada exitosamente.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en migración:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

runMigration();
