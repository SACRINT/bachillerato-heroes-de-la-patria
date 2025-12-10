/**
 * 🤖 PREDICTIVE ANALYTICS DAO - TypeScript
 * Data Access Object para análisis predictivo
 * Abstrae todas las queries SQL de PredictiveAnalyticsService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface StudentMetric {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    semestre: number;
    promedio: number;
    status_academico: string;
    total_calificaciones: number;
    promedio_calculado: number;
    materias_reprobadas: number;
    total_asistencias: number;
    asistencias_presentes: number;
    promedio_actual?: number;
    materias_bajas?: number;
}
export interface TrendMetric {
    periodo: Date;
    promedio?: number;
    total_calificaciones?: number;
    total?: number;
    presentes?: number;
    porcentaje?: number;
    valor?: number;
}
export interface WeakSubject {
    materia: string;
    promedio: number;
}
export interface Anomaly {
    id: number;
    matricula: string;
    nombre: string;
    calificacion?: number;
    materia_id?: number;
    materia?: string;
    fecha_registro?: Date;
    faltas_consecutivas?: number;
}
declare class PredictiveAnalyticsDAO {
    static getStudentsWithMetrics(): Promise<StudentMetric[]>;
    static getGradeTrends(granularidad: string, periodo: number): Promise<TrendMetric[]>;
    static getAttendanceTrends(granularidad: string, periodo: number): Promise<TrendMetric[]>;
    static getStudentWithGrades(estudianteId: number): Promise<StudentMetric | null>;
    static getWeakSubjects(estudianteId: number): Promise<WeakSubject[]>;
    static getGradeAnomalies(): Promise<Anomaly[]>;
    static getAttendanceAnomalies(): Promise<Anomaly[]>;
    static getGradeHistory(): Promise<TrendMetric[]>;
    static getEnrollmentHistory(): Promise<TrendMetric[]>;
}
export default PredictiveAnalyticsDAO;
//# sourceMappingURL=predictive-analytics.dao.d.ts.map