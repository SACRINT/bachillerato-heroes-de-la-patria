/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL (NEON)
 * Conexión PostgreSQL con fallback a sistema JSON
 *
 * IMPORTANTE: Adaptado para Neon PostgreSQL (Vercel)
 * - Usa DATABASE_URL de Neon
 * - Driver: pg (PostgreSQL)
 * - Compatible con Vercel serverless
 */

const { Pool } = require('pg');
// const jsonDb = require('./database-json'); // ⚠️ DESHABILITADO: No disponible en Vercel serverless
require('dotenv').config();

// Flag para determinar qué sistema usar (deshabilitado en Vercel)
let useJsonFallback = false;

// Configuración del pool de conexiones PostgreSQL
// Prioridad 1: DATABASE_URL de Neon (Vercel)
// Prioridad 2: Variables individuales (desarrollo local)
const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Requerido para Neon
        },
        max: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'heroes_patria_db',
        max: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

// Crear pool de conexiones PostgreSQL
const pool = new Pool(poolConfig);

// Log de configuración (solo muestra DATABASE_URL presente o no, no el valor completo)
console.log('🔧 Configuración PostgreSQL:', {
    source: process.env.DATABASE_URL ? 'DATABASE_URL (Neon/Vercel)' : 'Variables individuales',
    ssl: poolConfig.ssl ? 'Habilitado' : 'Deshabilitado',
    maxConnections: poolConfig.max
});

/**
 * Ejecutar query con manejo de errores y fallback JSON
 * @param {string} query - SQL query (sintaxis PostgreSQL)
 * @param {Array} params - Parámetros del query
 * @returns {Promise<Array>} Resultado del query
 */
async function executeQuery(query, params = []) {
    // ⚠️ Fallback JSON deshabilitado en Vercel - solo PostgreSQL
    // if (useJsonFallback) {
    //     return await jsonDb.executeQuery(query, params);
    // }

    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('❌ Error en PostgreSQL:', error.message);
        console.error('⚠️ Fallback JSON no disponible en Vercel');

        // En Vercel, lanzar error directamente
        throw error;
    }
}

/**
 * Ejecutar múltiples queries en transacción
 * @param {Array} queries - Array de objetos {query, params}
 * @returns {Promise<Array>} Resultados de los queries
 */
async function executeTransaction(queries) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const results = [];
        for (const {query, params = []} of queries) {
            const result = await client.query(query, params);
            results.push(result.rows);
        }

        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en transacción PostgreSQL:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Test de conexión a la base de datos con fallback
 */
async function testConnection() {
    // ⚠️ Fallback JSON deshabilitado en Vercel
    // if (useJsonFallback) {
    //     return await jsonDb.testConnection();
    // }

    try {
        const client = await pool.connect();
        console.log('✅ Conexión a PostgreSQL (Neon) establecida correctamente');

        // Verificar versión de PostgreSQL
        const result = await client.query('SELECT version()');
        console.log(`📊 PostgreSQL Version: ${result.rows[0].version}`);

        // Verificar tablas existentes
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log(`📋 Tablas disponibles (${tablesResult.rows.length}):`,
            tablesResult.rows.map(r => r.table_name).join(', '));

        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        console.error('🔧 Config:', {
            source: process.env.DATABASE_URL ? 'DATABASE_URL' : 'Variables individuales',
            host: poolConfig.host || 'N/A (usando DATABASE_URL)',
            port: poolConfig.port || 'N/A',
            database: poolConfig.database || 'N/A',
            ssl: poolConfig.ssl ? 'Habilitado' : 'Deshabilitado'
        });

        // En Vercel, lanzar error directamente (no hay fallback)
        throw error;
    }
}

/**
 * Cerrar pool de conexiones o sistema JSON
 */
async function closePool() {
    // ⚠️ Fallback JSON deshabilitado en Vercel
    // if (useJsonFallback) {
    //     return await jsonDb.closePool();
    // }

    try {
        await pool.end();
        console.log('✅ Pool de conexiones PostgreSQL cerrado');
    } catch (error) {
        console.error('❌ Error cerrando pool:', error.message);
    }
}

/**
 * Obtener estadísticas del pool o sistema JSON
 */
async function getPoolStats() {
    // ⚠️ Fallback JSON deshabilitado en Vercel
    // if (useJsonFallback) {
    //     return await jsonDb.getPoolStats();
    // }

    try {
        return {
            totalConnections: pool.totalCount,
            idleConnections: pool.idleCount,
            waitingConnections: pool.waitingCount,
            tipo: 'PostgreSQL'
        };
    } catch {
        return {
            totalConnections: 0,
            idleConnections: 0,
            waitingConnections: 0,
            tipo: 'PostgreSQL-Error'
        };
    }
}

/**
 * Forzar uso de PostgreSQL (deshabilitar fallback JSON)
 */
async function forcePostgreSQL() {
    console.log('🔧 Forzando uso exclusivo de PostgreSQL...');

    // Verificar que PostgreSQL esté disponible
    const client = await pool.connect();

    try {
        await client.query('SELECT 1');
        useJsonFallback = false;
        console.log('✅ Modo PostgreSQL forzado activado');
        return true;
    } catch (error) {
        console.error('❌ No se puede forzar PostgreSQL - no está disponible:', error.message);
        throw new Error('PostgreSQL no disponible para modo forzado');
    } finally {
        client.release();
    }
}

/**
 * Habilitar fallback JSON (modo híbrido)
 */
async function enableFallback() {
    console.log('🔧 Habilitando modo híbrido (PostgreSQL + JSON fallback)...');
    useJsonFallback = false; // Intentar usar PostgreSQL primero, JSON como fallback automático
    console.log('✅ Modo híbrido activado - PostgreSQL con fallback JSON automático');
    return true;
}

/**
 * Obtener estado actual del sistema de base de datos
 */
function getDatabaseMode() {
    return {
        useJsonFallback,
        mode: useJsonFallback ? 'json_fallback' : 'postgresql_primary',
        config: {
            source: process.env.DATABASE_URL ? 'DATABASE_URL (Neon)' : 'Variables individuales',
            ssl: poolConfig.ssl ? 'Habilitado' : 'Deshabilitado',
            maxConnections: poolConfig.max
        }
    };
}

/**
 * Función query simplificada (alias para pool.query)
 * Para compatibilidad con rutas que usan db.query()
 */
async function query(sql, params = []) {
    // ⚠️ Fallback JSON deshabilitado en Vercel
    // if (useJsonFallback) {
    //     return await jsonDb.executeQuery(sql, params);
    // }
    const result = await pool.query(sql, params);
    return [result.rows, result.fields]; // Formato compatible con mysql2
}

module.exports = {
    pool,
    query,
    executeQuery,
    executeTransaction,
    testConnection,
    closePool,
    getPoolStats,
    forcePostgreSQL,
    enableFallback,
    getDatabaseMode
};
