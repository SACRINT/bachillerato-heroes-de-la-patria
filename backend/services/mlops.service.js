const { pool } = require('../config/database');
const devLogger = require('../utils/devLogger');

class MLOpsService {

    /**
     * Registrar un nuevo modelo en el registry
     */
    async registerModel(name, description, framework) {
        const query = `
            INSERT INTO ai_model_registry (model_name, description, framework)
            VALUES ($1, $2, $3)
            ON CONFLICT (model_name) DO UPDATE SET
                description = $2,
                framework = $3
            RETURNING *
        `;
        const res = await pool.query(query, [name, description, framework]);
        return res.rows[0];
    }

    /**
     * Crear una nueva versión de un modelo
     */
    async createVersion(modelName, version, config, metrics, userId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Obtener ID del modelo
            const modelRes = await client.query('SELECT id FROM ai_model_registry WHERE model_name = $1', [modelName]);
            if (modelRes.rows.length === 0) throw new Error(`Modelo '${modelName}' no encontrado`);
            const modelId = modelRes.rows[0].id;

            // 2. Insertar versión
            const insertQuery = `
                INSERT INTO ai_model_versions (model_id, version, status, config_json, accuracy, f1_score, created_by)
                VALUES ($1, $2, 'training', $3, $4, $5, $6)
                RETURNING *
            `;
            const versionRes = await client.query(insertQuery, [
                modelId, version, config || {}, metrics.accuracy, metrics.f1_score, userId
            ]);

            await client.query('COMMIT');
            return versionRes.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar estado de una versión (ej: promote to production)
     */
    async updateVersionStatus(modelName, version, newStatus) {
        // Validar status
        const validStatuses = ['training', 'staging', 'production', 'archived'];
        if (!validStatuses.includes(newStatus)) throw new Error('Estado inválido');

        // Si es production, archivar la versión anterior de production automáticamente?
        // Por simplicidad, solo actualizamos este.

        const query = `
            UPDATE ai_model_versions
            SET status = $3
            FROM ai_model_registry
            WHERE ai_model_versions.model_id = ai_model_registry.id
              AND ai_model_registry.model_name = $1
              AND ai_model_versions.version = $2
            RETURNING *
        `;
        const res = await pool.query(query, [modelName, version, newStatus]);
        return res.rows[0];
    }

    /**
     * Registrar métricas de producción (Drift)
     */
    async logProductionMetrics(modelName, metrics) {
        const { latency, errorRate, driftScore } = metrics;

        // Buscar la versión activa en producción para este modelo
        const verRes = await pool.query(`
            SELECT v.id 
            FROM ai_model_versions v
            JOIN ai_model_registry r ON v.model_id = r.id
            WHERE r.model_name = $1 AND v.status = 'production'
            ORDER BY v.created_at DESC LIMIT 1
        `, [modelName]);

        if (verRes.rows.length === 0) return null; // No hay versión en prod
        const versionId = verRes.rows[0].id;

        const insert = `
            INSERT INTO ai_production_metrics (version_id, avg_latency_ms, error_rate, feature_drift_score, concept_drift_detected)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const driftDetected = driftScore > 0.3; // Threshold ejemplo
        const res = await pool.query(insert, [versionId, latency, errorRate, driftScore, driftDetected]);

        if (driftDetected) {
            devLogger.warn(`[MLOps] ⚠️ DRIFT DETECTED for ${modelName} (Score: ${driftScore})`);
            // Aquí se dispararía alerta o retraining automático
        }

        return res.rows[0];
    }

    /**
     * Obtener dashboard de modelos
     */
    async getModelDashboard() {
        // Query complejo para traer modelos con su versión actual de prod y métricas recientes
        const query = `
            SELECT r.model_name, r.framework,
                   v.version as prod_version, v.accuracy as prod_accuracy, v.created_at as deployed_at,
                   (SELECT AVG(avg_latency_ms) FROM ai_production_metrics pm WHERE pm.version_id = v.id) as avg_latency
            FROM ai_model_registry r
            LEFT JOIN ai_model_versions v ON r.id = v.model_id AND v.status = 'production'
            ORDER BY r.model_name
        `;
        const res = await pool.query(query);
        return res.rows;
    }
}

module.exports = new MLOpsService();
