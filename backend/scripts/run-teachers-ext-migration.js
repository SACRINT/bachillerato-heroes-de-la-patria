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
        console.log('📋 Ejecutando migración: Portal de Docentes - Módulos Extendidos...');

        const sqlFilePath = path.join(__dirname, '../migrations/007_teachers_portal_extended.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - planeaciones_clase');
        console.log('   - tareas');
        console.log('   - entregas_tareas');
        console.log('   - mensajes_masivos');
        console.log('   - entregas_mensajes');
        console.log('   - configuracion_reportes');
        console.log('🔧 Triggers y vistas creadas.');

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
