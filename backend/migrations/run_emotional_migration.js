const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('❤️Iniciando Migración Emotional Analytics...');
    const client = await pool.connect();
    try {
        const sqlPath = path.join(__dirname, '071-emotional-analytics.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📜 Ejecutando SQL...');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migración Emotional Analytics completada.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en migración:', error);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
