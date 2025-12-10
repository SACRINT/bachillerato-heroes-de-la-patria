"use strict";
/**
 * 🤖 AI TUTOR SERVICE - TypeScript Version
 * Servicio de tutoría IA personalizada
 * FASE 3 - Semana 17-18
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITutorService = void 0;
const { executeQuery } = require('../data/database-access');
const { getRealAIService } = require('./realAIService');
const devLogger = require('../utils/devLogger');
// ============================================
// AI TUTOR SERVICE CLASS
// ============================================
class AITutorService {
    constructor() {
        this.aiService = getRealAIService();
        this.tutorLevels = [
            { level: 1, xp: 0, title: 'Aprendiz' },
            { level: 2, xp: 100, title: 'Estudiante' },
            { level: 3, xp: 300, title: 'Conocedor' },
            { level: 4, xp: 600, title: 'Experto' },
            { level: 5, xp: 1000, title: 'Maestro' },
            { level: 6, xp: 1500, title: 'Sabio' },
            { level: 7, xp: 2100, title: 'Gurú' },
            { level: 8, xp: 2800, title: 'Iluminado' },
            { level: 9, xp: 3600, title: 'Trascendente' },
            { level: 10, xp: 4500, title: 'Legendario' }
        ];
        devLogger.log('[AI-TUTOR] Service initialized');
    }
    // =====================================================
    // PROFILE MANAGEMENT
    // =====================================================
    async getOrCreateProfile(userId) {
        const existing = await executeQuery('SELECT * FROM learner_profiles WHERE user_id = $1', [userId]);
        if (existing.length > 0) {
            return existing[0];
        }
        const result = await executeQuery(`
            INSERT INTO learner_profiles (user_id, level, xp, learning_style, adaptive_difficulty)
            VALUES ($1, 1, 0, 'balanced', 0.5)
            RETURNING *
        `, [userId]);
        return result[0];
    }
    async getProfileWithStats(userId) {
        const profile = await this.getOrCreateProfile(userId);
        const stats = await executeQuery(`
            SELECT 
                COUNT(*) as total_sessions,
                SUM(questions_answered) as total_questions,
                SUM(correct_answers) as total_correct,
                AVG(correct_answers::float / NULLIF(questions_answered, 0)) as avg_accuracy
            FROM tutoring_sessions
            WHERE user_id = $1
        `, [userId]);
        const levelInfo = this.calculateLevel(profile.xp);
        return {
            ...profile,
            ...levelInfo,
            stats: stats[0] || {}
        };
    }
    async updateProfile(userId, profileData) {
        const updates = [];
        const values = [userId];
        let paramIndex = 2;
        const allowedFields = ['learning_style', 'preferred_session_duration', 'adaptive_difficulty'];
        for (const [key, value] of Object.entries(profileData)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }
        if (updates.length === 0) {
            return await this.getOrCreateProfile(userId);
        }
        const result = await executeQuery(`
            UPDATE learner_profiles SET ${updates.join(', ')}, updated_at = NOW()
            WHERE user_id = $1 RETURNING *
        `, values);
        return result[0];
    }
    async updateSubjectProficiency(userId, subject, score) {
        await executeQuery(`
            UPDATE learner_profiles
            SET subjects_proficiency = COALESCE(subjects_proficiency, '{}'::jsonb) || $2::jsonb,
                updated_at = NOW()
            WHERE user_id = $1
        `, [userId, JSON.stringify({ [subject]: score })]);
    }
    calculateLevel(xp) {
        let currentLevel = this.tutorLevels[0];
        let nextLevel = this.tutorLevels[1];
        for (let i = 0; i < this.tutorLevels.length; i++) {
            if (xp >= this.tutorLevels[i].xp) {
                currentLevel = this.tutorLevels[i];
                nextLevel = this.tutorLevels[i + 1] || currentLevel;
            }
        }
        const xpInLevel = xp - currentLevel.xp;
        const xpForLevel = nextLevel.xp - currentLevel.xp;
        return {
            level: currentLevel.level,
            title: currentLevel.title,
            xpToNext: nextLevel.xp - xp,
            progress: xpForLevel > 0 ? xpInLevel / xpForLevel : 1
        };
    }
    // =====================================================
    // SESSION MANAGEMENT
    // =====================================================
    async startSession(userId, sessionData) {
        const profile = await this.getOrCreateProfile(userId);
        const difficulty = sessionData.difficulty ?? profile.adaptive_difficulty;
        const result = await executeQuery(`
            INSERT INTO tutoring_sessions (
                user_id, subject, topic, difficulty, started_at
            ) VALUES ($1, $2, $3, $4, NOW())
            RETURNING id
        `, [userId, sessionData.subject, sessionData.topic, difficulty]);
        const sessionId = result[0].id;
        return {
            id: sessionId,
            userId,
            subject: sessionData.subject,
            topic: sessionData.topic,
            difficulty,
            startedAt: new Date(),
            xpEarned: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            messages: []
        };
    }
    async addMessage(sessionId, role, content) {
        const result = await executeQuery(`
            INSERT INTO session_messages (session_id, role, content, created_at)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, created_at
        `, [sessionId, role, content]);
        return {
            id: result[0].id,
            sessionId,
            role,
            content,
            timestamp: result[0].created_at
        };
    }
    async endSession(sessionId, sessionResults = {}) {
        const { questionsAnswered = 0, correctAnswers = 0 } = sessionResults;
        // Calculate XP earned
        const baseXP = 10;
        const accuracyBonus = questionsAnswered > 0
            ? Math.round((correctAnswers / questionsAnswered) * 20)
            : 0;
        const xpEarned = baseXP + accuracyBonus;
        const result = await executeQuery(`
            UPDATE tutoring_sessions
            SET ended_at = NOW(),
                questions_answered = $2,
                correct_answers = $3,
                xp_earned = $4
            WHERE id = $1
            RETURNING *
        `, [sessionId, questionsAnswered, correctAnswers, xpEarned]);
        const session = result[0];
        // Update user profile XP
        await executeQuery(`
            UPDATE learner_profiles
            SET xp = xp + $2,
                total_sessions = total_sessions + 1,
                updated_at = NOW()
            WHERE user_id = $1
        `, [session.user_id, xpEarned]);
        return { ...session, xpEarned };
    }
    async getSessionHistory(userId, options = {}) {
        const { limit = 20, offset = 0 } = options;
        return await executeQuery(`
            SELECT * FROM tutoring_sessions
            WHERE user_id = $1
            ORDER BY started_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
    }
    async getSessionById(sessionId) {
        const result = await executeQuery('SELECT * FROM tutoring_sessions WHERE id = $1', [sessionId]);
        return result[0] || null;
    }
    // =====================================================
    // ADAPTIVE LEARNING
    // =====================================================
    async calculateAdaptiveDifficulty(userId, subject) {
        const recentSessions = await executeQuery(`
            SELECT correct_answers, questions_answered
            FROM tutoring_sessions
            WHERE user_id = $1
            ${subject ? 'AND subject = $2' : ''}
            ORDER BY started_at DESC
            LIMIT 5
        `, subject ? [userId, subject] : [userId]);
        if (recentSessions.length === 0) {
            return 0.5;
        }
        const totalCorrect = recentSessions.reduce((sum, s) => sum + s.correct_answers, 0);
        const totalQuestions = recentSessions.reduce((sum, s) => sum + s.questions_answered, 0);
        if (totalQuestions === 0)
            return 0.5;
        const accuracy = totalCorrect / totalQuestions;
        // Adjust difficulty based on performance
        if (accuracy > 0.8)
            return Math.min(1, 0.5 + (accuracy - 0.8) * 2.5);
        if (accuracy < 0.4)
            return Math.max(0.1, 0.5 - (0.4 - accuracy) * 1.25);
        return 0.5;
    }
    // =====================================================
    // LEARNING PATHS
    // =====================================================
    async getLearningPaths(options = {}) {
        let query = 'SELECT * FROM learning_paths WHERE active = true';
        const params = [];
        if (options.subject) {
            params.push(options.subject);
            query += ` AND subject = $${params.length}`;
        }
        return await executeQuery(query + ' ORDER BY difficulty, name', params);
    }
    async getPathById(pathId, userId) {
        const result = await executeQuery('SELECT * FROM learning_paths WHERE id = $1', [pathId]);
        if (result.length === 0)
            return null;
        const path = result[0];
        if (userId) {
            const progress = await executeQuery('SELECT * FROM user_learning_paths WHERE user_id = $1 AND path_id = $2', [userId, pathId]);
            if (progress.length > 0) {
                path.userProgress = progress[0];
            }
        }
        return path;
    }
    async startLearningPath(userId, pathId) {
        await executeQuery(`
            INSERT INTO user_learning_paths (user_id, path_id, started_at, current_module)
            VALUES ($1, $2, NOW(), 0)
            ON CONFLICT (user_id, path_id) DO UPDATE SET started_at = NOW()
        `, [userId, pathId]);
    }
    async updatePathProgress(userId, pathId, progressData) {
        await executeQuery(`
            UPDATE user_learning_paths
            SET current_module = $3,
                completed = COALESCE($4, completed),
                updated_at = NOW()
            WHERE user_id = $1 AND path_id = $2
        `, [userId, pathId, progressData.currentModule, progressData.completed]);
    }
    async getUserPaths(userId) {
        return await executeQuery(`
            SELECT lp.*, ulp.started_at, ulp.current_module, ulp.completed
            FROM learning_paths lp
            JOIN user_learning_paths ulp ON lp.id = ulp.path_id
            WHERE ulp.user_id = $1
            ORDER BY ulp.updated_at DESC
        `, [userId]);
    }
    // =====================================================
    // RECOMMENDATIONS
    // =====================================================
    async generateRecommendations(userId) {
        const profile = await this.getProfileWithStats(userId);
        const recommendations = [];
        // Recommend based on weak subjects
        if (profile.subjects_proficiency) {
            for (const [subject, proficiency] of Object.entries(profile.subjects_proficiency)) {
                if (proficiency < 0.6) {
                    recommendations.push({
                        id: `rec_${Date.now()}_${subject}`,
                        userId,
                        type: 'practice',
                        title: `Practica ${subject}`,
                        description: `Tu nivel en ${subject} puede mejorar. ¡Vamos a practicar!`,
                        subject,
                        priority: 1,
                        status: 'active',
                        createdAt: new Date()
                    });
                }
            }
        }
        // Recommend review of concepts
        const conceptsToReview = await this.getConceptsToReview(userId, 3);
        for (const concept of conceptsToReview) {
            recommendations.push({
                id: `rec_review_${concept.concept}`,
                userId,
                type: 'review',
                title: `Repasa: ${concept.concept}`,
                description: `Es hora de repasar este concepto según el método de repetición espaciada.`,
                subject: concept.subject,
                priority: 2,
                status: 'active',
                createdAt: new Date()
            });
        }
        return recommendations;
    }
    async getActiveRecommendations(userId, limit = 10) {
        return await executeQuery(`
            SELECT * FROM recommendations
            WHERE user_id = $1 AND status = 'active'
            ORDER BY priority, created_at DESC
            LIMIT $2
        `, [userId, limit]);
    }
    async updateRecommendationStatus(userId, recommendationId, status) {
        await executeQuery(`
            UPDATE recommendations SET status = $3, updated_at = NOW()
            WHERE user_id = $1 AND id = $2
        `, [userId, recommendationId, status]);
    }
    // =====================================================
    // SPACED REPETITION
    // =====================================================
    async updateConceptMastery(userId, subject, concept, isCorrect) {
        const existing = await executeQuery(`
            SELECT * FROM concept_mastery
            WHERE user_id = $1 AND subject = $2 AND concept = $3
        `, [userId, subject, concept]);
        if (existing.length === 0) {
            await executeQuery(`
                INSERT INTO concept_mastery (user_id, subject, concept, mastery, review_count, next_review_date)
                VALUES ($1, $2, $3, $4, 1, $5)
            `, [userId, subject, concept, isCorrect ? 0.6 : 0.3, new Date(Date.now() + 86400000)]);
        }
        else {
            const current = existing[0];
            const newMastery = this.calculateNewMastery(current.mastery, isCorrect);
            const nextReview = this.calculateReviewInterval(newMastery, current.review_interval || 1, isCorrect);
            await executeQuery(`
                UPDATE concept_mastery
                SET mastery = $4, review_count = review_count + 1,
                    next_review_date = $5, last_attempt_correct = $6
                WHERE user_id = $1 AND subject = $2 AND concept = $3
            `, [userId, subject, concept, newMastery, nextReview, isCorrect]);
        }
    }
    calculateNewMastery(currentMastery, isCorrect) {
        if (isCorrect) {
            return Math.min(1, currentMastery + 0.1 * (1 - currentMastery));
        }
        else {
            return Math.max(0, currentMastery - 0.2);
        }
    }
    calculateReviewInterval(mastery, currentInterval, isCorrect) {
        let multiplier = isCorrect ? 2.5 : 0.5;
        if (mastery > 0.8)
            multiplier = 3;
        if (mastery < 0.4)
            multiplier = 0.25;
        const newInterval = Math.max(1, Math.round(currentInterval * multiplier));
        return new Date(Date.now() + newInterval * 86400000);
    }
    async getConceptsToReview(userId, limit = 10) {
        return await executeQuery(`
            SELECT * FROM concept_mastery
            WHERE user_id = $1 AND next_review_date <= NOW()
            ORDER BY mastery ASC, next_review_date ASC
            LIMIT $2
        `, [userId, limit]);
    }
    // =====================================================
    // STATISTICS
    // =====================================================
    async getDetailedStats(userId) {
        const [sessions, concepts, paths] = await Promise.all([
            executeQuery(`
                SELECT subject, COUNT(*) as count, AVG(correct_answers::float / NULLIF(questions_answered, 0)) as avg_accuracy
                FROM tutoring_sessions WHERE user_id = $1 GROUP BY subject
            `, [userId]),
            executeQuery(`
                SELECT subject, AVG(mastery) as avg_mastery, COUNT(*) as concept_count
                FROM concept_mastery WHERE user_id = $1 GROUP BY subject
            `, [userId]),
            executeQuery(`
                SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
                FROM user_learning_paths WHERE user_id = $1
            `, [userId])
        ]);
        return {
            sessionsBySubject: sessions,
            conceptMasteryBySubject: concepts,
            learningPaths: paths[0] || { total: 0, completed: 0 }
        };
    }
}
exports.AITutorService = AITutorService;
// ============================================
// EXPORTS
// ============================================
const aiTutorService = new AITutorService();
exports.default = aiTutorService;
module.exports = aiTutorService;
module.exports.AITutorService = AITutorService;
//# sourceMappingURL=ai-tutor.service.js.map