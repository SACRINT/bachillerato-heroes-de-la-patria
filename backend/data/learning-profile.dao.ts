/**
 * 🧠 LEARNING PROFILE DAO - TypeScript
 * Gestión de perfiles de aprendizaje y dominio de conocimientos
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface LearningProfile {
    user_id: number;
    // Add other fields as they appear in database schema, seemingly dynamic updates
    total_sessions?: number;
    total_time_spent?: number;
    tutor_xp?: number;
    last_session_at?: Date;
    created_at?: Date;
    updated_at?: Date;
    [key: string]: any;
}

export interface LearningStats {
    duration: number;
    xp: number;
}

export interface CreateConceptMasteryInput {
    user_id: number;
    subject: string;
    concept: string;
    mastery_level: number;
    confidence: number;
    times_practiced?: number;
    times_correct?: number;
    next_review_at: Date;
    review_interval: number;
}

export interface ConceptMastery extends CreateConceptMasteryInput {
    last_practiced_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface MasterySummary {
    subject: string;
    concepts: number;
    avg_mastery: number;
}

export interface CreateRecommendationInput {
    user_id: number;
    type: string; // recommendation_type
    title: string;
    description: string;
    reason: string;
    reference_type: string;
    reference_id: number | string;
    priority: number;
    confidence: number;
}

export interface Recommendation extends CreateRecommendationInput {
    id: number;
    is_dismissed: boolean;
    expires_at: Date;
    created_at: Date;
}

// =====================================================
// LEARNING PROFILE DAO CLASS
// =====================================================

class LearningProfileDAO {

    /**
     * Obtener o crear perfil
     */
    static async getOrCreate(userId: number): Promise<LearningProfile> {
        const insertQuery = `
            INSERT INTO tutor_learning_profiles (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
            RETURNING *
        `;
        const result = await executeQuery(insertQuery, [userId]);
        return result[0];
    }

    /**
     * Actualizar perfil
     */
    static async update(userId: number, data: Partial<LearningProfile>): Promise<LearningProfile | null> {
        const keys = Object.keys(data).filter(k => k !== 'user_id' && k !== 'created_at');
        if (keys.length === 0) return null;

        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = keys.map(key => typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]);

        const query = `
            UPDATE tutor_learning_profiles
            SET ${setClause}, updated_at = NOW()
            WHERE user_id = $1
            RETURNING *
        `;

        const result = await executeQuery(query, [userId, ...values]);
        return result[0];
    }

    /**
     * Actualizar estadísticas acumuladas del perfil
     */
    static async updateStats(userId: number, stats: LearningStats): Promise<LearningProfile> {
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

        const result = await executeQuery(query, [stats.duration, stats.xp, userId]);
        return result[0];
    }

    // ==========================================
    // DOMINIO DE CONCEPTOS
    // ==========================================

    static async getConceptMastery(userId: number, subject: string, concept: string): Promise<ConceptMastery | undefined> {
        const query = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND subject = $2 AND concept = $3
        `;
        const result = await executeQuery(query, [userId, subject, concept]);
        return result[0];
    }

    static async upsertConceptMastery(data: CreateConceptMasteryInput): Promise<ConceptMastery> {
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

        const result = await executeQuery(query, params);
        return result[0];
    }

    static async getConceptsToReview(userId: number, limit: number = 10): Promise<ConceptMastery[]> {
        const query = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND next_review_at <= NOW()
            ORDER BY mastery_level ASC, next_review_at ASC
            LIMIT $2
        `;
        const result = await executeQuery(query, [userId, limit]);
        return result;
    }

    static async getMasteryBySubject(userId: number): Promise<MasterySummary[]> {
        const query = `
            SELECT subject, COUNT(*) as concepts, AVG(mastery_level) as avg_mastery
            FROM tutor_concept_mastery
            WHERE user_id = $1 AND mastery_level >= 0.7
            GROUP BY subject
        `;
        const result = await executeQuery(query, [userId]);
        return result.map((row: any) => ({
            subject: row.subject,
            concepts: parseInt(row.concepts),
            avg_mastery: parseFloat(row.avg_mastery)
        }));
    }

    // ==========================================
    // RECOMENDACIONES
    // ==========================================

    static async createRecommendation(data: CreateRecommendationInput): Promise<Recommendation> {
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
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async getActiveRecommendations(userId: number, limit: number = 10): Promise<Recommendation[]> {
        const query = `
            SELECT * FROM tutor_recommendations
            WHERE user_id = $1
            AND is_dismissed = false
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY priority DESC, created_at DESC
            LIMIT $2
        `;
        const result = await executeQuery(query, [userId, limit]);
        return result;
    }
}

export default LearningProfileDAO;
module.exports = LearningProfileDAO;
