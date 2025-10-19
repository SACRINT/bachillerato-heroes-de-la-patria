/**
 * 🔧 SCRIPT DE EJECUCIÓN: Crear Tabla de Sesiones en PostgreSQL
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * PROPÓSITO: Ejecutar el script SQL para crear la tabla user_sessions
 * USO: node backend/scripts/execute-create-user-sessions-table.js
 */

require('dotenv').config();
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Ejecutar script SQL para crear tabla de sesiones
 */
async function createUserSessionsTable() {
    console.log('🚀 Iniciando creación de tabla user_sessions...\n');

    try {
        // Leer archivo SQL
        const sqlFilePath = path.join(__dirname, 'create-user-sessions-table.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📄 Leyendo script SQL:', sqlFilePath);

        // Conectar a la base de datos
        const client = await pool.connect();
        console.log('✅ Conectado a PostgreSQL');

        // Ejecutar el script SQL
        console.log('\n⚙️  Ejecutando script SQL...\n');
        await client.query(sqlContent);

        console.log('✅ Tabla user_sessions creada exitosamente!\n');

        // Verificar que la tabla existe
        const verifyResult = await client.query(`
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'user_sessions'
            ORDER BY ordinal_position
        `);

        console.log('📋 Estructura de la tabla user_sessions:');
        console.table(verifyResult.rows);

        // Verificar índices
        const indexResult = await client.query(`
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'user_sessions'
        `);

        console.log('\n🔍 Índices creados:');
        console.table(indexResult.rows);

        // Liberar conexión
        client.release();
        console.log('\n✅ Script ejecutado exitosamente');
        console.log('🎉 La tabla user_sessions está lista para usar con connect-pg-simple');

    } catch (error) {
        console.error('\n❌ Error al crear tabla user_sessions:', error.message);
        console.error('\nDetalles del error:', error);
        process.exit(1);
    } finally {
        // Cerrar pool de conexiones
        await pool.end();
        console.log('\n🔒 Conexión a base de datos cerrada');
    }
}

// Ejecutar función principal
createUserSessionsTable();
