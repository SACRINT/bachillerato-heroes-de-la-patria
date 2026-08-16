const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

class GamificationAnalyticsService {

    /**
     * Obtener Resumen General (Admin/Docente)
     */
    async getGlobalStats() {
        const query = `
            SELECT
                (SELECT COUNT(*) FROM usuarios WHERE role = 'estudiante' AND activo = true) as total_students,
                (SELECT SUM(total_earned) FROM iacoins_balance) as total_iacoins_distributed,
                (SELECT COUNT(*) FROM user_streaks WHERE current_streak > 0) as active_steaks,
                (SELECT COUNT(*) FROM tournaments WHERE status = 'active') as active_tournaments
        `;
        const res = await pool.query(query);
        return res.rows[0];
    }

    /**
     * Obtener Distribución de Niveles
     */
    async getLevelDistribution() {
        // Usa la vista creada en la migración
        const query = `SELECT * FROM view_level_distribution`;
        const res = await pool.query(query);
        return res.rows;
    }

    /**
     * Obtener Top Earners Semanal
     */
    async getWeeklyTopEarners() {
        const query = `SELECT * FROM view_weekly_top_earners`;
        const res = await pool.query(query);
        return res.rows;
    }

    /**
     * Generar Snapshot Diario (Cron Job)
     */
    async generateDailySnapshot() {
        // En una implementación real, esto correría a medianoche
        // Agrega lógica para calcular totales del día y guardar en gamification_daily_stats
        devLogger.log('GENERATING DAILY GAMIFICATION SNAPSHOT...');
        return true;
    }
}

module.exports = new GamificationAnalyticsService();
