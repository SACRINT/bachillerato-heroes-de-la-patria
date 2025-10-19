const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function createBolsaTrabajoCVTable() {
    console.log('🗄️  Iniciando creación de tabla de CVs para bolsa de trabajo...');
    console.log('📡 Conectando a:', process.env.DATABASE_URL ? 'PostgreSQL configurado' : '❌ DATABASE_URL no encontrado');

    try {
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'create-bolsa-trabajo-cv-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando script SQL...');

        // Ejecutar el script
        await pool.query(sql);

        console.log('✅ Tabla "bolsa_trabajo_cv" creada exitosamente');
        console.log('✅ Índices creados');
        console.log('✅ Datos de prueba insertados');

        // Verificar
        const result = await pool.query('SELECT COUNT(*) as total FROM bolsa_trabajo_cv');
        console.log(`📊 Total de registros: ${result.rows[0].total}`);

    } catch (error) {
        console.error('❌ Error al crear tabla:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        console.log('🔌 Conexión cerrada');
    }
}

createBolsaTrabajoCVTable();
