const { Pool } = require('pg');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createPasswordRecoveryRequestsTable() {
    devLogger.log('🗄️  Iniciando creación de tabla de solicitudes de recuperación...');

    try {
        const sqlPath = path.join(__dirname, 'create-password-recovery-requests-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        devLogger.log('✅ Tabla "password_recovery_requests" creada exitosamente');

        const result = await pool.query('SELECT COUNT(*) as total FROM password_recovery_requests');
        devLogger.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        devLogger.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createPasswordRecoveryRequestsTable();
