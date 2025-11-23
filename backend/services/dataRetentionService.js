/**
 *  GDPR & Data Retention Service
 * Servicio para gestionar la retención y eliminación de datos según las políticas de GDPR.
 *
 * Tarea: Semana 27 - GDPR Compliance
 * Fecha: 23 Noviembre 2025
 */

const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class DataRetentionService {

    /**
     * Elimina los logs del sistema que son más antiguos que el período de retención especificado.
     * La política por defecto es de 90 días.
     */
    async cleanupSystemLogs() {
        const retentionDays = 90;
        devLogger.log(`[DataRetention] Ejecutando limpieza de logs del sistema más antiguos de ${retentionDays} días.`);

        try {
            const result = await pool.query(
                `DELETE FROM logs_sistema WHERE created_at < NOW() - INTERVAL '${retentionDays} days'`
            );

            if (result.rowCount > 0) {
                devLogger.log(`[DataRetention] Limpieza completada. Se eliminaron ${result.rowCount} registros de log antiguos.`);
            } else {
                devLogger.log(`[DataRetention] No se encontraron registros de log para eliminar.`);
            }

            return {
                success: true,
                deletedCount: result.rowCount
            };
        } catch (error) {
            devLogger.error(`[DataRetention] Error durante la limpieza de logs del sistema:`, error.message);
            // No relanzar el error para no detener otras tareas programadas
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Anonimiza datos de usuarios inactivos.
     * (Función de ejemplo para futuras implementaciones)
     */
    async anonymizeInactiveUsers() {
        const inactivePeriodDays = 365 * 2; // 2 años
        devLogger.log(`[DataRetention] Buscando usuarios inactivos por más de ${inactivePeriodDays} días para anonimizar.`);
        // Lógica de anonimización aquí...
        // UPDATE usuarios SET email = 'anon_' || id || '@example.com', nombre = 'Usuario Anonimizado', ...
        // WHERE last_login < NOW() - INTERVAL '...' AND status != 'anonimizado'
    }
}

// Exportar una única instancia del servicio (patrón Singleton)
module.exports = new DataRetentionService();
