const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env' });
}
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🚀 INICIANDO EJECUCIÓN DE MIGRACIÓN FASE 3 EN NEON...');
    const client = await pool.connect();
    try {
        const sqlPath = path.resolve(__dirname, 'fase3-gamification-migration.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log(`📄 Leyendo ${sqlPath} (${sqlContent.length} bytes)...`);
        console.log('⚡ Ejecutando en Neon PostgreSQL...');

        await client.query(sqlContent);

        console.log('✅ ¡MIGRACIÓN EJECUTADA EXITOSAMENTE EN NEON SIN ERRORES!\n');

        // Verificar 12 tablas solicitadas
        const requiredTables = [
            'iacoins_balance',
            'iacoins_balances',
            'iacoins_transactions',
            'wallet',
            'wallet_history',
            'user_streaks',
            'challenges',
            'tournaments',
            'trivia_sessions',
            'level_definitions',
            'badges',
            'bolsa_trabajo'
        ];

        const resTables = await client.query(
            `SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = ANY($1::text[]) 
             ORDER BY table_name;`,
            [requiredTables]
        );

        console.log(`📊 TABLAS VERIFICADAS EN NEON (${resTables.rows.length}/${requiredTables.length}):`);
        const found = resTables.rows.map(r => r.table_name);
        requiredTables.forEach(t => {
            if (found.includes(t)) {
                console.log(`   ✅ ${t}`);
            } else {
                console.log(`   ❌ ${t} (FALTA)`);
            }
        });

        // Verificar extensiones
        const extRes = await client.query(`SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');`);
        console.log('\n🧩 EXTENSIONES:');
        extRes.rows.forEach(e => console.log(`   ✅ ${e.extname}`));

        // Verificar columnas clave
        const colCheck = await client.query(
            `SELECT column_name FROM information_schema.columns 
             WHERE table_name = 'iacoins_transactions' AND column_name IN ('status', 'transaction_type', 'metadata', 'balance_before', 'balance_after');`
        );
        console.log('\n🔍 COLUMNAS VERIFICADAS EN iacoins_transactions:');
        colCheck.rows.forEach(c => console.log(`   ✅ ${c.column_name}`));

    } catch (err) {
        console.error('❌ ERROR EJECUTANDO MIGRACIÓN:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
