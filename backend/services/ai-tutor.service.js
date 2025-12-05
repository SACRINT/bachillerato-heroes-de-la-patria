/**
 * 🤖 AI TUTOR SERVICE
 * Servicio de tutoría IA personalizada
 * Refactorizado: Service Layer + DAO Pattern
 */

const TutorSessionDAO = require('../data/tutor-session.dao');
const LearningProfileDAO = require('../data/learning-profile.dao');
const LearningPathDAO = require('../data/learning-path.dao');
// const { getRealAIService } = require('./realAIService'); // Descomentar cuando exista

class AITutorService {
    constructor() {
        // this.aiService = getRealAIService();

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
    }

    // =====================================
    // PERFILES DE APRENDIZAJE
    // =====================================

    async getProfile(userId) {
        const profile = await LearningProfileDAO.getOrCreate(userId);
        const mastery = await LearningProfileDAO.getMasteryBySubject(userId);
        const levelInfo = this.calculateLevel(profile.tutor_xp);

        return {
            ...profile,
            mastery_summary: mastery,
            level_info: levelInfo
        };
    }

    async updateProfile(userId, data) {
        return await LearningProfileDAO.update(userId, data);
    }

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

    async startSession(userId, sessionData) {
        const { subject, difficultyLevel } = sessionData;

        // Dificultad adaptativa
        let difficulty = difficultyLevel;
        if (!difficulty || difficulty === 'adaptive') {
            difficulty = await this.calculateAdaptiveDifficulty(userId, subject);
        }

        return await TutorSessionDAO.create({
            user_id: userId,
            ...sessionData,
            difficulty_level: difficulty
        });
    }

    async addMessage(sessionId, role, content) {
        const message = {
            role,
            content,
            timestamp: new Date().toISOString()
        };
        return await TutorSessionDAO.addMessage(sessionId, message);
    }

    async endSession(sessionId, results) {
        const session = await TutorSessionDAO.findById(sessionId);
        if (!session) throw new Error('Sesión no encontrada');

        // Calcular duración
        const startTime = new Date(session.started_at);
        const endTime = new Date();
        const actualDuration = Math.round((endTime - startTime) / 60000);

        // Calcular XP y Coins
        let xpEarned = Math.min(actualDuration, 60);
        if (results.quiz_score) {
            xpEarned += Math.round(results.quiz_score / 10);
        }
        const coinsEarned = actualDuration >= 10 ? 5 : 2;

        const finalResults = {
            ...results,
            actual_duration: actualDuration,
            xp_earned: xpEarned,
            coins_earned: coinsEarned
        };

        const completedSession = await TutorSessionDAO.complete(sessionId, finalResults);

        // Actualizar perfil
        await LearningProfileDAO.updateStats(session.user_id, {
            duration: actualDuration,
            xp: xpEarned
        });

        // Actualizar mastery si hubo quiz
        if (results.quiz_score) {
            await this.updateSubjectProficiency(session.user_id, session.subject, results.quiz_score / 100);
        }

        return completedSession;
    }

    async calculateAdaptiveDifficulty(userId, subject) {
        const stats = await TutorSessionDAO.getStatsForAdaptiveDifficulty(userId, subject);

        if (!stats || !stats.session_count || parseInt(stats.session_count) < 3) {
            return 'medium';
        }

        const avgScore = parseFloat(stats.avg_score);
        if (avgScore >= 85) return 'hard';
        if (avgScore >= 60) return 'medium';
        return 'easy';
    }

    // =====================================
    // DOMINIO Y RECOMENDACIONES
    // =====================================

    async updateSubjectProficiency(userId, subject, score) {
        // Lógica simplificada: actualizar proficiencia general en perfil
        // En una implementación completa, esto actualizaría conceptos específicos
        const profile = await LearningProfileDAO.getOrCreate(userId);
        const proficiency = profile.subject_proficiency || {};
        const currentScore = proficiency[subject] || 0.5;

        proficiency[subject] = Math.min(1, Math.max(0, currentScore * 0.7 + score * 0.3));

        await LearningProfileDAO.update(userId, { subject_proficiency: proficiency });
    }

    async generateRecommendations(userId) {
        // Generar recomendaciones basadas en perfil (simplificado)
        const profile = await this.getProfile(userId);
        const recommendations = [];

        // Ejemplo: Recomendación por baja proficiencia
        const proficiency = profile.subject_proficiency || {};
        for (const [subject, level] of Object.entries(proficiency)) {
            if (level < 0.5) {
                const rec = await LearningProfileDAO.createRecommendation({
                    user_id: userId,
                    type: 'topic',
                    title: `Refuerzo en ${subject}`,
                    description: `Tu nivel en ${subject} necesita práctica`,
                    reason: `Proficiencia: ${Math.round(level * 100)}%`,
                    priority: 80,
                    confidence: 0.9
                });
                recommendations.push(rec);
            }
        }

        return recommendations;
    }

    async getActiveRecommendations(userId) {
        return await LearningProfileDAO.getActiveRecommendations(userId);
    }
}

module.exports = new AITutorService();
