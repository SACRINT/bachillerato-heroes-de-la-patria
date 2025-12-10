"use strict";
/**
 * 🧠 LEARNING PROFILE DAO - TypeScript
 * Gestión de perfiles de aprendizaje y dominio de conocimientos
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// LEARNING PROFILE DAO CLASS
// =====================================================
class LearningProfileDAO {
    /**
     * Obtener o crear perfil
     */
    static async getOrCreate(userId) {
        const insertQuery = `
            INSERT INTO tutor_learning_profiles (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(insertQuery, [userId]);
        return result[0];
    }
    /**
     * Actualizar perfil
     */
    static async update(userId, data) {
        const keys = Object.keys(data).filter(k => k !== 'user_id' && k !== 'created_at');
        if (keys.length === 0)
            return null;
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = keys.map(key => typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);
        const query = `
            UPDATE tutor_learning_profiles
            SET ${setClause}, updated_at = NOW()
            WHERE user_id = $1
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, ...values]);
        return result[0];
    }
    /**
     * Actualizar estadísticas acumuladas del perfil
     */
    static async updateStats(userId, stats) {
        const query = `
            UPDATE tutor_learning_profiles
            SET total_sessions = total_sessions + 1,
                total_time_spent = total_time_spent + $1,
                tutor_xp = tutor_xp + $2,
                last_session_at = NOW(),
                updated_at = NOW()
            WHERE user_id = $3
            RETURNING *
        `;
        // Nota: La lógica de racha (streak) es compleja para SQL puro simple, 
        // se puede manejar en servicio o aquí con CASE complejos. 
        // Por simplicidad en DAO, actualizamos básicos.
        const result = await (0, database_1.executeQuery)(query, [stats.duration, stats.xp, userId]);
        return result[0];
    }
    // ==========================================
    // DOMINIO DE CONCEPTOS
    // ==========================================
    static async getConceptMastery(userId, subject, concept) {
        const query = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND subject = $2 AND concept = $3
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, subject, concept]);
        return result[0];
    }
    static async upsertConceptMastery(data) {
        const query = `
            INSERT INTO tutor_concept_mastery (
                user_id, subject, concept, mastery_level, confidence,
                times_practiced, times_correct, last_practiced_at,
                next_review_at, review_interval
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
            ON CONFLICT (user_id, subject, concept) DO UPDATE SET
                mastery_level = EXCLUDED.mastery_level,
                confidence = EXCLUDED.confidence,
                times_practiced = tutor_concept_mastery.times_practiced + 1,
                times_correct = tutor_concept_mastery.times_correct + EXCLUDED.times_correct,
                last_practiced_at = NOW(),
                next_review_at = EXCLUDED.next_review_at,
                review_interval = EXCLUDED.review_interval,
                updated_at = NOW()
            RETURNING *
        `;
        const params = [
            data.user_id, data.subject, data.concept,
            data.mastery_level, data.confidence,
            data.times_practiced || 1, data.times_correct || 0,
            data.next_review_at, data.review_interval
        ];
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    static async getConceptsToReview(userId, limit = 10) {
        const query = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND next_review_at <= NOW()
            ORDER BY mastery_level ASC, next_review_at ASC
            LIMIT $2
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, limit]);
        return result;
    }
    static async getMasteryBySubject(userId) {
        const query = `
            SELECT subject, COUNT(*) as concepts, AVG(mastery_level) as avg_mastery
            FROM tutor_concept_mastery
            WHERE user_id = $1 AND mastery_level >= 0.7
            GROUP BY subject
        `;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        return result.map((row) => ({
            subject: row.subject,
            concepts: parseInt(row.concepts),
            avg_mastery: parseFloat(row.avg_mastery)
        }));
    }
    // ==========================================
    // RECOMENDACIONES
    // ==========================================
    static async createRecommendation(data) {
        const query = `
            INSERT INTO tutor_recommendations (
                user_id, recommendation_type, title, description, reason,
                reference_type, reference_id, priority, confidence_score,
                expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '7 days')
            RETURNING *
        `;
        const params = [
            data.user_id, data.type, data.title, data.description, data.reason,
            data.reference_type, data.reference_id, data.priority, data.confidence
        ];
        const result = await (0, database_1.executeQuery)(query, params);
        return result[0];
    }
    static async getActiveRecommendations(userId, limit = 10) {
        const query = `
            SELECT * FROM tutor_recommendations
            WHERE user_id = $1
            AND is_dismissed = false
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY priority DESC, created_at DESC
            LIMIT $2
        `;
        const result = await (0, database_1.executeQuery)(query, [userId, limit]);
        return result;
    }
}
exports.default = LearningProfileDAO;
module.exports = LearningProfileDAO;
//# sourceMappingURL=learning-profile.dao.js.map