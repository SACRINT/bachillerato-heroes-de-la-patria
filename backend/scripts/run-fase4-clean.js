require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runCleanMigration() {
    console.log('🚀 EJECUTANDO MIGRACIÓN FASE 4 (CLEAN & TRANSACTIONAL)...');
    const sqlPath = path.join(__dirname, 'fase4-multitenant-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query('RESET ROLE');
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('✅ ¡MIGRACIÓN FASE 4 APLICADA EXITOSAMENTE EN TRANSACCIÓN!\n');

        // Validar políticas RLS
        const pols = await client.query("SELECT tablename, policyname, qual FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename");
        console.log(`🛡️ POLÍTICAS RLS ACTUALIZADAS (${pols.rows.length}):`);
        pols.rows.forEach(p => console.log(`   ✅ ${p.tablename} -> ${p.policyname}`));

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error en migración:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runCleanMigration();
