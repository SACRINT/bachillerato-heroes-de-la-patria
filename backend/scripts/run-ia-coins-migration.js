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
        console.log('📋 Ejecutando migración: Sistema IA Coins Completo...');

        const sqlFilePath = path.join(__dirname, '../migrations/010_ia_coins_economy.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - ia_coins_store (10 items precargados)');
        console.log('   - user_inventory');
        console.log('   - premios_reales (6 premios precargados)');
        console.log('   - canjes_premios');
        console.log('   - auctions');
        console.log('   - auction_bids');
        console.log('   - vip_subscriptions');
        console.log('🔧 Vistas y funciones utilitarias creadas.');
        console.log('🎮 Sistema de economía virtual completo.');

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
