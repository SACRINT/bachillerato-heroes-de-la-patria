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
        console.log('📋 Ejecutando migración: Sistema de Validación de Calificaciones...');

        const sqlFilePath = path.join(__dirname, '../migrations/006_grades_validation_system.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf-8');

        await client.query(sql);

        console.log('✅ Migración completada exitosamente!');
        console.log('📊 Tablas creadas:');
        console.log('   - auditoria_calificaciones');
        console.log('   - alertas_estudiantes');
        console.log('   - promedios_estudiantes');
        console.log('   - configuracion_validacion');
        console.log('🔧 Columnas agregadas a calificaciones:');
        console.log('   - status, validado_por, fecha_validacion, comentarios_validacion');
        console.log('🎯 Funciones y vistas creadas.');

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
