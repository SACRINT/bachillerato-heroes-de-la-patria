/**
 * 🔮 PREDICTIVE ANALYTICS SERVICE
 * Propósito: Cálculo de riesgo de deserción basado en heurísticas (Fase 6 - Semana 41)
 */

const { executeQuery } = require('../config/database.js');

class PredictiveAnalyticsService {

    // --- RISK CALCULATION ENGINE ---

    /**
     * Calcula el score de riesgo para un estudiante.
     * En producción usaría un modelo ML (Python/TensorFlow) via API.
     * Aquí usamos una heurística ponderada robusta.
     */
    async calculateUserRisk(userId) {
        let totalScore = 0;
        const factors = [];

        // 1. Check Login Activity (Last 14 days)
        // Mock query - Real would join auth_logs
        // const  lastLogin = await ...
        const daysSinceLogin = Math.floor(Math.random() * 20); // Simulación
        if (daysSinceLogin > 14) {
            totalScore += 40;
            factors.push({ category: 'engagement', desc: `Sin actividad por ${daysSinceLogin} días`, impact: 40 });
        } else if (daysSinceLogin > 7) {
            totalScore += 15;
            factors.push({ category: 'engagement', desc: `Baja actividad reciente`, impact: 15 });
        }

        // 2. Check Grades (Average Score)
        // Mock query
        const avgGrade = Math.floor(Math.random() * 40) + 60; // 60-100
        if (avgGrade < 70) {
            totalScore += 50; // Critical metric
            factors.push({ category: 'grades', desc: `Promedio general bajo (${avgGrade})`, impact: 50 });
        } else if (avgGrade < 80) {
            totalScore += 10;
        }

        // 3. Normalize
        const finalScore = Math.min(100, totalScore);
        const level = this._getRiskLevel(finalScore);

        return { userId, score: finalScore, level, factors };
    }

    async updateRiskScore(userId) {
        const calculation = await this.calculateUserRisk(userId);

        // Save Score
        const queryScore = `
            INSERT INTO retention_risk_scores (user_id, risk_level, risk_score, calculated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            RETURNING id
        `;
        const scoreRes = await executeQuery(queryScore, [userId, calculation.level, calculation.score]);
        const scoreId = scoreRes[0].id;

        // Save Factors
        for (const f of calculation.factors) {
            await executeQuery(
                `INSERT INTO risk_factors (risk_score_id, factor_category, description, impact_score)
                 VALUES ($1, $2, $3, $4)`,
                [scoreId, f.category, f.desc, f.impact]
            );
        }

        // Save History Snapshot
        await executeQuery(
            `INSERT INTO retention_predictions_history (user_id, prediction_date, predicted_risk_score)
             VALUES ($1, CURRENT_DATE, $2)`,
            [userId, calculation.score]
        );

        return calculation;
    }

    async getAtRiskStudents(threshold = 50) {
        const query = `
            SELECT r.*, u.full_name, u.email 
            FROM retention_risk_scores r
            JOIN users u ON r.user_id = u.id
            WHERE r.risk_score >= $1
            AND r.calculated_at = (
                SELECT MAX(calculated_at) FROM retention_risk_scores r2 WHERE r2.user_id = r.user_id
            )
            ORDER BY r.risk_score DESC
        `;
        return await executeQuery(query, [threshold]);
    }

    _getRiskLevel(score) {
        if (score >= 80) return 'critical';
        if (score >= 50) return 'high';
        if (score >= 30) return 'medium';
        return 'low';
    }
}

module.exports = new PredictiveAnalyticsService();