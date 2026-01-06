const { executeQuery } = require('../config/database');
const debugLog = require('../utils/debug-logger');

class PredictiveAnalyticsService {

    /**
     * Calcula y actualiza el perfil de riesgo para todos los estudiantes activos
     */
    async updateAllStudentRisks() {
        try {
            // 1. Obtener métricas base (Promedio y Faltas) por usuario
            // Hacemos JOIN con estudiantes para ligar calificaciones con usuarios
            const sql = `
                SELECT 
                    u.id as user_id,
                    e.id as student_id,
                    u.nombre,
                    u.apellido_paterno,
                    COALESCE(AVG(c.calificacion), 0) as average_grade,
                    COALESCE(SUM(c.faltas), 0) as total_absences
                FROM usuarios u
                JOIN estudiantes e ON e.usuario_id = u.id
                LEFT JOIN calificaciones c ON c.estudiante_id = e.id
                WHERE u.status = 'activo' OR u.activo = TRUE
                GROUP BY u.id, e.id
            `;

            const metrics = await executeQuery(sql);

            if (!metrics || metrics.length === 0) {
                console.log('⚠️ No student metrics found for risk analysis.');
                return { processed: 0 };
            }

            console.log(`📊 Analyzing risk for ${metrics.length} students...`);

            let processed = 0;
            for (const m of metrics) {
                const riskProfile = this._calculateRisk(parseFloat(m.average_grade), parseInt(m.total_absences));

                await this._upsertRiskProfile(m.user_id, riskProfile);
                processed++;
            }

            return { success: true, processed };

        } catch (error) {
            console.error('Error in PredictiveAnalyticsService.updateAllStudentRisks:', error);
            throw error;
        }
    }

    /**
     * Regla heurística simple para determinar riesgo
     */
    _calculateRisk(avgGrade, absences) {
        let level = 'LOW';
        let score = 0; // 0-100 (100 = Max Risk)
        let factors = [];

        // Grade Factors
        if (avgGrade < 6.0) {
            level = 'CRITICAL';
            score += 80;
            factors.push('Failing Grades');
        } else if (avgGrade < 7.0) {
            level = 'HIGH';
            score += 50;
            factors.push('Low Performance');
        } else if (avgGrade < 8.0) {
            if (level === 'LOW') level = 'MEDIUM';
            score += 20;
        }

        // Attendance Factors
        if (absences > 10) {
            level = 'CRITICAL';
            score += 90;
            factors.push('Excessive Absences');
        } else if (absences > 5) {
            if (level !== 'CRITICAL') level = 'HIGH';
            score += 40;
            factors.push('Frequent Absences');
        }

        // Cap score
        if (score > 100) score = 100;

        // Determine final level based on max score if multiple factors
        if (score >= 80) level = 'CRITICAL';
        else if (score >= 50) level = 'HIGH';
        else if (score >= 20) level = 'MEDIUM';

        if (factors.length === 0) factors.push('None');

        return {
            level,
            score,
            primary_factor: factors.join(', ')
        };
    }

    async _upsertRiskProfile(userId, riskData) {
        const sql = `
            INSERT INTO student_risk_profiles (
                student_id, risk_level, risk_score, primary_factor, last_updated, updated_by_model
            ) VALUES ($1, $2, $3, $4, NOW(), 'RuleBased_v1')
            ON CONFLICT (student_id) 
            DO UPDATE SET 
                risk_level = EXCLUDED.risk_level,
                risk_score = EXCLUDED.risk_score,
                primary_factor = EXCLUDED.primary_factor,
                last_updated = NOW();
        `;
        await executeQuery(sql, [userId, riskData.level, riskData.score, riskData.primary_factor]);
    }

    async getDashboardStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN risk_level = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) as low
            FROM student_risk_profiles
        `;
        const rows = await executeQuery(sql);
        return rows[0];
    }

    async getAtRiskStudents() {
        const sql = `
            SELECT 
                srp.*,
                u.nombre,
                u.apellido_paterno,
                u.email
            FROM student_risk_profiles srp
            JOIN usuarios u ON u.id = srp.student_id
            WHERE srp.risk_level IN ('HIGH', 'CRITICAL')
            ORDER BY srp.risk_score DESC
            LIMIT 50
         `;
        return await executeQuery(sql);
    }
}

module.exports = new PredictiveAnalyticsService();