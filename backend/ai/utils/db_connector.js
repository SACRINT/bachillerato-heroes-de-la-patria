/**
 * @file db_connector.js
 * @description Conector seguro a PostgreSQL usando el pool existente del proyecto.
 * @module backend/ai/utils
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Singleton Pool instance
let pool;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            },
            max: 5, // Limit connections for ETL scripts
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            // Don't exit, just log. Process manager should handle restart if critical.
        });
    }
    return pool;
}

/**
 * Ejecuta una query con parámetros
 * @param {string} text SQL query
 * @param {Array} params Parámetros
 */
async function query(text, params) {
    const start = Date.now();
    const p = getPool();
    try {
        const res = await p.query(text, params);
        const duration = Date.now() - start;
        // Solo loguear queries lentas (> 1s) para no saturar logs
        if (duration > 1000) {
            console.warn('Slow query executed', { text, duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('Database Query Error', { text, error: error.message });
        throw error;
    }
}

/**
 * Cierra el pool explícitamente (útil para scripts CLI)
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    query,
    getPool,
    closePool
};
