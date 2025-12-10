/**
 * 📊 REPORT GENERATOR DAO - TypeScript
 * Data Access Object para generación de reportes académicos
 * Abstrae todas las queries SQL de ReportGeneratorService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface StudentReportData {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    semestre: number;
    especialidad: string;
    promedio: number;
}
export interface TeacherReportData {
    id: number;
    nombre: string;
    apellido_paterno: string;
    especialidad: string;
    email: string;
}
export interface StudentGrade {
    materia: string;
    parcial: number;
    calificacion: number;
    observaciones: string;
}
export interface GroupStats {
    total_estudiantes: number;
    promedio_general: number;
    total_calificaciones: number;
    aprobadas: number;
    reprobadas: number;
}
export interface TopStudent {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    promedio: number;
}
export interface SubjectStats {
    materia: string;
    promedio: number;
    total: number;
}
export interface GradeTrend {
    mes?: Date;
    periodo?: Date;
    promedio: number;
    total: number;
}
export interface EnrollmentTrend {
    mes: Date;
    total: number;
}
export interface GradeDistribution {
    rango: string;
    total: number;
}
export interface TeacherStats {
    total_calificaciones: number;
    total_estudiantes: number;
    promedio: number;
    aprobados: number;
    reprobados: number;
}
export interface ExecutiveKPIs {
    estudiantes_activos: number;
    total_docentes: number;
    promedio_mes: number;
    tasa_aprobacion: number;
}
export interface MonthlyComparison {
    actual: number;
    anterior: number;
}
declare class ReportGeneratorDAO {
    static getStudentById(estudianteId: number): Promise<StudentReportData | null>;
    static getStudentGrades(estudianteId: number): Promise<StudentGrade[]>;
    static getGroupStats(whereClause: string, params: any[]): Promise<GroupStats | null>;
    static getTopStudents(whereClause: string, params: any[]): Promise<TopStudent[]>;
    static getGradesBySubject(whereClause: string, params: any[]): Promise<SubjectStats[]>;
    static getMonthlyGradeTrend(periodos: number): Promise<GradeTrend[]>;
    static getEnrollmentTrend(periodos: number): Promise<EnrollmentTrend[]>;
    static getGradeDistribution(periodos: number): Promise<GradeDistribution[]>;
    static getTeacherById(docenteId: number): Promise<TeacherReportData | null>;
    static getTeacherStats(docenteId: number): Promise<TeacherStats | null>;
    static getTeacherGradesBySubject(docenteId: number): Promise<SubjectStats[]>;
    static getExecutiveKPIs(): Promise<ExecutiveKPIs>;
    static getMonthlyComparison(): Promise<MonthlyComparison>;
    static getLowPerformersCount(): Promise<number>;
}
export default ReportGeneratorDAO;
//# sourceMappingURL=report-generator.dao.d.ts.map