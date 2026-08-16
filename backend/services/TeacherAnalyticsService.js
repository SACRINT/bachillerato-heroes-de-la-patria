/**
 * 📊 TEACHER ANALYTICS SERVICE
 * Analíticas avanzadas para docentes
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar TeacherAnalyticsDAO
 * - Sin SQL directo en el servicio
 */

const TeacherAnalyticsDAO = require('../data/teacher-analytics.dao.js');

class TeacherAnalyticsService {

    // =====================================
    // ANALÍTICAS DE ESTUDIANTES
    // =====================================

    /**
     * Obtiene resumen general de la clase
     */
    async getClassOverview(teacherId, courseId = null) {
        return TeacherAnalyticsDAO.getClassOverview(teacherId, courseId);
    }

    /**
     * Obtiene lista de estudiantes con métricas
     */
    async getStudentsWithMetrics(teacherId, options = {}) {
        return TeacherAnalyticsDAO.getStudentsWithMetrics(teacherId, options);
    }

    /**
     * Obtiene detalles de un estudiante específico
     */
    async getStudentDetails(teacherId, studentId) {
        // Verificar acceso
        const hasAccess = await TeacherAnalyticsDAO.checkTeacherAccess(teacherId, studentId);
        if (!hasAccess) {
            throw new Error('No tienes acceso a este estudiante');
        }

        // Obtener datos base
        const student = await TeacherAnalyticsDAO.getStudentFullData(studentId);
        if (!student) return null;

        // Agregar estadísticas adicionales (en paralelo para eficiencia)
        const [challenges, recentActivity, badges, weeklyProgress] = await Promise.all([
            TeacherAnalyticsDAO.getStudentChallengeStats(studentId),
            TeacherAnalyticsDAO.getStudentRecentActivity(studentId),
            TeacherAnalyticsDAO.getStudentBadges(studentId),
            TeacherAnalyticsDAO.getStudentWeeklyProgress(studentId)
        ]);

        student.challenges = challenges;
        student.recentActivity = recentActivity;
        student.badges = badges;
        student.weeklyProgress = weeklyProgress;

        return student;
    }

    /**
     * Obtiene estadísticas de retos del estudiante
     */
    async getStudentChallengeStats(studentId) {
        return TeacherAnalyticsDAO.getStudentChallengeStats(studentId);
    }

    /**
     * Obtiene actividad reciente del estudiante
     */
    async getStudentRecentActivity(studentId, limit = 10) {
        return TeacherAnalyticsDAO.getStudentRecentActivity(studentId, limit);
    }

    /**
     * Obtiene badges del estudiante
     */
    async getStudentBadges(studentId) {
        return TeacherAnalyticsDAO.getStudentBadges(studentId);
    }

    /**
     * Obtiene progreso semanal del estudiante
     */
    async getStudentWeeklyProgress(studentId) {
        return TeacherAnalyticsDAO.getStudentWeeklyProgress(studentId);
    }

    // =====================================
    // REPORTES AGREGADOS
    // =====================================

    /**
     * Genera reporte de progreso de la clase
     */
    async generateClassProgressReport(teacherId, courseId, dateRange = '30d') {
        const days = parseInt(dateRange) || 30;

        // Ejecutar todas las queries en paralelo
        const [levelDistribution, dailyActivity, topPerformers, popularChallenges] = await Promise.all([
            TeacherAnalyticsDAO.getLevelDistribution(teacherId, courseId),
            TeacherAnalyticsDAO.getDailyActivity(teacherId, courseId, days),
            this.getStudentsWithMetrics(teacherId, { courseId, sortBy: 'xp', limit: 5 }),
            TeacherAnalyticsDAO.getPopularChallenges(teacherId, courseId, 5)
        ]);

        return {
            levelDistribution,
            dailyActivity,
            topPerformers,
            popularChallenges,
            generatedAt: new Date(),
            dateRange: `${days} días`
        };
    }

    /**
     * Obtiene alertas sobre estudiantes
     */
    async getStudentAlerts(teacherId, courseId = null) {
        const alerts = [];

        // Obtener todas las alertas en paralelo
        const [brokenStreaks, inactive, highPerformers] = await Promise.all([
            TeacherAnalyticsDAO.getBrokenStreaks(teacherId, courseId),
            TeacherAnalyticsDAO.getInactiveStudents(teacherId, courseId),
            TeacherAnalyticsDAO.getHighPerformers(teacherId, courseId)
        ]);

        // Procesar streaks rotos
        brokenStreaks.forEach(s => {
            alerts.push({
                type: 'streak_broken',
                severity: 'warning',
                student: s,
                message: `${s.nombre} perdió su racha de ${s.previous_streak} días`
            });
        });

        // Procesar inactivos
        inactive.forEach(s => {
            alerts.push({
                type: 'inactive',
                severity: 'info',
                student: s,
                message: `${s.nombre} no ha tenido actividad en 7+ días`
            });
        });

        // Procesar destacados
        highPerformers.forEach(s => {
            alerts.push({
                type: 'high_performer',
                severity: 'success',
                student: s,
                message: `${s.nombre} completó ${s.recent_completions} retos esta semana`
            });
        });

        // Ordenar por severidad
        return alerts.sort((a, b) => {
            const severityOrder = { success: 3, warning: 2, info: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    }

    // =====================================
    // COMPARATIVAS
    // =====================================

    /**
     * Compara rendimiento entre cursos
     */
    async compareCourses(teacherId) {
        return TeacherAnalyticsDAO.compareCourses(teacherId);
    }

    /**
     * Obtiene tendencias de la clase
     */
    async getClassTrends(teacherId, courseId, weeks = 4) {
        return TeacherAnalyticsDAO.getClassTrends(teacherId, courseId, weeks);
    }
}

module.exports = new TeacherAnalyticsService();
