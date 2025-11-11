const path = require('path');
const devLogger = require('../utils/devLogger');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { pool } = require('../config/database');

async function checkTables() {
    const client = await pool.connect();

    for (const table of ['docentes', 'bolsa_trabajo', 'egresados', 'suscriptores', 'newsletters']) {
        devLogger.log(`\n📋 TABLA: ${table}`);
        devLogger.log('='.repeat(60));
        const result = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = '${table}'
            ORDER BY ordinal_position
        `);
        result.rows.forEach(col => {
            devLogger.log(`  ${col.column_name.padEnd(30)} ${col.data_type}`);
        });
    }

    client.release();
    process.exit(0);
}

checkTables().catch(err => {
    devLogger.error('Error:', err.message);
    process.exit(1);
});
