const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createNotificacionesTable() {
    console.log('🗄️  Iniciando creación de tabla de notificaciones...');

    try {
        const sqlPath = path.join(__dirname, 'create-notificaciones-convocatorias-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        console.log('✅ Tabla "notificaciones_convocatorias" creada exitosamente');

        const result = await pool.query('SELECT COUNT(*) as total FROM notificaciones_convocatorias');
        console.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createNotificacionesTable();
