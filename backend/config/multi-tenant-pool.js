/**
 * 🏢 MULTI-TENANT CONNECTION POOL
 * Connection pooling dinámico por tenant
 * Semana 5 - Multi-tenancy Avanzado - Tarea 7
 *
 * NOTA: Para arquitectura simple, todos los tenants usan el mismo pool
 * Para arquitectura avanzada (schema separation), cada tenant tendría su pool
 */

const { Pool } = require('pg');

/**
 * Mapa de pools por tenant (para arquitecturas avanzadas)
 * Por ahora, todos usan el mismo pool con RLS
 */
const tenantPools = new Map();

/**
 * Pool compartido (default para arquitectura RLS)
 */
const sharedPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

/**
 * Obtiene pool para tenant específico
 * Por ahora retorna pool compartido (todos los tenants usan RLS en mismo DB)
 */
function getTenantPool(tenantId) {
    // Arquitectura RLS: Todos usan el mismo pool
    // El aislamiento se hace por RLS policies en PostgreSQL
    return sharedPool;

    // Para arquitectura avanzada con schemas separados:
    // if (!tenantPools.has(tenantId)) {
    //     const tenantPool = new Pool({
    //         ...sharedPool.options,
    //         // Configurar schema específico para este tenant
    //         statement_timeout: 30000,
    //         search_path: `tenant_${tenantId},public`
    //     });
    //     tenantPools.set(tenantId, tenantPool);
    // }
    // return tenantPools.get(tenantId);
}

/**
 * Ejecuta query con tenant context
 */
async function queryWithTenant(tenantId, sql, params = []) {
    const pool = getTenantPool(tenantId);
    const client = await pool.connect();

    try {
        // Configurar tenant context para RLS
        await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);

        // Ejecutar query
        const result = await client.query(sql, params);

        return result;

    } finally {
        client.release();
    }
}

/**
 * Ejecuta transacción con tenant context
 */
async function transactionWithTenant(tenantId, callback) {
    const pool = getTenantPool(tenantId);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.current_tenant_id = $1`, [tenantId]);

        const result = await callback(client);

        await client.query('COMMIT');

        return result;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;

    } finally {
        client.release();
    }
}

/**
 * Cierra todos los pools (llamar al shutdown de la app)
 */
async function closeAllPools() {
    await sharedPool.end();

    for (const [tenantId, pool] of tenantPools.entries()) {
        await pool.end();
        console.log(`[MULTI-TENANT-POOL] Pool cerrado para tenant: ${tenantId}`);
    }

    tenantPools.clear();
}

module.exports = {
    getTenantPool,
    queryWithTenant,
    transactionWithTenant,
    sharedPool,
    closeAllPools
};
