require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('✅ Conectado a la base de datos.');
        console.log('📋 Ejecutando migración: Modelo SaaS Multi-Tenant...');

        const sqlFilePath = path.join(__dirname, '../migrations/011_multi_tenant_saas.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - tenants (escuelas clientes)');
        console.log('   - subscription_plans (4 planes precargados)');
        console.log('   - tenant_subscriptions');
        console.log('   - usage_metrics');
        console.log('   - tenant_invoices');
        console.log('   - tenant_audit_log');
        console.log('🔧 Vistas y funciones creadas.');
        console.log('🏢 Sistema multi-tenant completo.');

    } catch (err) {
        console.error('❌ Error ejecutando migración:', err.message);
        console.error(err);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
