const { executeQuery } = require('../config/database');
const debugLog = require('../utils/debug-logger');

class EmotionalAnalyticsService {

    /**
     * Registra un estado emocional para un estudiante
     */
    async trackEmotion(studentId, emotionName, source = 'SELF_REPORT', context = {}) {
        try {
            // 1. Get Emotion ID
            const emotions = await executeQuery('SELECT id, valence FROM emotional_states WHERE name = $1', [emotionName]);

            let emotionId = null;
            let valence = 0;

            if (emotions.length > 0) {
                emotionId = emotions[0].id;
                valence = parseFloat(emotions[0].valence);
            } else {
                // Fallback to Neutral if unknown
                const neutral = await executeQuery("SELECT id, valence FROM emotional_states WHERE name = 'Neutral'");
                if (neutral.length > 0) {
                    emotionId = neutral[0].id;
                    valence = 0;
                }
            }

            if (!emotionId) throw new Error('Emotional state configuration missing');

            // 2. Insert Log
            const sql = `
                INSERT INTO session_emotions 
                (student_id, emotion_id, source, context_data, confidence_score)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id;
            `;

            await executeQuery(sql, [studentId, emotionId, source, JSON.stringify(context), 1.0]);

            // 3. Update Current Context (Simple momentum logic)
            await this._updateEmotionalContext(studentId, valence);

            return { success: true };

        } catch (error) {
            console.error('Error tracking emotion:', error);
            throw error;
        }
    }

    async _updateEmotionalContext(studentId, newValence) {
        // Logic to update momentum_score in current_emotional_context
        // Momentum increases with positive valence, drops with negative
        const checkSql = `SELECT momentum_score FROM current_emotional_context WHERE student_id = $1`;
        const res = await executeQuery(checkSql, [studentId]);

        let currentMomentum = 0;
        if (res.length > 0) {
            currentMomentum = parseFloat(res[0].momentum_score);
        }

        // Adjust momentum
        if (newValence > 0) currentMomentum += (newValence * 5); // Boost
        else if (newValence < 0) currentMomentum += (newValence * 10); // Penalty is usage usually harder to recover

        // Decay/Normalize
        if (currentMomentum > 100) currentMomentum = 100;
        if (currentMomentum < 0) currentMomentum = 0;

        // Upsert
        const upsertSql = `
            INSERT INTO current_emotional_context (student_id, current_mood, momentum_score, last_check_in)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (student_id) DO UPDATE SET
                momentum_score = $3,
                last_check_in = NOW(),
                current_mood = CASE 
                    WHEN $3 > 75 THEN 'Flow' 
                    WHEN $3 < 30 THEN 'Stressed' 
                    ELSE 'Stable' 
                END;
        `;

        // Determine mood string based on momentum for simplicity in this version
        let mood = 'Stable';
        if (currentMomentum > 75) mood = 'Flow';
        if (currentMomentum < 30) mood = 'Stressed';

        await executeQuery(upsertSql, [studentId, mood, currentMomentum]);
    }

    async getCurrentState(studentId) {
        const sql = `
            SELECT cec.*, es.name as last_emotion_name
            FROM current_emotional_context cec
            LEFT JOIN session_emotions se ON se.student_id = cec.student_id
            LEFT JOIN emotional_states es ON se.emotion_id = es.id
            WHERE cec.student_id = $1
            ORDER BY se.created_at DESC
            LIMIT 1
        `;
        const rows = await executeQuery(sql, [studentId]);
        return rows[0] || { current_mood: 'Unknown', momentum_score: 50 };
    }

    async checkInterventionNeeded(studentId) {
        // Regla: Si el momentum es < 20 o las últimas 3 emociones fueron negativas
        const state = await this.getCurrentState(studentId);

        let shouldIntervene = false;
        let interventionType = null;
        let message = '';

        if (state.momentum_score < 20) {
            shouldIntervene = true;
            interventionType = 'DE_STRESS_BREAK';
            message = 'Hemos notado que estás teniendo dificultades. ¿Qué tal un descanso de 5 minutos?';
        }

        // Check last 3 emotions
        const historySql = `
            SELECT es.valence, es.name
            FROM session_emotions se
            JOIN emotional_states es ON se.emotion_id = es.id
            WHERE se.student_id = $1
            ORDER BY se.created_at DESC
            LIMIT 3
        `;
        const history = await executeQuery(historySql, [studentId]);

        if (history.length >= 3) {
            const negatives = history.filter(h => parseFloat(h.valence) < 0).length;
            if (negatives === 3) {
                shouldIntervene = true;
                interventionType = 'SWITCH_TOPIC'; // Cambiar tema si todo es negativo
                message = 'Parece que este tema es complicado. ¿Quieres probar con otro enfoque o tema diferente?';
            }
        }

        if (state.momentum_score < 10) {
            // ALERTA DE RIESGO - Notificar a sistema (Simulado con log por ahora)
            // En futuro: Integrar con sistema de notificaciones a tutores
            debugLog.warn('EMOTIONAL_RISK', `Estudiante ${studentId} en riesgo crítico de frustración. Momentum: ${state.momentum_score}`);
        }

        return { shouldIntervene, interventionType, message };
    }

    async getEmotionHistory(studentId, limit = 10) {
        const sql = `
            SELECT se.id, es.name as emotion, es.valence, se.created_at
            FROM session_emotions se
            JOIN emotional_states es ON se.emotion_id = es.id
            WHERE se.student_id = $1
            ORDER BY se.created_at DESC
            LIMIT $2
        `;
        return await executeQuery(sql, [studentId, limit]);
    }
}

module.exports = new EmotionalAnalyticsService();
