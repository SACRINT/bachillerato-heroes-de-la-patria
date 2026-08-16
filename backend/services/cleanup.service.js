"use strict";
/**
 * 🧹 CLEANUP SERVICE - TypeScript Version
 * Servicio de Limpieza Automática
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTable = cleanupTable;
exports.runAllCleanups = runAllCleanups;
exports.startCleanupService = startCleanupService;
const AuditDAO = require('../data/audit.dao.js');
const { logAction } = require('../utils/logger.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// SERVICE FUNCTIONS
// ============================================
/**
 * Limpiar registros antiguos de una tabla específica
 */
async function cleanupTable(tableName) {
    try {
        const rowCount = await AuditDAO.cleanupTable(tableName);
        if (rowCount > 0) {
            devLogger.log(`Limpieza automática: ${rowCount} registro(s) eliminado(s) de '${tableName}'.`);
            await logAction('auto_cleanup', { table: tableName, count: rowCount, status: 'success' });
        }
        return { table: tableName, cleaned: rowCount };
    }
    catch (error) {
        devLogger.error(`Error durante la limpieza de '${tableName}': ${error.message}`);
        await logAction('auto_cleanup_error', { table: tableName, error: error.message, status: 'error' });
        throw error;
    }
}
/**
 * Ejecutar todas las tareas de limpieza
 */
async function runAllCleanups() {
    devLogger.log('Iniciando todas las tareas de limpieza de la base de datos...');
    try {
        const results = await Promise.all([
            cleanupTable('pending_inscriptions'),
            cleanupTable('pending_registrations')
        ]);
        devLogger.log('Todas las tareas de limpieza han finalizado.');
        await logAction('run_all_cleanups', { status: 'success', results });
        return results;
    }
    catch (error) {
        devLogger.error('Una o más tareas de limpieza fallaron:', error);
        await logAction('run_all_cleanups_error', { status: 'error', error: error.message });
        return undefined;
    }
}
/**
 * Iniciar servicio de limpieza automática
 */
function startCleanupService(intervalHours = 12) {
    devLogger.log(`[CLEANUP] Servicio iniciado. Se ejecutará cada ${intervalHours} horas.`);
    runAllCleanups();
    setInterval(runAllCleanups, intervalHours * 3600000);
}
// CommonJS compatibility
module.exports = { cleanupTable, runAllCleanups, startCleanupService };
//# sourceMappingURL=cleanup.service.js.map