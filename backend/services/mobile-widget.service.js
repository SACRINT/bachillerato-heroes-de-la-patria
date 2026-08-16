const { executeQuery } = require('../config/database.js');

class MobileWidgetService {

    /**
     * Obtiene datos resumidos para el widget "Streak & Progress"
     */
    async getStreakWidgetData(userId) {
        // Obtener racha actual
        const streakRes = await executeQuery(
            'SELECT current_streak FROM user_streaks WHERE user_id = $1',
            [userId]
        );
        const streak = streakRes.length > 0 ? streakRes[0].current_streak : 0;

        // Obtener próxima clase/evento
        const nextEventRes = await executeQuery(
            `SELECT title, start_time 
             FROM appointments_calendar 
             WHERE user_id = $1 AND start_time > NOW() 
             ORDER BY start_time ASC LIMIT 1`,
            [userId]
        );
        const nextEvent = nextEventRes.length > 0 ? nextEventRes[0] : null;

        // Obtener % de lección actual
        const recentLesson = await executeQuery(
            `SELECT l.title, p.progress_percent
             FROM micro_lesson_progress p
             JOIN micro_lessons l ON p.lesson_id = l.id
             WHERE p.user_id = $1 AND p.status = 'started'
             ORDER BY p.last_accessed_at DESC LIMIT 1`,
            [userId]
        );

        return {
            streak,
            nextEvent,
            currentLesson: recentLesson.length > 0 ? recentLesson[0] : null
        };
    }

    /**
     * Obtiene un "Daily Tip" corto para widget mediano
     */
    async getDailyTipWidgetData() {
        // En futuro, traer de BD de tips
        return {
            tip: "Estudiar 5 min al día es mejor que 2 horas una vez a la semana.",
            author: "BGE Tutor"
        };
    }
}

module.exports = new MobileWidgetService();
