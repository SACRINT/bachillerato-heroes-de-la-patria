const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

class PersonalityProfilingService {

    /**
     * Obtener perfil de aprendizaje del usuario
     */
    async getProfile(userId) {
        const query = `SELECT * FROM student_personality_profiles WHERE user_id = $1`;
        const res = await pool.query(query, [userId]);
        return res.rows[0];
    }

    /**
     * Procesar Assessment (Quiz VAK)
     * Recibe: responses: [{ questionId: 'q1', category: 'visual', value: 5 }, ...]
     */
    async processVAKAssessment(userId, responses) {
        let v = 0, a = 0, k = 0;
        let count = 0;

        // 1. Calcular Scores
        for (const r of responses) {
            if (r.category === 'visual') v += r.value;
            if (r.category === 'auditory') a += r.value;
            if (r.category === 'kinesthetic') k += r.value;
            count++;
        }

        // Normalizar a 0-100 si es necesario (asumiendo input raw)
        // Por simplicidad, guardamos raw si el quiz es estándar

        // 2. Determinar dominante
        let dominant = 'multimodal';
        if (v > a && v > k) dominant = 'visual';
        else if (a > v && a > k) dominant = 'auditory';
        else if (k > v && k > a) dominant = 'kinesthetic';

        // Si hay empates o scores muy cercanos (<10% diff), multimodal es adecuado, 
        // pero por ahora lógica simple de mayor estricto.

        // 3. Guardar Perfil
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Guardar respuestas raw para futuro re-análisis
            for (const r of responses) {
                await client.query(
                    `INSERT INTO personality_assessment_responses (user_id, question_id, answer_value, category) VALUES ($1, $2, $3, $4)`,
                    [userId, r.questionId, r.value, r.category]
                );
            }

            // Upsert Perfil
            const upsertQuery = `
                INSERT INTO student_personality_profiles (user_id, visual_score, auditory_score, kinesthetic_score, dominant_style)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (user_id) DO UPDATE SET
                    visual_score = $2,
                    auditory_score = $3,
                    kinesthetic_score = $4,
                    dominant_style = $5,
                    updated_at = NOW()
                RETURNING *
            `;
            const res = await client.query(upsertQuery, [userId, v, a, k, dominant]);

            await client.query('COMMIT');

            // Log for debugging
            devLogger.log(`[PersonalityService] User ${userId} profiled as ${dominant} (V:${v} A:${a} K:${k})`);

            return res.rows[0];

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Actualizar metadatos de comportamiento (Performance Hour, Attention Span)
     * Llamado por scripts de background o eventos de sesión
     */
    async updateBehavioralMetrics(userId, metrics) {
        // metrics: { peakHour, attentionSpan }
        const { peakHour, attentionSpan } = metrics;

        const query = `
            UPDATE student_personality_profiles
            SET peak_performance_hour = COALESCE($2, peak_performance_hour),
                attention_span_minutes = COALESCE($3, attention_span_minutes),
                updated_at = NOW()
            WHERE user_id = $1
            RETURNING *
        `;
        const res = await pool.query(query, [userId, peakHour, attentionSpan]);
        return res.rows[0];
    }
}

module.exports = new PersonalityProfilingService();
