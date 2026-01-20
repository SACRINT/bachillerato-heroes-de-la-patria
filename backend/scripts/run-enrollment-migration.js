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
        console.log('📋 Ejecutando migración: Sistema de Inscripciones...');

        const sqlFilePath = path.join(__dirname, '../migrations/008_enrollment_system.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - solicitudes_inscripcion');
        console.log('   - documentos_inscripcion');
        console.log('   - pagos_inscripcion');
        console.log('   - configuracion_inscripciones');
        console.log('🔧 Vistas, funciones y triggers creados.');

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
