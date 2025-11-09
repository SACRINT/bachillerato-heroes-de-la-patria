const { pool } = require('../config/database');
const { logAction } = require('../utils/logger');

/**
 * Elimina registros de una tabla que tienen más de 24 horas.
 * La tabla debe tener una columna 'created_at'.
 * @param {string} tableName - El nombre de la tabla a limpiar.
 */
async function cleanupTable(tableName) {
    const query = `
        DELETE FROM ${tableName}
        WHERE created_at < NOW() - INTERVAL '24 hours';
    `;
    try {
        const { rowCount } = await pool.query(query);
        if (rowCount > 0) {
            const message = `Limpieza automática: ${rowCount} registro(s) eliminado(s) de la tabla '${tableName}'.`;
            console.log(message);
            await logAction('auto_cleanup', { table: tableName, count: rowCount, status: 'success' });
        }
        return { table: tableName, cleaned: rowCount };
    } catch (error) {
        const errorMessage = `Error durante la limpieza de la tabla '${tableName}': ${error.message}`;
        console.error(errorMessage);
        await logAction('auto_cleanup_error', { table: tableName, error: error.message, status: 'error' });
        // Lanzar el error para que Promise.all lo capture si es necesario
        throw error;
    }
}

/**
 * Ejecuta todas las tareas de limpieza de la base de datos en paralelo.
 */
async function runAllCleanups() {
    console.log('Iniciando todas las tareas de limpieza de la base de datos...');
    try {
        const results = await Promise.all([
            cleanupTable('pending_inscriptions'),
            cleanupTable('pending_registrations')
        ]);
        console.log('Todas las tareas de limpieza de la base de datos han finalizado.');
        await logAction('run_all_cleanups', { status: 'success', results });
        return results;
    } catch (error) {
        console.error('Una o más tareas de limpieza fallaron:', error);
        await logAction('run_all_cleanups_error', { status: 'error', error: error.message });
        // El proceso puede continuar aunque la limpieza falle, así que no relanzamos el error.
    }
}

/**
 * Inicia el servicio de limpieza automática
 * Ejecuta tareas de limpieza cada N horas
 * @param {number} intervalHours - Intervalo en horas para ejecutar la limpieza
 */
function startCleanupService(intervalHours = 12) {
    const intervalMs = intervalHours * 60 * 60 * 1000; // Convertir horas a milisegundos
    console.log(`[CLEANUP] Servicio de limpieza iniciado. Se ejecutará cada ${intervalHours} horas.`);

    // Ejecutar inmediatamente
    runAllCleanups();

    // Luego ejecutar periódicamente
    setInterval(runAllCleanups, intervalMs);
}

module.exports = {
    cleanupTable,
    runAllCleanups,
    startCleanupService,
};
