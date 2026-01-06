const { executeQuery } = require('../config/database');
const debugLog = require('../utils/debug-logger');

class ContentRecommendationService {

    /**
     * Obtiene recomendaciones contextuales para el estudiante
     */
    async getRecommendations(studentId, limit = 5) {
        // En una implementación real, esto usuaría filtrado colaborativo o basado en contenido.
        // Versión MVP: Basado en materias débiles (simulado) o recursos populares.

        try {
            // 1. Obtener perfil de aprendizaje (si existe)
            const profile = await executeQuery(`SELECT * FROM user_learning_profiles WHERE user_id = $1`, [studentId]);

            // 2. Estrategia Híbrida Simplificada
            // Si tiene áreas débiles, recomendar recursos de esas áreas de dificultad 'basica'
            let strategy = 'POPULAR';
            let subjectFilter = '';

            // TODO: Integrar con GradesService para áreas débiles reales
            // Por ahora simulamos que necesitan 'matematicas'
            subjectFilter = 'matematicas';

            let sql = `
                SELECT * FROM educational_resources 
                WHERE is_active = true
            `;
            const params = [];

            if (subjectFilter) {
                sql += ` AND subject = $1`;
                params.push(subjectFilter);
            }

            // Ordenar por rating y recent views
            sql += ` ORDER BY avg_rating DESC, view_count DESC LIMIT $${params.length + 1}`;
            params.push(limit);

            const resources = await executeQuery(sql, params);

            // Log de recomendación
            if (resources.length > 0) {
                await this.logRecommendation(studentId, 'CONTENT_BASED_MVP', resources.map(r => r.id));
            }

            return resources;

        } catch (error) {
            debugLog.error('RECOMMEND', 'Error getting recommendations', error);
            // Fallback a vacio para no romper UI
            return [];
        }
    }

    async logRecommendation(studentId, type, resourceIds) {
        const sql = `
            INSERT INTO recommendation_logs (user_id, recommendation_type, resources_recommended)
            VALUES ($1, $2, $3)
        `;
        // No bloqueante
        executeQuery(sql, [studentId, type, resourceIds]).catch(err => console.error('Error logging reco:', err));
    }
}

module.exports = new ContentRecommendationService();
