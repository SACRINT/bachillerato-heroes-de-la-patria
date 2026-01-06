const { executeQuery } = require('../config/database');

class ExperimentService {

    /**
     * Determina qué variante debe ver un usuario para un experimento dado.
     * Implementa 'Sticky Sessions' persistiendo la asignación en DB.
     * @param {string} targetModelName - Nombre del modelo objetivo (ej. 'dropout_prediction')
     * @param {number} userId - ID del usuario
     */
    async getVariantForUser(targetModelName, userId) {
        // 1. Buscar experimento activo para este modelo
        const experiments = await executeQuery(`
            SELECT id, name, status, start_date 
            FROM ai_experiments 
            WHERE target_model_name = $1 AND status = 'active'
            ORDER BY start_date DESC 
            LIMIT 1
        `, [targetModelName]);

        if (experiments.length === 0) {
            // No hay experimento activo, retornar null (usar default production)
            return null;
        }

        const experiment = experiments[0];

        // 2. Verificar si el usuario ya tiene asignación (Allocated)
        const allocations = await executeQuery(`
            SELECT v.id, v.name, v.model_version, v.is_shadow_mode, v.config
            FROM ai_experiment_allocations a
            JOIN ai_experiment_variants v ON a.variant_id = v.id
            WHERE a.experiment_id = $1 AND a.user_id = $2
        `, [experiment.id, userId]);

        if (allocations.length > 0) {
            return { ...allocations[0], experimentName: experiment.name };
        }

        // 3. Asignar nuevo usuario (Traffic Splitting)
        const variants = await executeQuery(`
            SELECT id, name, model_version, traffic_percentage, is_shadow_mode, config
            FROM ai_experiment_variants
            WHERE experiment_id = $1
            ORDER BY id ASC
        `, [experiment.id]);

        if (variants.length === 0) return null;

        // Algoritmo de asignación ponderada determinista simple (basado en Random para simplicidad ahora, o Hash)
        // Usar Hash sería mejor para stateless, pero como persistimos, Random ponderado está bien.
        const assignedVariant = this._weightedRandomSelect(variants);

        // 4. Persistir asignación
        if (assignedVariant) {
            await executeQuery(`
                INSERT INTO ai_experiment_allocations (experiment_id, user_id, variant_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (experiment_id, user_id) DO NOTHING
            `, [experiment.id, userId, assignedVariant.id]);

            return { ...assignedVariant, experimentName: experiment.name };
        }

        return null; // Fallback
    }

    /**
     * Registra una métrica de conversión/éxito para una variante
     */
    async trackResult(experimentId, variantId, metricName, value) {
        // En una implementación real, esto debería agregar a una tabla de eventos raw
        // Aquí simplificamos actualizando agregados o insertando en logs
        // Por ahora, solo logueamos para no llenar la DB en este prototipo
        console.log(`[Experiment] Tracking Metric: Exp=${experimentId}, Var=${variantId}, ${metricName}=${value}`);
        return true;
    }

    /**
     * Obtiene resultados del dashboard A/B
     */
    async getExperimentResults(experimentId) {
        // Consulta simulada de resultados agregados
        const variants = await executeQuery(`
            SELECT v.name, v.traffic_percentage, 
                   COUNT(a.id) as assigned_users
            FROM ai_experiment_variants v
            LEFT JOIN ai_experiment_allocations a ON v.id = a.variant_id
            WHERE v.experiment_id = $1
            GROUP BY v.id, v.name, v.traffic_percentage
        `, [experimentId]);

        return variants;
    }

    // Helper: selección ponderada
    _weightedRandomSelect(variants) {
        const totalWeight = variants.reduce((sum, v) => sum + v.traffic_percentage, 0);
        let random = Math.random() * totalWeight;

        for (const variant of variants) {
            if (random < variant.traffic_percentage) {
                return variant;
            }
            random -= variant.traffic_percentage;
        }
        return variants[0];
    }
}

module.exports = new ExperimentService();
