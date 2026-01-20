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
        console.log('📋 Ejecutando migración: Sistema Financiero Completo...');

        const sqlFilePath = path.join(__dirname, '../migrations/009_financial_system.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - transacciones_financieras');
        console.log('   - colegiaturas');
        console.log('   - servicios_escolares');
        console.log('   - pagos_servicios');
        console.log('   - ia_coins_transactions');
        console.log('🔧 Vistas, configuración y triggers creados.');
        console.log('💰 Sistema de pagos Stripe/OXXO configurado.');

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
