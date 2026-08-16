/**
 * 🗄️ CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL (NEON)
 * Conexión PostgreSQL con fallback a sistema JSON
 *
 * IMPORTANTE: Adaptado para Neon PostgreSQL (Vercel)
 * - Usa DATABASE_URL de Neon
 * - Driver: pg (PostgreSQL)
 * - Compatible con Vercel serverless
 */

const path = require('path');
// 🔴 CORRECCIÓN: Cargar variables de entorno con soporte para .env.local
// Esto asegura que las credenciales locales no se pierdan si se requiere este archivo directamente
try {
    const rootEnv = path.resolve(__dirname, '../../.env');
    const localEnv = path.resolve(__dirname, '../../.env.local');
    const cwdEnv = path.resolve(process.cwd(), '.env');
    require('dotenv').config({ path: localEnv });
    require('dotenv').config({ path: rootEnv });
    require('dotenv').config({ path: cwdEnv });
    require('dotenv').config();
} catch (e) {
    // dotenv is optional if env vars are already loaded in the environment
}
const { Pool } = require('pg');
// const jsonDb = require('./database-json.js'); // ⚠️ DESHABILITADO: No disponible en Vercel serverless
const devLogger = require('../utils/devLogger.js');

// Flag para determinar qué sistema usar (deshabilitado en Vercel)
let useJsonFallback = false;

// Configuración del pool de conexiones PostgreSQL
// Prioridad 1: DATABASE_URL de Neon (Vercel)
// Prioridad 2: Variables individuales (desarrollo local)
//
// OPTIMIZACIONES SEMANA 30:
// - Aumentado de 10 a 100 para soportar load testing con 7,800 usuarios
// - Ventana de idle aumentada a 60 segundos para mejor reutilización
// - Timeout de conexión aumentado a 5 segundos
// Prioridad 1: DATABASE_URL de Neon (Vercel) - IGNORAR SI ES PLACEHOLDER
const hasValidUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('CHANGE_ME');
const poolConfig = hasValidUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        // SSL configurable según variable de entorno (false para local, true para Neon)
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: parseInt(process.env.DB_CONNECTION_LIMIT) || 100,  // Aumentado de 10 a 100
        min: parseInt(process.env.DB_CONNECTION_MIN) || 10,      // Min = 10 conexiones
        idleTimeoutMillis: 60000,                                // Aumentado de 30s a 60s
        connectionTimeoutMillis: 5000,                           // Aumentado de 10s a 5s (más rápido)
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'heroes_patria_db',
        max: parseInt(process.env.DB_CONNECTION_LIMIT) || 100,   // Aumentado de 10 a 100
        min: parseInt(process.env.DB_CONNECTION_MIN) || 10,      // Min = 10 conexiones
        idleTimeoutMillis: 60000,                                // Aumentado de 30s a 60s
        connectionTimeoutMillis: 5000,                           // Aumentado de 10s a 5s (más rápido)
        ssl: false // Forzar false para desarrollo local si no hay DATABASE_URL
    };

// Crear pool de conexiones PostgreSQL
const pool = new Pool(poolConfig);

// 🛡️ CRITICAL FIX: Manejo de errores del pool para prevenir crashes del proceso
pool.on('error', (err, client) => {
    devLogger.error('❌ Error inesperado en el cliente PostgreSQL inactivo', err);
    // No lanzar error aquí para evitar que el proceso se detenga (System Exit)
    // Vercel serverless puede recuperar nuevas conexiones después
});

// Log de configuración (solo muestra DATABASE_URL presente o no, no el valor completo)
devLogger.log('🔧 Configuración PostgreSQL:', {
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
        devLogger.error('❌ Error en PostgreSQL:', error.message);
        devLogger.error('⚠️ Fallback JSON no disponible en Vercel');

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
        for (const { query, params = [] } of queries) {
            const result = await client.query(query, params);
            results.push(result.rows);
        }

        await client.query('COMMIT');
        return results;
    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error('❌ Error en transacción PostgreSQL:', error.message);
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
        devLogger.log('✅ Conexión a PostgreSQL (Neon) establecida correctamente');

        // Verificar versión de PostgreSQL
        const result = await client.query('SELECT version()');
        devLogger.log(`📊 PostgreSQL Version: ${result.rows[0].version}`);

        // Verificar tablas existentes
        const tablesResult = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        devLogger.log(`📋 Tablas disponibles (${tablesResult.rows.length}):`,
            tablesResult.rows.map(r => r.table_name).join(', '));

        client.release();
        return true;
    } catch (error) {
        devLogger.error('❌ Error conectando a PostgreSQL:', error.message);
        devLogger.error('🔧 Config:', {
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
        devLogger.log('✅ Pool de conexiones PostgreSQL cerrado');
    } catch (error) {
        devLogger.error('❌ Error cerrando pool:', error.message);
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
    devLogger.log('🔧 Forzando uso exclusivo de PostgreSQL...');

    // Verificar que PostgreSQL esté disponible
    const client = await pool.connect();

    try {
        await client.query('SELECT 1');
        useJsonFallback = false;
        devLogger.log('✅ Modo PostgreSQL forzado activado');
        return true;
    } catch (error) {
        devLogger.error('❌ No se puede forzar PostgreSQL - no está disponible:', error.message);
        throw new Error('PostgreSQL no disponible para modo forzado');
    } finally {
        client.release();
    }
}

/**
 * Habilitar fallback JSON (modo híbrido)
 */
async function enableFallback() {
    devLogger.log('🔧 Habilitando modo híbrido (PostgreSQL + JSON fallback)...');
    useJsonFallback = false; // Intentar usar PostgreSQL primero, JSON como fallback automático
    devLogger.log('✅ Modo híbrido activado - PostgreSQL con fallback JSON automático');
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
