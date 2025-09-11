/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS
 * Conexión MySQL con pool de conexiones optimizado
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración del pool de conexiones
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'heroes_patria_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4',
    timezone: 'Z'
};

// Crear pool de conexiones
const pool = mysql.createPool(poolConfig);

/**
 * Ejecutar query con manejo de errores
 * @param {string} query - SQL query
 * @param {Array} params - Parámetros del query
 * @returns {Promise<Array>} Resultado del query
 */
async function executeQuery(query, params = []) {
    try {
        const [rows] = await pool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        console.error('📝 Query:', query);
        console.error('🔧 Params:', params);
        throw error;
    }
}

/**
 * Ejecutar múltiples queries en transacción
 * @param {Array} queries - Array de objetos {query, params}
 * @returns {Promise<Array>} Resultados de los queries
 */
async function executeTransaction(queries) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const {query, params = []} of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        console.error('❌ Error en transacción:', error.message);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Test de conexión a la base de datos
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        
        // Verificar versión de MySQL
        const [rows] = await connection.execute('SELECT VERSION() as version');
        console.log(`📊 MySQL Version: ${rows[0].version}`);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        console.error('🔧 Config:', {
            host: poolConfig.host,
            port: poolConfig.port,
            database: poolConfig.database,
            user: poolConfig.user
        });
        return false;
    }
}

/**
 * Cerrar pool de conexiones
 */
async function closePool() {
    try {
        await pool.end();
        console.log('✅ Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error cerrando pool:', error.message);
    }
}

/**
 * Obtener estadísticas del pool
 */
function getPoolStats() {
    return {
        totalConnections: pool.pool._allConnections.length,
        freeConnections: pool.pool._freeConnections.length,
        acquiringConnections: pool.pool._acquiringConnections.length
    };
}

module.exports = {
    pool,
    executeQuery,
    executeTransaction,
    testConnection,
    closePool,
    getPoolStats
};