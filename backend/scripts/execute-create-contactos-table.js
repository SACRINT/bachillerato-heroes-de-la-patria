const { Pool } = require('pg');
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createContactosTable() {
    devLogger.log('🗄️  Iniciando creación de tabla de contactos...');
    devLogger.log('📡 Conectando a:', process.env.DATABASE_URL ? 'PostgreSQL configurado' : '❌ DATABASE_URL no encontrado');

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-contactos-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        devLogger.log('📄 Ejecutando script SQL...');

        // Ejecutar el script
        await pool.query(sql);

        devLogger.log('✅ Tabla "contactos" creada exitosamente');
        devLogger.log('✅ Índices creados');
        devLogger.log('✅ Datos de prueba insertados');

        // Verificar
        const result = await pool.query('SELECT COUNT(*) as total FROM contactos');
        devLogger.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        devLogger.error('❌ Error al crear tabla:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        devLogger.log('🔌 Conexión cerrada');
    }
}

createContactosTable();
