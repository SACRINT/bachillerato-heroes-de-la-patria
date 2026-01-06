const { executeQuery } = require('../config/database');

class OfflineSyncService {

    /**
     * Procesa una cola de cambios subida por el cliente
     */
    async processSyncQueue(userId, changes) {
        const results = {
            processed: 0,
            failed: 0,
            details: []
        };

        for (const change of changes) {
            try {
                // Aquí iría un switch gigante o un mapa de handlers
                // para aplicar los cambios a las tablas reales
                // Por ahora simulamos el éxito
                await this._applyChange(userId, change);

                results.processed++;
                results.details.push({ id: change.localId, status: 'success' });
            } catch (error) {
                results.failed++;
                results.details.push({ id: change.localId, status: 'error', message: error.message });
                console.error('Sync Error:', error);
            }
        }
        return results;
    }

    /**
     * Lógica interna para aplicar un cambio específico
     */
    async _applyChange(userId, change) {
        const { entity, operation, data } = change;

        if (entity === 'micro_progress' && operation === 'UPDATE') {
            // Ejemplo concreto: Actualizar progreso offline
            await executeQuery(`
                INSERT INTO micro_lesson_progress (user_id, lesson_id, status, progress_percent, last_accessed_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, lesson_id) 
                DO UPDATE SET status = EXCLUDED.status, progress_percent = EXCLUDED.progress_percent, last_accessed_at = NOW()
            `, [userId, data.lessonId, data.status, data.progress]);
        }
        // ... Logica para otras entidades
    }

    /**
     * Devuelve las versiones actuales de datos estáticos
     * Para que el cliente sepa si debe re-descargar catálogos
     */
    async getDataVersions() {
        return await executeQuery('SELECT entity_name, version FROM data_versions');
    }
}

module.exports = new OfflineSyncService();
