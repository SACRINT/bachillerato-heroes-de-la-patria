/**
 * ❤️ SENTIMENT ANALYSIS SERVICE
 * Propósito: Detectar emociones y toxicidad en texto (Fase 6 - Semana 44)
 */

const { executeQuery } = require('../config/database.js');

class SentimentAnalysisService {

    async analyzeText(userId, sourceType, sourceId, text) {
        // Mock NLP Logic
        // Real implementation would use Google Cloud NLP or TensorFlow.js
        const sentiment = this._mockSentimentAnalysis(text);

        // Save Analysis
        const query = `
            INSERT INTO sentiment_analysis_logs (user_id, source_type, source_id, text_content, sentiment_score, toxicity_score, detected_emotions)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `;
        const res = await executeQuery(query, [
            userId, sourceType, sourceId, text,
            sentiment.score, sentiment.toxicity, JSON.stringify(sentiment.emotions)
        ]);
        const logId = res[0].id;

        // Trigger Alert if Toxic
        if (sentiment.toxicity > 0.7) {
            await executeQuery(
                `INSERT INTO moderation_alerts (sentiment_log_id, alert_level) VALUES ($1, 'critical')`,
                [logId]
            );
        }

        return { id: logId, ...sentiment };
    }

    _mockSentimentAnalysis(text) {
        const lower = text.toLowerCase();
        let score = 0;
        let toxicity = 0;
        let emotions = { joy: 0.1, anger: 0.1 };

        if (lower.includes('gracias') || lower.includes('excelente')) {
            score = 0.8;
            emotions.joy = 0.9;
        } else if (lower.includes('estúpido') || lower.includes('odio')) {
            score = -0.9;
            toxicity = 0.85;
            emotions.anger = 0.95;
        }

        return { score, toxicity, emotions };
    }

    async getAlerts() {
        return await executeQuery(`
            SELECT a.*, l.text_content, l.user_id 
            FROM moderation_alerts a
            JOIN sentiment_analysis_logs l ON a.sentiment_log_id = l.id
            WHERE a.status = 'pending'
            ORDER BY a.created_at DESC
        `);
    }
}

module.exports = new SentimentAnalysisService();
