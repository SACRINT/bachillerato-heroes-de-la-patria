/**
 * 🏢 EJECUTOR DE MIGRACIÓN FASE 4 (MULTI-TENANT & RLS) EN NEON POSTGRESQL
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
}

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🚀 INICIANDO EJECUCIÓN DE MIGRACIÓN FASE 4 EN NEON...');
    const sqlPath = path.join(__dirname, 'fase4-multitenant-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📄 Leyendo ${sqlPath} (${sql.length} bytes)...`);

    try {
        await pool.query('RESET ROLE');
        try {
            await pool.query(sql);
            console.log('✅ ¡MIGRACIÓN FASE 4 EJECUTADA EXITOSAMENTE EN NEON SIN ERRORES!\n');
        } catch (error) {
            console.log('Detalle de error en query general:', error.message);
            console.log('Intentando ejecución por bloques individuales...');
            
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                try {
                    await pool.query(stmt);
                } catch (err) {
                    console.error(`❌ Error en statement #${i + 1}:\n${stmt.substring(0, 120)}...\n-> ${err.message}`);
                }
            }
        }

        // Verificar columnas tenant_id
        const tIdTables = await pool.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE column_name = 'tenant_id' AND table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log(`📊 TABLAS CON COLUMNA tenant_id (${tIdTables.rows.length}):`);
        tIdTables.rows.forEach(r => console.log(`   ✅ ${r.table_name}`));

        // Verificar RLS
        const rlsTables = await pool.query(`
            SELECT relname 
            FROM pg_class 
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
            WHERE pg_namespace.nspname = 'public' AND relrowsecurity = true
            ORDER BY relname;
        `);
        console.log(`\n🔒 TABLAS CON RLS ACTIVADO (${rlsTables.rows.length}):`);
        rlsTables.rows.forEach(r => console.log(`   ✅ ${r.relname}`));

        // Verificar políticas RLS
        const pols = await pool.query(`
            SELECT tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);
        console.log(`\n🛡️ POLÍTICAS RLS REGISTRADAS (${pols.rows.length}):`);
        pols.rows.forEach(p => console.log(`   ✅ ${p.tablename} -> ${p.policyname}`));

        // Verificar tenant 1
        const t1 = await pool.query('SELECT id, school_name, subdomain, status FROM tenants WHERE id = 1');
        console.log(`\n🏢 TENANT POR DEFECTO:`, t1.rows[0]);

    } catch (error) {
        console.error('❌ ERROR EJECUTANDO MIGRACIÓN FASE 4:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
