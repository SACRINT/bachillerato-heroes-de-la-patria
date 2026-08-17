const path = require('path');
require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env' });
}
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const tables = [
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

async function inspect() {
    console.log('🔍 INSPECCIONANDO TABLAS EN NEON POSTGRESQL...\n');
    for (const tableName of tables) {
        const res = await pool.query(
            `SELECT column_name, data_type, column_default, is_nullable 
             FROM information_schema.columns 
             WHERE table_schema = 'public' AND table_name = $1 
             ORDER BY ordinal_position;`,
            [tableName]
        );
        if (res.rows.length === 0) {
            console.log(`❌ TABLA ${tableName}: NO EXISTE`);
        } else {
            console.log(`✅ TABLA ${tableName} (${res.rows.length} columnas):`);
            res.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (default: ${col.column_default || 'none'}, nullable: ${col.is_nullable})`);
            });
        }
        console.log('');
    }

    // Check constraints
    const conRes = await pool.query(
        `SELECT conname, contype, conrelid::regclass::text as tablename, pg_get_constraintdef(c.oid) as def 
         FROM pg_constraint c 
         JOIN pg_namespace n ON n.oid = c.connamespace 
         WHERE n.nspname = 'public' 
           AND conrelid::regclass::text IN ('iacoins_transactions', 'iacoins_balances', 'iacoins_balance', 'challenges', 'badges', 'tournaments', 'user_streaks', 'bolsa_trabajo');`
    );
    console.log('\n🔒 CONSTRAINTS EN TABLAS EXISTENTES:');
    conRes.rows.forEach(r => console.log(`   - ${r.tablename} -> ${r.conname}: ${r.def}`));

    // Check triggers
    const trigRes = await pool.query(
        `SELECT event_object_table as table_name, trigger_name, action_timing, event_manipulation 
         FROM information_schema.triggers 
         WHERE trigger_schema = 'public' 
           AND event_object_table IN ('iacoins_transactions', 'iacoins_balances', 'iacoins_balance', 'challenges', 'badges', 'tournaments', 'user_streaks', 'bolsa_trabajo');`
    );
    console.log('\n⚡ TRIGGERS EN TABLAS:');
    trigRes.rows.forEach(t => console.log(`   - ${t.table_name}: ${t.trigger_name} (${t.action_timing} ${t.event_manipulation})`));

    // Check extensions
    const extRes = await pool.query('SELECT extname, extversion FROM pg_extension;');
    console.log('\n🧩 EXTENSIONES INSTALADAS:');
    extRes.rows.forEach(e => console.log(`   - ${e.extname} (${e.extversion})`));

    await pool.end();
}

inspect().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
