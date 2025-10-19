const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createContactosTable() {
    console.log('🗄️  Iniciando creación de tabla de contactos...');
    console.log('📡 Conectando a:', process.env.DATABASE_URL ? 'PostgreSQL configurado' : '❌ DATABASE_URL no encontrado');

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-contactos-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando script SQL...');

        // Ejecutar el script
        await pool.query(sql);

        console.log('✅ Tabla "contactos" creada exitosamente');
        console.log('✅ Índices creados');
        console.log('✅ Datos de prueba insertados');

        // Verificar
        const result = await pool.query('SELECT COUNT(*) as total FROM contactos');
        console.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        console.error('❌ Error al crear tabla:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔌 Conexión cerrada');
    }
}

createContactosTable();
