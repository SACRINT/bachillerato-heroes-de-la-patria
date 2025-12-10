declare const _exports: TeacherAnalyticsService;
export = _exports;
declare class TeacherAnalyticsService {
    /**
     * Obtiene resumen general de la clase
     */
    getClassOverview(teacherId: any, courseId?: any): Promise<any>;
    /**
     * Obtiene lista de estudiantes con métricas
     */
    getStudentsWithMetrics(teacherId: any, options?: {}): Promise<any>;
    /**
     * Obtiene detalles de un estudiante específico
     */
    getStudentDetails(teacherId: any, studentId: any): Promise<any>;
    /**
     * Obtiene estadísticas de retos del estudiante
     */
    getStudentChallengeStats(studentId: any): Promise<any>;
    /**
     * Obtiene actividad reciente del estudiante
     */
    getStudentRecentActivity(studentId: any, limit?: number): Promise<any>;
    /**
     * Obtiene badges del estudiante
     */
    getStudentBadges(studentId: any): Promise<any>;
    /**
     * Obtiene progreso semanal del estudiante
     */
    getStudentWeeklyProgress(studentId: any): Promise<any>;
    /**
     * Genera reporte de progreso de la clase
     */
    generateClassProgressReport(teacherId: any, courseId: any, dateRange?: string): Promise<{
        levelDistribution: any;
        dailyActivity: any;
        topPerformers: any;
        popularChallenges: any;
        generatedAt: Date;
        dateRange: string;
    }>;
    /**
     * Obtiene alertas sobre estudiantes
     */
    getStudentAlerts(teacherId: any, courseId?: any): Promise<any[]>;
    /**
     * Compara rendimiento entre cursos
     */
    compareCourses(teacherId: any): Promise<any>;
    /**
     * Obtiene tendencias de la clase
     */
    getClassTrends(teacherId: any, courseId: any, weeks?: number): Promise<any>;
}
//# sourceMappingURL=TeacherAnalyticsService.d.ts.map