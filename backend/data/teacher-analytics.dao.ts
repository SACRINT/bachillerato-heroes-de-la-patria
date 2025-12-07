/**
 * 📊 TEACHER ANALYTICS DAO - TypeScript
 * Data Access Object para analíticas de docentes
 * Abstrae todas las queries SQL de TeacherAnalyticsService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface ClassOverviewResult {
    total_students: number;
    advanced_students: number;
    avg_xp: number;
    avg_level: number;
    avg_challenges_completed: number;
}

export interface StudentMetric {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    level: number;
    xp: number;
    iacoins: number;
    challenges_completed: number;
    current_streak: number;
    ai_generations?: number;
    level_title?: string;
    level_icon?: string;
    avatar_url?: string;
}

export interface StudentFullData {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    joined_at: Date;
    level: number;
    experience_points: number;
    balance: number;
    total_earned: number;
    total_spent: number;
    level_title: string;
    level_icon: string;
    bio?: string;
    avatar_url?: string;
}

export interface ChallengeStats {
    completed: number;
    in_progress: number;
    total_coins: number;
    total_xp: number;
    avg_completion_hours: number;
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: Date;
    value: number;
}

export interface StudentBadge {
    name: string;
    icon: string;
    color: string;
    rarity: string;
    earned_at: Date;
}

export interface WeeklyProgress {
    day: Date;
    xp_earned: number;
    challenges: number;
}

export interface LevelDistribution {
    level: number;
    title: string;
    count: number;
}

export interface DailyActivity {
    day: Date;
    active_users: number;
    total_xp: number;
}

export interface PopularChallenge {
    title: string;
    category: string;
    completions: number;
}

export interface BrokenStreakStudent {
    id: number;
    nombre: string;
    apellido_paterno: string;
    previous_streak: number;
    last_activity_date: Date;
}

export interface InactiveStudent {
    id: number;
    nombre: string;
    apellido_paterno: string;
    last_activity: Date;
}

export interface HighPerformer {
    id: number;
    nombre: string;
    apellido_paterno: string;
    recent_completions: number;
}

export interface CourseComparison {
    course_id: number;
    course_name: string;
    students: number;
    avg_level: number;
    avg_xp: number;
    total_challenges: number;
}

export interface ClassTrend {
    week: Date;
    active_students: number;
    challenges_completed: number;
    xp_earned: number;
    avg_completion_hours: number;
}

// =====================================================
// TEACHER ANALYTICS DAO CLASS
// =====================================================

class TeacherAnalyticsDAO {

    // ==========================================
    // RESUMEN DE CLASE
    // ==========================================

    /**
     * Obtiene resumen general de la clase
     */
    static async getClassOverview(teacherId: number, courseId: number | null = null): Promise<ClassOverviewResult> {
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

        const params: any[] = [teacherId];
        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        const result = await executeQuery(query, params);
        if (!result[0]) {
            return { total_students: 0, advanced_students: 0, avg_xp: 0, avg_level: 0, avg_challenges_completed: 0 };
        }
        const row = result[0];
        return {
            total_students: parseInt(row.total_students),
            advanced_students: parseInt(row.advanced_students),
            avg_xp: parseFloat(row.avg_xp) || 0,
            avg_level: parseFloat(row.avg_level) || 0,
            avg_challenges_completed: parseFloat(row.avg_challenges_completed) || 0
        };
    }

    // ==========================================
    // MÉTRICAS DE ESTUDIANTES
    // ==========================================

    /**
     * Obtiene lista de estudiantes con métricas
     */
    static async getStudentsWithMetrics(teacherId: number, options: { courseId?: number; sortBy?: string; sortOrder?: string; limit?: number; offset?: number } = {}): Promise<StudentMetric[]> {
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

        const params: any[] = [teacherId];
        let paramIndex = 2;

        if (courseId) {
            query += ` AND e.curso_id = $${paramIndex++}`;
            params.push(courseId);
        }

        const sortFields: Record<string, string> = {
            name: 'u.nombre',
            level: 'ib.level', // Removed DESC from map as it's appended later if needed, but original hardcoded DESC in value? No, original had map values with potential direction, but sortOrder is separate. Original map: {level: 'ib.level DESC'}. If user passes ASC, it becomes 'ib.level DESC ASC' which is invalid? Let's fix this logic.
            xp: 'ib.experience_points',
            challenges: 'cp_stats.completed',
            streak: 'us.current_streak'
        };

        // Fix: Use base field and append sortOrder. If original required specific direction for some fields, we should respect that or default.
        // Original: ` ORDER BY ${sortFields[sortBy] || 'u.nombre'} ${sortOrder}`;
        // If map has 'ib.level DESC' and sortOrder is 'ASC', query is '... ib.level DESC ASC'. PostgreSQL might error or ignore. 
        // Let's assume sortOrder overrides or is applied to base field. 

        const fieldMap: Record<string, string> = {
            name: 'u.nombre',
            level: 'level',
            xp: 'xp',
            challenges: 'challenges_completed',
            streak: 'current_streak'
        };

        const sortField = fieldMap[sortBy] || 'u.nombre';
        query += ` ORDER BY ${sortField} ${sortOrder}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Verifica acceso del docente al estudiante
     */
    static async checkTeacherAccess(teacherId: number, studentId: number): Promise<boolean> {
        const result = await executeQuery(
            `SELECT 1 FROM inscripciones WHERE docente_id = $1 AND estudiante_id = $2`,
            [teacherId, studentId]
        );
        return result.length > 0;
    }

    /**
     * Obtiene datos completos del estudiante
     */
    static async getStudentFullData(studentId: number): Promise<StudentFullData | undefined> {
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
    static async getStudentChallengeStats(studentId: number): Promise<ChallengeStats | undefined> {
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
        const row = result[0];
        if (!row) return undefined;
        return {
            completed: parseInt(row.completed),
            in_progress: parseInt(row.in_progress),
            total_coins: parseInt(row.total_coins) || 0,
            total_xp: parseInt(row.total_xp) || 0,
            avg_completion_hours: parseFloat(row.avg_completion_hours) || 0
        };
    }

    /**
     * Obtiene actividad reciente del estudiante
     */
    static async getStudentRecentActivity(studentId: number, limit: number = 10): Promise<RecentActivity[]> {
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
    static async getStudentBadges(studentId: number, limit: number = 10): Promise<StudentBadge[]> {
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
    static async getStudentWeeklyProgress(studentId: number): Promise<WeeklyProgress[]> {
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
        const result = await executeQuery(query, [studentId]);
        return result.map((row: any) => ({
            day: row.day,
            xp_earned: parseInt(row.xp_earned),
            challenges: parseInt(row.challenges)
        }));
    }

    // ==========================================
    // REPORTES Y DISTRIBUCIONES
    // ==========================================

    /**
     * Obtiene distribución de niveles de la clase
     */
    static async getLevelDistribution(teacherId: number, courseId: number | null = null): Promise<LevelDistribution[]> {
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
        const params: any[] = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += ` GROUP BY ib.level, ld.title ORDER BY ib.level`;
        const result = await executeQuery(query, params);
        return result.map((row: any) => ({
            ...row,
            count: parseInt(row.count)
        }));
    }

    /**
     * Obtiene actividad diaria de la clase
     */
    static async getDailyActivity(teacherId: number, courseId: number | null = null, days: number = 30): Promise<DailyActivity[]> {
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
        const params: any[] = [teacherId];
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
        const result = await executeQuery(query, params);
        return result.map((row: any) => ({
            day: row.day,
            active_users: parseInt(row.active_users),
            total_xp: parseInt(row.total_xp)
        }));
    }

    /**
     * Obtiene retos más populares completados
     */
    static async getPopularChallenges(teacherId: number, courseId: number | null = null, limit: number = 5): Promise<PopularChallenge[]> {
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
        const params: any[] = [teacherId];
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
        const result = await executeQuery(query, params);
        return result.map((row: any) => ({
            ...row,
            completions: parseInt(row.completions)
        }));
    }

    // ==========================================
    // ALERTAS
    // ==========================================

    /**
     * Obtiene estudiantes con streak roto
     */
    static async getBrokenStreaks(teacherId: number, courseId: number | null = null): Promise<BrokenStreakStudent[]> {
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
        const params: any[] = [teacherId];

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
    static async getInactiveStudents(teacherId: number, courseId: number | null = null, inactiveDays: number = 7): Promise<InactiveStudent[]> {
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
        const params: any[] = [teacherId];

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
    static async getHighPerformers(teacherId: number, courseId: number | null = null, minCompletions: number = 10): Promise<HighPerformer[]> {
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
        const params: any[] = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            AND cp.claimed_at >= NOW() - INTERVAL '7 days'
            GROUP BY u.id, u.nombre, u.apellido_paterno
            HAVING COUNT(*) >= ${minCompletions}
        `;
        const result = await executeQuery(query, params);
        return result.map((row: any) => ({
            ...row,
            recent_completions: parseInt(row.recent_completions)
        }));
    }

    // ==========================================
    // COMPARATIVAS
    // ==========================================

    /**
     * Compara rendimiento entre cursos
     */
    static async compareCourses(teacherId: number): Promise<CourseComparison[]> {
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
        const result = await executeQuery(query, [teacherId]);
        return result.map((row: any) => ({
            ...row,
            students: parseInt(row.students),
            avg_level: parseFloat(row.avg_level),
            avg_xp: parseFloat(row.avg_xp),
            total_challenges: parseInt(row.total_challenges)
        }));
    }

    /**
     * Obtiene tendencias semanales de la clase
     */
    static async getClassTrends(teacherId: number, courseId: number | null = null, weeks: number = 4): Promise<ClassTrend[]> {
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
        const params: any[] = [teacherId];

        if (courseId) {
            query += ` AND e.curso_id = $2`;
            params.push(courseId);
        }

        query += `
            AND cp.claimed_at >= NOW() - INTERVAL '${weeks} weeks'
            GROUP BY DATE_TRUNC('week', cp.claimed_at)
            ORDER BY week
        `;
        const result = await executeQuery(query, params);
        return result.map((row: any) => ({
            week: row.week,
            active_students: parseInt(row.active_students),
            challenges_completed: parseInt(row.challenges_completed),
            xp_earned: parseInt(row.xp_earned),
            avg_completion_hours: parseFloat(row.avg_completion_hours)
        }));
    }
}

export default TeacherAnalyticsDAO;
module.exports = TeacherAnalyticsDAO;
