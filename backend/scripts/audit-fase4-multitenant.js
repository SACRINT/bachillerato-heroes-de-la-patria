require('dotenv').config({ path: 'c:/03_BachilleratoHeroesWeb/.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function audit() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔍 AUDITORÍA DE MULTI-TENANCY EN NEON POSTGRESQL');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // 1. Check tenants table columns
        const tCols = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tenants' AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        console.log(`1. TABLA 'tenants' (${tCols.rows.length} columnas):`);
        tCols.rows.forEach(c => console.log(`   - ${c.column_name}: ${c.data_type} (default: ${c.column_default}, nullable: ${c.is_nullable})`));

        // 2. Tenants rows
        const tRows = await pool.query('SELECT * FROM tenants LIMIT 10;');
        console.log(`\n2. FILAS EN TABLA 'tenants' (${tRows.rows.length}):`);
        tRows.rows.forEach(r => console.log('   -', JSON.stringify(r)));

        // 3. Tables with tenant_id column
        const tIdTables = await pool.query(`
            SELECT table_name, column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE column_name = 'tenant_id' AND table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log(`\n3. TABLAS CON COLUMNA 'tenant_id' (${tIdTables.rows.length}):`);
        tIdTables.rows.forEach(r => console.log(`   - ${r.table_name} (${r.data_type}, default: ${r.column_default})`));

        // 4. Tables with RLS enabled
        const rlsTables = await pool.query(`
            SELECT relname, relrowsecurity, relforcerowsecurity 
            FROM pg_class 
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
            WHERE pg_namespace.nspname = 'public' AND relrowsecurity = true;
        `);
        console.log(`\n4. TABLAS CON RLS ACTIVADO (${rlsTables.rows.length}):`);
        rlsTables.rows.forEach(r => console.log(`   - ${r.relname}`));

        // 5. Existing policies
        const policies = await pool.query(`
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
            FROM pg_policies 
            WHERE schemaname = 'public';
        `);
        console.log(`\n5. POLÍTICAS RLS EN BASE DE DATOS (${policies.rows.length}):`);
        policies.rows.forEach(p => console.log(`   - ${p.tablename} -> ${p.policyname} (${p.cmd})`));

        // 6. Check core tables presence
        const coreTables = ['usuarios', 'estudiantes', 'docentes', 'calificaciones', 'asistencias', 'teacher_attendance_sessions', 'iacoins_balance', 'user_streaks', 'challenges'];
        const exTables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ANY($1);
        `, [coreTables]);
        console.log(`\n6. TABLAS NÚCLEO ENCONTRADAS (${exTables.rows.length}/${coreTables.length}):`);
        exTables.rows.forEach(r => console.log(`   - ${r.table_name}`));

    } catch (error) {
        console.error('❌ Error en auditoría:', error);
    } finally {
        await pool.end();
    }
}

audit();
