/**
 * 📊 TEACHER ANALYTICS DAO - TypeScript
 * Data Access Object para analíticas de docentes
 * Abstrae todas las queries SQL de TeacherAnalyticsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
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
declare class TeacherAnalyticsDAO {
    /**
     * Obtiene resumen general de la clase
     */
    static getClassOverview(teacherId: number, courseId?: number | null): Promise<ClassOverviewResult>;
    /**
     * Obtiene lista de estudiantes con métricas
     */
    static getStudentsWithMetrics(teacherId: number, options?: {
        courseId?: number;
        sortBy?: string;
        sortOrder?: string;
        limit?: number;
        offset?: number;
    }): Promise<StudentMetric[]>;
    /**
     * Verifica acceso del docente al estudiante
     */
    static checkTeacherAccess(teacherId: number, studentId: number): Promise<boolean>;
    /**
     * Obtiene datos completos del estudiante
     */
    static getStudentFullData(studentId: number): Promise<StudentFullData | undefined>;
    /**
     * Obtiene estadísticas de retos del estudiante
     */
    static getStudentChallengeStats(studentId: number): Promise<ChallengeStats | undefined>;
    /**
     * Obtiene actividad reciente del estudiante
     */
    static getStudentRecentActivity(studentId: number, limit?: number): Promise<RecentActivity[]>;
    /**
     * Obtiene badges del estudiante
     */
    static getStudentBadges(studentId: number, limit?: number): Promise<StudentBadge[]>;
    /**
     * Obtiene progreso semanal del estudiante
     */
    static getStudentWeeklyProgress(studentId: number): Promise<WeeklyProgress[]>;
    /**
     * Obtiene distribución de niveles de la clase
     */
    static getLevelDistribution(teacherId: number, courseId?: number | null): Promise<LevelDistribution[]>;
    /**
     * Obtiene actividad diaria de la clase
     */
    static getDailyActivity(teacherId: number, courseId?: number | null, days?: number): Promise<DailyActivity[]>;
    /**
     * Obtiene retos más populares completados
     */
    static getPopularChallenges(teacherId: number, courseId?: number | null, limit?: number): Promise<PopularChallenge[]>;
    /**
     * Obtiene estudiantes con streak roto
     */
    static getBrokenStreaks(teacherId: number, courseId?: number | null): Promise<BrokenStreakStudent[]>;
    /**
     * Obtiene estudiantes inactivos
     */
    static getInactiveStudents(teacherId: number, courseId?: number | null, inactiveDays?: number): Promise<InactiveStudent[]>;
    /**
     * Obtiene estudiantes destacados
     */
    static getHighPerformers(teacherId: number, courseId?: number | null, minCompletions?: number): Promise<HighPerformer[]>;
    /**
     * Compara rendimiento entre cursos
     */
    static compareCourses(teacherId: number): Promise<CourseComparison[]>;
    /**
     * Obtiene tendencias semanales de la clase
     */
    static getClassTrends(teacherId: number, courseId?: number | null, weeks?: number): Promise<ClassTrend[]>;
}
export default TeacherAnalyticsDAO;
//# sourceMappingURL=teacher-analytics.dao.d.ts.map