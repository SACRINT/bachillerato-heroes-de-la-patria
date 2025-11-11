const { Pool } = require('pg');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createSolicitudesDocumentosTable() {
    devLogger.log('🗄️  Iniciando creación de tabla de solicitudes de documentos...');

    try {
        const sqlPath = path.join(__dirname, 'create-solicitudes-documentos-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        devLogger.log('✅ Tabla "solicitudes_documentos" creada exitosamente');

        const result = await pool.query('SELECT COUNT(*) as total FROM solicitudes_documentos');
        devLogger.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        devLogger.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createSolicitudesDocumentosTable();
