/**
 * 📊 TEACHER ANALYTICS DAO
 * Data Access Object para analíticas de docentes
 * Abstrae todas las queries SQL de TeacherAnalyticsService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { executeQuery } = require('../config/database');

class TeacherAnalyticsDAO {

    // ==========================================
    // RESUMEN DE CLASE
    // ==========================================

    /**
     * Obtiene resumen general de la clase
     */
    static async getClassOverview(teacherId, courseId = null) {
        let query = `
            SELECT
                COUNT(DISTINCT e.estudiante_id) as total_students,
                COUNT(DISTINCT CASE WHEN ib.level >= 5 THEN e.estudiante_id END) as advanced_students,
                AVG(ib.experience_points) as avg_xp,
                AVG(ib.level) as avg_level,
                AVG(cp_stats.completed) as avg_challenges_completed
            FROM inscripciones e
            JOIN usuarios u ON e.estudiante_id = u.id
            LEFT JOIN iacoins_balance ib ON e.estudiante_id = ib.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as completed
                FROM challenge_progress
                WHERE status = 'claimed'
                GROUP BY user_id
            ) cp_stats ON e.estudiante_id = cp_stats.user_id
            WHERE e.docente_id = $1
        `;

        const params = [teacherId];
        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        const result = await executeQuery(query, params);
        return result[0];
    }

    // ==========================================
    // MÉTRICAS DE ESTUDIANTES
    // ==========================================

    /**
     * Obtiene lista de estudiantes con métricas
     */
    static async getStudentsWithMetrics(teacherId, options = {}) {
        const {
            courseId,
            sortBy = 'name',
            sortOrder = 'ASC',
            limit = 50,
            offset = 0
        } = options;

        let query = `
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                COALESCE(ib.level, 1) as level,
                COALESCE(ib.experience_points, 0) as xp,
                COALESCE(ib.balance, 0) as iacoins,
                COALESCE(cp_stats.completed, 0) as challenges_completed,
                COALESCE(us.current_streak, 0) as current_streak,
                COALESCE(ag_stats.generations, 0) as ai_generations,
                ld.title as level_title,
                ld.icon as level_icon,
                up.avatar_url
            FROM inscripciones e
            JOIN usuarios u ON e.estudiante_id = u.id
            LEFT JOIN iacoins_balance ib ON u.id = ib.user_id
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN user_streaks us ON u.id = us.user_id AND us.streak_type = 'daily_login'
            LEFT JOIN (
                SELECT user_id, COUNT(*) as completed
                FROM challenge_progress
                WHERE status = 'claimed'
                GROUP BY user_id
            ) cp_stats ON u.id = cp_stats.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as generations
                FROM ai_generations
                WHERE status = 'completed'
                GROUP BY user_id
            ) ag_stats ON u.id = ag_stats.user_id
            WHERE e.docente_id = $1
        `;

        const params = [teacherId];
        let paramIndex = 2;

        if (courseId) {
            query += ` AND e.curso_id = $${paramIndex++}`;
            params.push(courseId);
        }

        const sortFields = {
            name: 'u.nombre',
            level: 'ib.level DESC',
            xp: 'ib.experience_points DESC',
            challenges: 'cp_stats.completed DESC',
            streak: 'us.current_streak DESC'
        };

        query += ` ORDER BY ${sortFields[sortBy] || 'u.nombre'} ${sortOrder}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Verifica acceso del docente al estudiante
     */
    static async checkTeacherAccess(teacherId, studentId) {
        const result = await executeQuery(
            `SELECT 1 FROM inscripciones WHERE docente_id = $1 AND estudiante_id = $2`,
            [teacherId, studentId]
        );
        return result.length > 0;
    }

    /**
     * Obtiene datos completos del estudiante
     */
    static async getStudentFullData(studentId) {
        const query = `
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                u.apellido_materno,
                u.email,
                u.created_at as joined_at,
                ib.level,
                ib.experience_points,
                ib.balance,
                ib.total_earned,
                ib.total_spent,
                ld.title as level_title,
                ld.icon as level_icon,
                up.bio,
                up.avatar_url
            FROM usuarios u
            LEFT JOIN iacoins_balance ib ON u.id = ib.user_id
            LEFT JOIN level_definitions ld ON ib.level = ld.level
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = $1
        `;
        const result = await executeQuery(query, [studentId]);
        return result[0];
    }

    /**
     * Obtiene estadísticas de retos del estudiante
     */
    static async getStudentChallengeStats(studentId) {
        const query = `
            SELECT
                COUNT(*) FILTER (WHERE status = 'claimed') as completed,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                SUM(coins_earned) as total_coins,
                SUM(xp_earned) as total_xp,
                AVG(
                    CASE WHEN status = 'claimed'
                    THEN EXTRACT(EPOCH FROM (claimed_at - started_at)) / 3600
                    END
                ) as avg_completion_hours
            FROM challenge_progress
            WHERE user_id = $1
        `;
        const result = await executeQuery(query, [studentId]);
        return result[0];
    }

    /**
     * Obtiene actividad reciente del estudiante
     */
    static async getStudentRecentActivity(studentId, limit = 10) {
        const query = `
            (
                SELECT
                    'challenge_completed' as type,
                    c.title as description,
                    cp.claimed_at as timestamp,
                    cp.coins_earned as value
                FROM challenge_progress cp
                JOIN challenges c ON cp.challenge_id = c.id
                WHERE cp.user_id = $1 AND cp.status = 'claimed'
                ORDER BY cp.claimed_at DESC
                LIMIT 5
            )
            UNION ALL
            (
                SELECT
                    'ai_generation' as type,
                    CONCAT('Generación ', generation_type) as description,
                    created_at as timestamp,
                    coins_cost as value
                FROM ai_generations
                WHERE user_id = $1 AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT 5
            )
            UNION ALL
            (
                SELECT
                    'level_up' as type,
                    CONCAT('Subió a nivel ', level) as description,
                    achieved_at as timestamp,
                    coins_earned as value
                FROM level_history
                WHERE user_id = $1
                ORDER BY achieved_at DESC
                LIMIT 5
            )
            ORDER BY timestamp DESC
            LIMIT $2
        `;
        return executeQuery(query, [studentId, limit]);
    }

    /**
     * Obtiene badges del estudiante
     */
    static async getStudentBadges(studentId, limit = 10) {
        const query = `
            SELECT
                b.name,
                b.icon,
                b.color,
                b.rarity,
                ub.earned_at
            FROM user_badges ub
            JOIN badges b ON ub.badge_id = b.id
            WHERE ub.user_id = $1
            ORDER BY ub.earned_at DESC
            LIMIT $2
        `;
        return executeQuery(query, [studentId, limit]);
    }

    /**
     * Obtiene progreso semanal del estudiante
     */
    static async getStudentWeeklyProgress(studentId) {
        const query = `
            SELECT
                DATE_TRUNC('day', t.timestamp) as day,
                SUM(CASE WHEN t.type = 'earn' THEN t.amount ELSE 0 END) as xp_earned,
                COUNT(*) FILTER (WHERE t.type = 'challenge') as challenges
            FROM (
                SELECT created_at as timestamp, 'earn' as type, xp_earned as amount
                FROM challenge_progress
                WHERE user_id = $1
                AND claimed_at >= NOW() - INTERVAL '7 days'
                UNION ALL
                SELECT created_at as timestamp, 'challenge' as type, 1 as amount
                FROM challenge_progress
                WHERE user_id = $1
                AND status = 'claimed'
                AND claimed_at >= NOW() - INTERVAL '7 days'
            ) t
            GROUP BY DATE_TRUNC('day', t.timestamp)
            ORDER BY day
        `;
        return executeQuery(query, [studentId]);
    }

    // ==========================================
    // REPORTES Y DISTRIBUCIONES
    // ==========================================

    /**
     * Obtiene distribución de niveles de la clase
     */
    static async getLevelDistribution(teacherId, courseId = null) {
        let query = `
            SELECT
                ib.level,
                ld.title,
                COUNT(*) as count
            FROM inscripciones e
            JOIN iacoins_balance ib ON e.estudiante_id = ib.user_id
            JOIN level_definitions ld ON ib.level = ld.level
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += ` GROUP BY ib.level, ld.title ORDER BY ib.level`;
        return executeQuery(query, params);
    }

    /**
     * Obtiene actividad diaria de la clase
     */
    static async getDailyActivity(teacherId, courseId = null, days = 30) {
        let query = `
            SELECT
                DATE_TRUNC('day', t.created_at) as day,
                COUNT(DISTINCT t.user_id) as active_users,
                SUM(t.xp) as total_xp
            FROM (
                SELECT user_id, claimed_at as created_at, xp_earned as xp
                FROM challenge_progress cp
                JOIN inscripciones e ON cp.user_id = e.estudiante_id
                WHERE e.docente_id = $1
        `;
        const params = [teacherId];
        let paramIndex = 2;

        if (courseId) {
            query += ` AND e.curso_id = $${paramIndex++}`;
            params.push(courseId);
        }

        query += `
                AND cp.claimed_at >= NOW() - INTERVAL '${days} days'
            ) t
            GROUP BY DATE_TRUNC('day', t.created_at)
            ORDER BY day
        `;
        return executeQuery(query, params);
    }

    /**
     * Obtiene retos más populares completados
     */
    static async getPopularChallenges(teacherId, courseId = null, limit = 5) {
        let query = `
            SELECT
                c.title,
                c.category,
                COUNT(*) as completions
            FROM challenge_progress cp
            JOIN challenges c ON cp.challenge_id = c.id
            JOIN inscripciones e ON cp.user_id = e.estudiante_id
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];
        let paramIndex = 2;

        if (courseId) {
            query += ` AND e.curso_id = $${paramIndex++}`;
            params.push(courseId);
        }

        query += `
            AND cp.status = 'claimed'
            GROUP BY c.id, c.title, c.category
            ORDER BY completions DESC
            LIMIT $${paramIndex}
        `;
        params.push(limit);
        return executeQuery(query, params);
    }

    // ==========================================
    // ALERTAS
    // ==========================================

    /**
     * Obtiene estudiantes con streak roto
     */
    static async getBrokenStreaks(teacherId, courseId = null) {
        let query = `
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                us.current_streak as previous_streak,
                us.last_activity_date
            FROM inscripciones e
            JOIN usuarios u ON e.estudiante_id = u.id
            LEFT JOIN user_streaks us ON u.id = us.user_id AND us.streak_type = 'daily_login'
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            AND us.last_activity_date < NOW() - INTERVAL '2 days'
            AND us.current_streak >= 5
        `;
        return executeQuery(query, params);
    }

    /**
     * Obtiene estudiantes inactivos
     */
    static async getInactiveStudents(teacherId, courseId = null, inactiveDays = 7) {
        let query = `
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                MAX(cp.updated_at) as last_activity
            FROM inscripciones e
            JOIN usuarios u ON e.estudiante_id = u.id
            LEFT JOIN challenge_progress cp ON u.id = cp.user_id
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            GROUP BY u.id, u.nombre, u.apellido_paterno
            HAVING MAX(cp.updated_at) < NOW() - INTERVAL '${inactiveDays} days'
               OR MAX(cp.updated_at) IS NULL
        `;
        return executeQuery(query, params);
    }

    /**
     * Obtiene estudiantes destacados
     */
    static async getHighPerformers(teacherId, courseId = null, minCompletions = 10) {
        let query = `
            SELECT
                u.id,
                u.nombre,
                u.apellido_paterno,
                COUNT(*) as recent_completions
            FROM inscripciones e
            JOIN usuarios u ON e.estudiante_id = u.id
            JOIN challenge_progress cp ON u.id = cp.user_id
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            AND cp.claimed_at >= NOW() - INTERVAL '7 days'
            GROUP BY u.id, u.nombre, u.apellido_paterno
            HAVING COUNT(*) >= ${minCompletions}
        `;
        return executeQuery(query, params);
    }

    // ==========================================
    // COMPARATIVAS
    // ==========================================

    /**
     * Compara rendimiento entre cursos
     */
    static async compareCourses(teacherId) {
        const query = `
            SELECT
                c.id as course_id,
                c.nombre as course_name,
                COUNT(DISTINCT e.estudiante_id) as students,
                AVG(ib.level) as avg_level,
                AVG(ib.experience_points) as avg_xp,
                SUM(cp_stats.completed) as total_challenges
            FROM cursos c
            JOIN inscripciones e ON c.id = e.curso_id
            LEFT JOIN iacoins_balance ib ON e.estudiante_id = ib.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) as completed
                FROM challenge_progress
                WHERE status = 'claimed'
                GROUP BY user_id
            ) cp_stats ON e.estudiante_id = cp_stats.user_id
            WHERE e.docente_id = $1
            GROUP BY c.id, c.nombre
            ORDER BY avg_xp DESC
        `;
        return executeQuery(query, [teacherId]);
    }

    /**
     * Obtiene tendencias semanales de la clase
     */
    static async getClassTrends(teacherId, courseId = null, weeks = 4) {
        let query = `
            SELECT
                DATE_TRUNC('week', cp.claimed_at) as week,
                COUNT(DISTINCT cp.user_id) as active_students,
                COUNT(*) as challenges_completed,
                SUM(cp.xp_earned) as xp_earned,
                AVG(EXTRACT(EPOCH FROM (cp.claimed_at - cp.started_at)) / 3600) as avg_completion_hours
            FROM challenge_progress cp
            JOIN inscripciones e ON cp.user_id = e.estudiante_id
            WHERE e.docente_id = $1
        `;
        const params = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            AND cp.claimed_at >= NOW() - INTERVAL '${weeks} weeks'
            GROUP BY DATE_TRUNC('week', cp.claimed_at)
            ORDER BY week
        `;
        return executeQuery(query, params);
    }
}

module.exports = TeacherAnalyticsDAO;
