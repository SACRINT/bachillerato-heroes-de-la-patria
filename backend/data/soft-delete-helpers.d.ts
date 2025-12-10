/**
 * Soft delete de un registro
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se eliminó, false si no existe
 */
export function softDelete(tableName: string, id: number): Promise<boolean>;
/**
 * Restaurar un registro eliminado
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se restauró, false si no existe
 */
export function restoreDeleted(tableName: string, id: number): Promise<boolean>;
/**
 * Hard delete (eliminación permanente) - USAR CON CUIDADO
 * @param {string} tableName - Nombre de la tabla
 * @param {number} id - ID del registro
 * @returns {Promise<boolean>} - true si se eliminó, false si no existe
 */
export function hardDelete(tableName: string, id: number): Promise<boolean>;
/**
 * Obtener registros eliminados de una tabla
 * @param {string} tableName - Nombre de la tabla
 * @param {number} limit - Límite de resultados (default: 100)
 * @returns {Promise<Array>} - Array de registros eliminados
 */
export function getDeletedRecords(tableName: string, limit?: number): Promise<any[]>;
/**
 * Eliminar permanentemente registros eliminados hace más de X días
 * @param {string} tableName - Nombre de la tabla
 * @param {number} daysOld - Días desde eliminación (default: 30)
 * @returns {Promise<number>} - Cantidad de registros eliminados permanentemente
 */
export function purgeOldDeleted(tableName: string, daysOld?: number): Promise<number>;
/**
 * Agregar filtro WHERE deleted_at IS NULL a una query
 * @param {string} baseQuery - Query base
 * @param {boolean} includeDeleted - Si true, no filtra eliminados (default: false)
 * @returns {string} - Query con filtro agregado
 */
export function addSoftDeleteFilter(baseQuery: string, includeDeleted?: boolean): string;
//# sourceMappingURL=soft-delete-helpers.d.ts.map