/**
 * 🤖 AI TUTOR SERVICE
 * Servicio de tutoría IA personalizada
 * FASE 3 - Semana 17-18
 */

const { executeQuery } = require('../data/database-access.js');
const { getRealAIService } = require('./realAIService.js');

class AITutorService {
    constructor() {
        this.aiService = getRealAIService();
        // Niveles de XP del tutor
        this.tutorLevels = [
            { level: 1, xp: 0, title: 'Aprendiz' },
            { level: 2, xp: 100, title: 'Estudiante' },
            { level: 3, xp: 300, title: 'Aplicado' },
            { level: 4, xp: 600, title: 'Dedicado' },
            { level: 5, xp: 1000, title: 'Avanzado' },
            { level: 6, xp: 1500, title: 'Experto' },
            { level: 7, xp: 2500, title: 'Maestro' },
            { level: 8, xp: 4000, title: 'Sabio' },
            { level: 9, xp: 6000, title: 'Iluminado' },
            { level: 10, xp: 10000, title: 'Legendario' }
        ];

        // Materias BGE
        this.subjects = [
            'Matemáticas', 'Física', 'Química', 'Biología',
            'Historia', 'Geografía', 'Literatura', 'Filosofía',
            'Inglés', 'Informática', 'Economía', 'Ética'
        ];
    }

    // =====================================
    // PERFILES DE APRENDIZAJE
    // =====================================

    /**
     * Obtiene o crea perfil de aprendizaje
     */
    async getOrCreateProfile(userId) {
        const query = `
            INSERT INTO tutor_learning_profiles (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
            RETURNING *
        `;

        const results = await executeQuery(query, [userId]);
        return results[0];
    }

    /**
     * Obtiene perfil con estadísticas completas
     */
    async getProfileWithStats(userId) {
        const profile = await this.getOrCreateProfile(userId);

        // Obtener estadísticas adicionales
        const statsQuery = `
            SELECT
                COUNT(*) as total_sessions,
                COALESCE(AVG(quiz_score), 0) as avg_score,
                COALESCE(SUM(actual_duration), 0) as total_minutes,
                COALESCE(SUM(xp_earned), 0) as total_xp
            FROM tutor_sessions
            WHERE user_id = $1 AND status = 'completed'
        `;

        const stats = await executeQuery(statsQuery, [userId]);

        // Obtener conceptos dominados
        const masteryQuery = `
            SELECT subject, COUNT(*) as concepts, AVG(mastery_level) as avg_mastery
            FROM tutor_concept_mastery
            WHERE user_id = $1 AND mastery_level >= 0.7
            GROUP BY subject
        `;

        const mastery = await executeQuery(masteryQuery, [userId]);

        return {
            ...profile,
            stats: stats[0],
            mastery_by_subject: mastery,
            level_info: this.calculateLevel(profile.tutor_xp)
        };
    }

    /**
     * Actualiza perfil de aprendizaje
     */
    async updateProfile(userId, profileData) {
        const allowedFields = [
            'learning_style', 'preferred_difficulty', 'preferred_session_length',
            'preferred_time_of_day', 'learning_goals', 'weekly_target_hours'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(profileData)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (allowedFields.includes(snakeKey)) {
                fields.push(`${snakeKey} = $${paramIndex++}`);
                values.push(typeof value === 'object' ? JSON.stringify(value) : value);
            }
        }

        if (fields.length === 0) return null;

        values.push(userId);
        const query = `
            UPDATE tutor_learning_profiles
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE user_id = $${paramIndex}
            RETURNING *
        `;

        const results = await executeQuery(query, values);
        return results[0];
    }

    /**
     * Actualiza proficiencia por materia
     */
    async updateSubjectProficiency(userId, subject, score) {
        // Obtener proficiencia actual
        const profileQuery = `SELECT subject_proficiency FROM tutor_learning_profiles WHERE user_id = $1`;
        const profile = await executeQuery(profileQuery, [userId]);

        if (profile.length === 0) return;

        const proficiency = profile[0].subject_proficiency || {};
        const currentScore = proficiency[subject] || 0.5;

        // Weighted average con nuevo score
        proficiency[subject] = Math.min(1, Math.max(0, currentScore * 0.7 + score * 0.3));

        await executeQuery(
            `UPDATE tutor_learning_profiles SET subject_proficiency = $1 WHERE user_id = $2`,
            [JSON.stringify(proficiency), userId]
        );

        return proficiency[subject];
    }

    /**
     * Calcula nivel del tutor
     */
    calculateLevel(xp) {
        let level = this.tutorLevels[0];
        for (const l of this.tutorLevels) {
            if (xp >= l.xp) level = l;
        }

        const nextLevel = this.tutorLevels.find(l => l.xp > xp);
        const progress = nextLevel
            ? ((xp - level.xp) / (nextLevel.xp - level.xp)) * 100
            : 100;

        return {
            ...level,
            xp,
            progress: Math.round(progress),
            nextLevel: nextLevel || null
        };
    }

    // =====================================
    // SESIONES DE TUTORÍA
    // =====================================

    /**
     * Inicia una sesión de tutoría
     */
    async startSession(userId, sessionData) {
        const {
            subject,
            topic,
            subtopic,
            sessionType = 'lesson',
            difficultyLevel,
            targetDuration = 15
        } = sessionData;

        // Determinar dificultad adaptativa si no se especifica
        let difficulty = difficultyLevel;
        if (!difficulty || difficulty === 'adaptive') {
            difficulty = await this.calculateAdaptiveDifficulty(userId, subject);
        }

        const query = `
            INSERT INTO tutor_sessions (
                user_id, subject, topic, subtopic, session_type,
                difficulty_level, target_duration
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const results = await executeQuery(query, [
            userId, subject, topic, subtopic, sessionType, difficulty, targetDuration
        ]);

        return results[0];
    }

    /**
     * Agrega mensaje a la sesión
     */
    async addMessage(sessionId, role, content) {
        const query = `
            UPDATE tutor_sessions
            SET messages = messages || $1::jsonb,
                message_count = message_count + 1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        const results = await executeQuery(query, [JSON.stringify([message]), sessionId]);
        return results[0];
    }

    /**
     * Finaliza una sesión
     */
    async endSession(sessionId, sessionResults = {}) {
        const {
            quizScore,
            understandingLevel,
            wasHelpful,
            feedbackText,
            aiProvider,
            aiModel,
            tokensUsed,
            iacoinsSpent
        } = sessionResults;

        // Obtener sesión actual
        const sessionQuery = `SELECT * FROM tutor_sessions WHERE id = $1`;
        const sessionResult = await executeQuery(sessionQuery, [sessionId]);
        if (sessionResult.length === 0) return null;

        const session = sessionResult[0];

        // Calcular duración y XP
        const startTime = new Date(session.started_at);
        const endTime = new Date();
        const actualDuration = Math.round((endTime - startTime) / 60000);

        // XP basado en duración y rendimiento
        let xpEarned = Math.min(actualDuration, 60); // 1 XP por minuto, max 60
        if (quizScore) {
            xpEarned += Math.round(quizScore / 10); // Bonus por quiz
        }

        // Coins basado en completar sesión
        const coinsEarned = actualDuration >= 10 ? 5 : 2;

        const updateQuery = `
            UPDATE tutor_sessions
            SET status = 'completed',
                actual_duration = $1,
                quiz_score = $2,
                understanding_level = $3,
                was_helpful = $4,
                feedback_text = $5,
                ai_provider = $6,
                ai_model = $7,
                tokens_used = $8,
                iacoins_spent = $9,
                xp_earned = $10,
                coins_earned = $11,
                ended_at = NOW()
            WHERE id = $12
            RETURNING *
        `;

        const results = await executeQuery(updateQuery, [
            actualDuration, quizScore, understandingLevel, wasHelpful, feedbackText,
            aiProvider, aiModel, tokensUsed, iacoinsSpent, xpEarned, coinsEarned, sessionId
        ]);

        // Actualizar perfil del usuario
        await this.updateProfileAfterSession(session.user_id, results[0]);

        return results[0];
    }

    /**
     * Actualiza perfil después de sesión
     */
    async updateProfileAfterSession(userId, session) {
        const query = `
            UPDATE tutor_learning_profiles
            SET total_sessions = total_sessions + 1,
                total_time_spent = total_time_spent + $1,
                tutor_xp = tutor_xp + $2,
                last_session_at = NOW(),
                current_streak = CASE
                    WHEN last_session_at::date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
                    WHEN last_session_at::date = CURRENT_DATE THEN current_streak
                    ELSE 1
                END,
                longest_streak = GREATEST(longest_streak, CASE
                    WHEN last_session_at::date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1
                    ELSE 1
                END),
                updated_at = NOW()
            WHERE user_id = $3
        `;

        await executeQuery(query, [session.actual_duration, session.xp_earned, userId]);

        // Actualizar proficiencia si hay quiz
        if (session.quiz_score) {
            await this.updateSubjectProficiency(userId, session.subject, session.quiz_score / 100);
        }
    }

    /**
     * Obtiene historial de sesiones
     */
    async getSessionHistory(userId, options = {}) {
        const { limit = 20, offset = 0, subject, status } = options;

        let query = `
            SELECT * FROM tutor_sessions
            WHERE user_id = $1
        `;

        const params = [userId];
        let paramIndex = 2;

        if (subject) {
            query += ` AND subject = $${paramIndex++}`;
            params.push(subject);
        }

        if (status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` ORDER BY started_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    async getSessionById(sessionId) {
        const query = `SELECT * FROM tutor_sessions WHERE id = $1`;
        const results = await executeQuery(query, [sessionId]);
        return results[0];
    }
    
    /**
     * Calcula dificultad adaptativa
     */
    async calculateAdaptiveDifficulty(userId, subject) {
        const query = `
            SELECT
                AVG(quiz_score) as avg_score,
                COUNT(*) as session_count
            FROM tutor_sessions
            WHERE user_id = $1 AND subject = $2 AND status = 'completed' AND quiz_score IS NOT NULL
        `;

        const results = await executeQuery(query, [userId, subject]);
        const stats = results[0];

        if (!stats.session_count || stats.session_count < 3) {
            return 'medium';
        }

        const avgScore = parseFloat(stats.avg_score);
        if (avgScore >= 85) return 'hard';
        if (avgScore >= 60) return 'medium';
        return 'easy';
    }

    // =====================================
    // RUTAS DE APRENDIZAJE
    // =====================================

    /**
     * Obtiene rutas de aprendizaje disponibles
     */
    async getLearningPaths(options = {}) {
        const { subject, difficulty, featured, limit = 20, offset = 0 } = options;

        let query = `SELECT * FROM tutor_learning_paths WHERE is_active = true`;
        const params = [];
        let paramIndex = 1;

        if (subject) {
            query += ` AND subject = $${paramIndex++}`;
            params.push(subject);
        }

        if (difficulty) {
            query += ` AND difficulty = $${paramIndex++}`;
            params.push(difficulty);
        }

        if (featured) {
            query += ` AND is_featured = true`;
        }

        query += ` ORDER BY is_featured DESC, created_at DESC`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtiene ruta por ID con progreso del usuario
     */
    async getPathById(pathId, userId = null) {
        const pathQuery = `SELECT * FROM tutor_learning_paths WHERE id = $1`;
        const pathResults = await executeQuery(pathQuery, [pathId]);

        if (pathResults.length === 0) return null;

        const path = pathResults[0];

        if (userId) {
            const progressQuery = `
                SELECT * FROM tutor_path_progress
                WHERE user_id = $1 AND path_id = $2
            `;
            const progressResults = await executeQuery(progressQuery, [userId, pathId]);
            path.user_progress = progressResults[0] || null;
        }

        return path;
    }

    /**
     * Inicia una ruta de aprendizaje
     */
    async startLearningPath(userId, pathId) {
        const query = `
            INSERT INTO tutor_path_progress (user_id, path_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, path_id) DO UPDATE SET
                status = 'in_progress',
                last_activity_at = NOW()
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, pathId]);
        return results[0];
    }

    /**
     * Actualiza progreso en ruta
     */
    async updatePathProgress(userId, pathId, progressData) {
        const { moduleIndex, topicIndex, quizScore, timeSpent } = progressData;

        // Obtener ruta para calcular porcentaje
        const pathQuery = `SELECT total_topics FROM tutor_learning_paths WHERE id = $1`;
        const pathResult = await executeQuery(pathQuery, [pathId]);
        if (pathResult.length === 0) return null;

        const totalTopics = pathResult[0].total_topics;

        // Obtener progreso actual
        const currentQuery = `
            SELECT * FROM tutor_path_progress
            WHERE user_id = $1 AND path_id = $2
        `;
        const currentResult = await executeQuery(currentQuery, [userId, pathId]);
        if (currentResult.length === 0) return null;

        const current = currentResult[0];
        let completedTopics = current.completed_topics || [];

        // Agregar topic completado
        const topicKey = `${moduleIndex}-${topicIndex}`;
        if (!completedTopics.includes(topicKey)) {
            completedTopics.push(topicKey);
        }

        // Calcular porcentaje
        const progressPercent = Math.round((completedTopics.length / totalTopics) * 100);

        // Determinar si completó
        const isCompleted = progressPercent >= 100;

        const updateQuery = `
            UPDATE tutor_path_progress
            SET current_module = $1,
                current_topic = $2,
                completed_topics = $3,
                progress_percent = $4,
                time_spent = time_spent + $5,
                sessions_completed = sessions_completed + 1,
                status = $6,
                completed_at = $7,
                last_activity_at = NOW()
            WHERE user_id = $8 AND path_id = $9
            RETURNING *
        `;

        const results = await executeQuery(updateQuery, [
            moduleIndex,
            topicIndex,
            JSON.stringify(completedTopics),
            progressPercent,
            timeSpent || 0,
            isCompleted ? 'completed' : 'in_progress',
            isCompleted ? new Date() : null,
            userId,
            pathId
        ]);

        return results[0];
    }

    /**
     * Obtiene rutas en progreso del usuario
     */
    async getUserPaths(userId) {
        const query = `
            SELECT
                p.*,
                lp.title,
                lp.subject,
                lp.estimated_hours
            FROM tutor_path_progress p
            JOIN tutor_learning_paths lp ON p.path_id = lp.id
            WHERE p.user_id = $1
            ORDER BY p.last_activity_at DESC
        `;

        return executeQuery(query, [userId]);
    }

    // =====================================
    // RECOMENDACIONES
    // =====================================

    /**
     * Genera recomendaciones para el usuario
     */
    async generateRecommendations(userId) {
        const profile = await this.getProfileWithStats(userId);
        const recommendations = [];

        // 1. Recomendación basada en debilidades
        const proficiency = profile.subject_proficiency || {};
        for (const [subject, level] of Object.entries(proficiency)) {
            if (level < 0.5) {
                recommendations.push({
                    type: 'topic',
                    title: `Refuerzo en ${subject}`,
                    description: `Tu nivel en ${subject} necesita práctica adicional`,
                    reason: `Proficiencia actual: ${Math.round(level * 100)}%`,
                    priority: 80,
                    confidence: 0.9
                });
            }
        }

        // 2. Recomendación de rutas no iniciadas
        const pathsQuery = `
            SELECT * FROM tutor_learning_paths
            WHERE is_active = true
            AND id NOT IN (SELECT path_id FROM tutor_path_progress WHERE user_id = $1)
            ORDER BY is_featured DESC
            LIMIT 3
        `;
        const paths = await executeQuery(pathsQuery, [userId]);

        for (const path of paths) {
            recommendations.push({
                type: 'path',
                title: path.title,
                description: path.description,
                reason: 'Ruta de aprendizaje recomendada',
                reference_type: 'learning_path',
                reference_id: path.id,
                priority: 60,
                confidence: 0.7
            });
        }

        // 3. Recomendación de repaso (spaced repetition)
        const reviewQuery = `
            SELECT subject, concept, mastery_level
            FROM tutor_concept_mastery
            WHERE user_id = $1 AND next_review_at <= NOW()
            ORDER BY mastery_level ASC
            LIMIT 5
        `;
        const toReview = await executeQuery(reviewQuery, [userId]);

        for (const item of toReview) {
            recommendations.push({
                type: 'review',
                title: `Repasar: ${item.concept}`,
                description: `Es hora de repasar este concepto de ${item.subject}`,
                reason: 'Repaso espaciado para retención a largo plazo',
                priority: 70,
                confidence: 0.85
            });
        }

        // Guardar recomendaciones
        for (const rec of recommendations) {
            await this.saveRecommendation(userId, rec);
        }

        return recommendations;
    }

    /**
     * Guarda una recomendación
     */
    async saveRecommendation(userId, recommendation) {
        const query = `
            INSERT INTO tutor_recommendations (
                user_id, recommendation_type, title, description, reason,
                reference_type, reference_id, priority, confidence_score,
                expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() + INTERVAL '7 days')
            RETURNING *
        `;

        return executeQuery(query, [
            userId,
            recommendation.type,
            recommendation.title,
            recommendation.description,
            recommendation.reason,
            recommendation.reference_type,
            recommendation.reference_id,
            recommendation.priority,
            recommendation.confidence
        ]);
    }

    /**
     * Obtiene recomendaciones activas
     */
    async getActiveRecommendations(userId, limit = 10) {
        const query = `
            SELECT * FROM tutor_recommendations
            WHERE user_id = $1
            AND is_dismissed = false
            AND (expires_at IS NULL OR expires_at > NOW())
            ORDER BY priority DESC, created_at DESC
            LIMIT $2
        `;

        return executeQuery(query, [userId, limit]);
    }

    /**
     * Marca recomendación como vista/aceptada/descartada
     */
    async updateRecommendationStatus(userId, recommendationId, status) {
        let updateField = '';
        switch (status) {
            case 'viewed':
                updateField = 'is_viewed = true, viewed_at = NOW()';
                break;
            case 'accepted':
                updateField = 'is_accepted = true, acted_at = NOW()';
                break;
            case 'dismissed':
                updateField = 'is_dismissed = true';
                break;
            default:
                return null;
        }

        const query = `
            UPDATE tutor_recommendations
            SET ${updateField}
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;

        const results = await executeQuery(query, [recommendationId, userId]);
        return results[0];
    }

    // =====================================
    // DOMINIO DE CONCEPTOS
    // =====================================

    /**
     * Actualiza dominio de concepto
     */
    async updateConceptMastery(userId, subject, concept, isCorrect) {
        // Obtener o crear registro
        const existingQuery = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND subject = $2 AND concept = $3
        `;
        const existing = await executeQuery(existingQuery, [userId, subject, concept]);

        if (existing.length > 0) {
            const current = existing[0];
            const newMastery = this.calculateNewMastery(current.mastery_level, isCorrect);
            const newInterval = this.calculateReviewInterval(newMastery, current.review_interval, isCorrect);

            const updateQuery = `
                UPDATE tutor_concept_mastery
                SET mastery_level = $1,
                    confidence = confidence * 0.9 + $2 * 0.1,
                    times_practiced = times_practiced + 1,
                    times_correct = times_correct + $3,
                    last_practiced_at = NOW(),
                    next_review_at = NOW() + INTERVAL '${newInterval} days',
                    review_interval = $4,
                    updated_at = NOW()
                WHERE user_id = $5 AND subject = $6 AND concept = $7
                RETURNING *
            `;

            return executeQuery(updateQuery, [
                newMastery,
                isCorrect ? 1 : 0,
                isCorrect ? 1 : 0,
                newInterval,
                userId, subject, concept
            ]);
        } else {
            // Crear nuevo registro
            const insertQuery = `
                INSERT INTO tutor_concept_mastery (
                    user_id, subject, concept, mastery_level, confidence,
                    times_practiced, times_correct, last_practiced_at,
                    next_review_at, review_interval
                ) VALUES (
                    $1, $2, $3, $4, $5, 1, $6, NOW(),
                    NOW() + INTERVAL '1 day', 1
                )
                RETURNING *
            `;

            return executeQuery(insertQuery, [
                userId, subject, concept,
                isCorrect ? 0.3 : 0.1,
                isCorrect ? 0.5 : 0.3,
                isCorrect ? 1 : 0
            ]);
        }
    }

    /**
     * Calcula nuevo nivel de dominio
     */
    calculateNewMastery(currentMastery, isCorrect) {
        if (isCorrect) {
            return Math.min(1, currentMastery + (1 - currentMastery) * 0.2);
        } else {
            return Math.max(0, currentMastery - currentMastery * 0.3);
        }
    }

    /**
     * Calcula intervalo de repaso (spaced repetition)
     */
    calculateReviewInterval(mastery, currentInterval, isCorrect) {
        if (isCorrect) {
            if (mastery >= 0.9) return Math.min(30, currentInterval * 2.5);
            if (mastery >= 0.7) return Math.min(21, currentInterval * 2);
            return Math.min(14, currentInterval * 1.5);
        } else {
            return 1; // Reset a 1 día si falla
        }
    }

    /**
     * Obtiene conceptos para repasar
     */
    async getConceptsToReview(userId, limit = 10) {
        const query = `
            SELECT * FROM tutor_concept_mastery
            WHERE user_id = $1 AND next_review_at <= NOW()
            ORDER BY mastery_level ASC, next_review_at ASC
            LIMIT $2
        `;

        return executeQuery(query, [userId, limit]);
    }

    // =====================================
    // ESTADÍSTICAS Y ANÁLISIS
    // =====================================

    /**
     * Obtiene estadísticas detalladas del usuario
     */
    async getDetailedStats(userId) {
        const profile = await this.getProfileWithStats(userId);

        // Sesiones por semana (últimas 4 semanas)
        const weeklyQuery = `
            SELECT
                DATE_TRUNC('week', started_at) as week,
                COUNT(*) as sessions,
                SUM(actual_duration) as minutes,
                AVG(quiz_score) as avg_score
            FROM tutor_sessions
            WHERE user_id = $1 AND started_at > NOW() - INTERVAL '4 weeks'
            GROUP BY week
            ORDER BY week DESC
        `;
        const weekly = await executeQuery(weeklyQuery, [userId]);

        // Mejor materia
        const bestSubjectQuery = `
            SELECT subject, AVG(quiz_score) as avg_score, COUNT(*) as sessions
            FROM tutor_sessions
            WHERE user_id = $1 AND quiz_score IS NOT NULL
            GROUP BY subject
            ORDER BY avg_score DESC
            LIMIT 1
        `;
        const bestSubject = await executeQuery(bestSubjectQuery, [userId]);

        // Conceptos dominados
        const masteredQuery = `
            SELECT COUNT(*) as count
            FROM tutor_concept_mastery
            WHERE user_id = $1 AND mastery_level >= 0.8
        `;
        const mastered = await executeQuery(masteredQuery, [userId]);

        return {
            profile,
            weekly_activity: weekly,
            best_subject: bestSubject[0],
            mastered_concepts: parseInt(mastered[0]?.count || 0)
        };
    }
}

module.exports = new AITutorService();
