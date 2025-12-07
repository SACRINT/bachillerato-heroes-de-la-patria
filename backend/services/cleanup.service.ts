/**
 * 🧹 CLEANUP SERVICE - TypeScript Version
 * Servicio de Limpieza Automática
 * Refactorizado: 07 Diciembre 2025
 */

const AuditDAO = require('../data/audit.dao');
const { logAction } = require('../utils/logger');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export interface CleanupResult {
    table: string;
    cleaned: number;
}

export interface CleanupAction {
    table?: string;
    count?: number;
    status: 'success' | 'error';
    error?: string;
    results?: CleanupResult[];
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Limpiar registros antiguos de una tabla específica
 */
async function cleanupTable(tableName: string): Promise<CleanupResult> {
    try {
        const rowCount = await AuditDAO.cleanupTable(tableName);
        if (rowCount > 0) {
            devLogger.log(`Limpieza automática: ${rowCount} registro(s) eliminado(s) de '${tableName}'.`);
            await logAction('auto_cleanup', { table: tableName, count: rowCount, status: 'success' });
        }
        return { table: tableName, cleaned: rowCount };
    } catch (error: any) {
        devLogger.error(`Error durante la limpieza de '${tableName}': ${error.message}`);
        await logAction('auto_cleanup_error', { table: tableName, error: error.message, status: 'error' });
        throw error;
    }
}

/**
 * Ejecutar todas las tareas de limpieza
 */
async function runAllCleanups(): Promise<CleanupResult[] | undefined> {
    devLogger.log('Iniciando todas las tareas de limpieza de la base de datos...');
    try {
        const results = await Promise.all([
            cleanupTable('pending_inscriptions'),
            cleanupTable('pending_registrations')
        ]);
        devLogger.log('Todas las tareas de limpieza han finalizado.');
        await logAction('run_all_cleanups', { status: 'success', results });
        return results;
    } catch (error: any) {
        devLogger.error('Una o más tareas de limpieza fallaron:', error);
        await logAction('run_all_cleanups_error', { status: 'error', error: error.message });
        return undefined;
    }
}

/**
 * Iniciar servicio de limpieza automática
 */
function startCleanupService(intervalHours: number = 12): void {
    devLogger.log(`[CLEANUP] Servicio iniciado. Se ejecutará cada ${intervalHours} horas.`);
    runAllCleanups();
    setInterval(runAllCleanups, intervalHours * 3600000);
}

// ============================================
// EXPORTS
// ============================================

export {
    cleanupTable,
    runAllCleanups,
    startCleanupService
};

// CommonJS compatibility
module.exports = { cleanupTable, runAllCleanups, startCleanupService };
