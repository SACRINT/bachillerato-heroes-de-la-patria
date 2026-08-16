/**
 * 🗑️ SOFT DELETE HELPERS
 * Funciones de utilidad para implementar soft deletes en el DAL
 * Fecha: 16 Noviembre 2025
 */

const { pool } = require('../config/database.js');

/**
 * Soft delete de un registro
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se eliminó, false si no existe
 */
async function softDelete(tableName, id) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE ${tableName}
             SET deleted_at = NOW()
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id]
        );

        return result.rowCount > 0;
    } catch (error) {
        console.error(`[SOFT-DELETE] Error en ${tableName}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Restaurar un registro eliminado
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se restauró, false si no existe
 */
async function restoreDeleted(tableName, id) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE ${tableName}
             SET deleted_at = NULL
             WHERE id = $1 AND deleted_at IS NOT NULL
             RETURNING id`,
            [id]
        );

        return result.rowCount > 0;
    } catch (error) {
        console.error(`[SOFT-DELETE] Error restaurando ${tableName}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Hard delete (eliminación permanente) - USAR CON CUIDADO
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se eliminó, false si no existe
 */
async function hardDelete(tableName, id) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `DELETE FROM ${tableName}
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        console.warn(`[HARD-DELETE] Eliminación permanente en ${tableName}, id:`, id);
        return result.rowCount > 0;
    } catch (error) {
        console.error(`[HARD-DELETE] Error en ${tableName}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener registros eliminados de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {number} limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} - Array de registros eliminados
 */
async function getDeletedRecords(tableName, limit = 100) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT *
             FROM ${tableName}
             WHERE deleted_at IS NOT NULL
             ORDER BY deleted_at DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows;
    } catch (error) {
        console.error(`[SOFT-DELETE] Error obteniendo eliminados de ${tableName}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Eliminar permanentemente registros eliminados hace más de X días
 * @param {string} tableName - Nombre de la tabla
 * @param {number} daysOld - Días desde eliminación (default: 30)
 * @returns {Promise<number>} - Cantidad de registros eliminados permanentemente
 */
async function purgeOldDeleted(tableName, daysOld = 30) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `DELETE FROM ${tableName}
             WHERE deleted_at IS NOT NULL
             AND deleted_at < NOW() - INTERVAL '${daysOld} days'
             RETURNING id`,
            []
        );

        const count = result.rowCount;
        console.warn(`[PURGE] Eliminados permanentemente ${count} registros de ${tableName} (>${daysOld} días)`);
        return count;
    } catch (error) {
        console.error(`[PURGE] Error en ${tableName}:`, error.message);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Agregar filtro WHERE deleted_at IS NULL a una query
 * @param {string} baseQuery - Query base
 * @param {boolean} includeDeleted - Si true, no filtra eliminados (default: false)
 * @returns {string} - Query con filtro agregado
 */
function addSoftDeleteFilter(baseQuery, includeDeleted = false) {
    if (includeDeleted) {
        return baseQuery;
    }

    // Detectar si ya tiene WHERE clause
    const hasWhere = /\bWHERE\b/i.test(baseQuery);

    if (hasWhere) {
        // Agregar AND deleted_at IS NULL
        return baseQuery.replace(/\bWHERE\b/i, 'WHERE deleted_at IS NULL AND');
    } else {
        // Agregar WHERE deleted_at IS NULL antes de ORDER BY, GROUP BY, LIMIT
        const insertPoint = baseQuery.search(/\b(ORDER BY|GROUP BY|LIMIT|OFFSET)\b/i);

        if (insertPoint > -1) {
            return baseQuery.slice(0, insertPoint) + ' WHERE deleted_at IS NULL ' + baseQuery.slice(insertPoint);
        } else {
            return baseQuery + ' WHERE deleted_at IS NULL';
        }
    }
}

module.exports = {
    softDelete,
    restoreDeleted,
    hardDelete,
    getDeletedRecords,
    purgeOldDeleted,
    addSoftDeleteFilter
};
