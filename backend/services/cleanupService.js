/**
 * Servicio de Limpieza Automática - v2.0.0
 * Refactorizado: 04 Diciembre 2025
 */

const AuditDAO = require('../data/audit.dao.js');
const { logAction } = require('../utils/logger.js');
const devLogger = require('../utils/devLogger.js');

async function cleanupTable(tableName) {
    try {
        const rowCount = await AuditDAO.cleanupTable(tableName);
        if (rowCount > 0) {
            devLogger.log(`Limpieza automática: ${rowCount} registro(s) eliminado(s) de '${tableName}'.`);
            await logAction('auto_cleanup', { table: tableName, count: rowCount, status: 'success' });
        }
        return { table: tableName, cleaned: rowCount };
    } catch (error) {
        devLogger.error(`Error durante la limpieza de '${tableName}': ${error.message}`);
        await logAction('auto_cleanup_error', { table: tableName, error: error.message, status: 'error' });
        throw error;
    }
}

async function runAllCleanups() {
    devLogger.log('Iniciando todas las tareas de limpieza de la base de datos...');
    try {
        const results = await Promise.all([cleanupTable('pending_inscriptions'), cleanupTable('pending_registrations')]);
        devLogger.log('Todas las tareas de limpieza han finalizado.');
        await logAction('run_all_cleanups', { status: 'success', results });
        return results;
    } catch (error) { devLogger.error('Una o más tareas de limpieza fallaron:', error); await logAction('run_all_cleanups_error', { status: 'error', error: error.message }); }
}

function startCleanupService(intervalHours = 12) {
    devLogger.log(`[CLEANUP] Servicio iniciado. Se ejecutará cada ${intervalHours} horas.`);
    runAllCleanups();
    setInterval(runAllCleanups, intervalHours * 3600000);
}

module.exports = { cleanupTable, runAllCleanups, startCleanupService };
