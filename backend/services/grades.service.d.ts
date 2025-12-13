/**
 * 🎓 GRADES SERVICE - TypeScript
 * Lógica de negocio para gestión de calificaciones.
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface CaptureGradeData {
    estudianteId: number;
    materiaId: number;
    periodoEvaluacionId: number;
    calificacion: number;
    observaciones?: string;
    faltas?: number;
}
export interface UserContext {
    id: number;
    role: string;
}
export interface ReportCardSubject {
    materia: string;
    clave: string;
    semestre: string;
    creditos: number;
    parciales: {
        [periodo: string]: number;
    };
    promedio_final?: string;
    docente?: string;
}
export interface ReportCard {
    estudianteId: number;
    cicloEscolar: string;
    materias: ReportCardSubject[];
}
declare class GradesService {
    /**
     * Capturar calificación
     * Valida reglas de negocio: periodo abierto, rango de calificación, unicidad.
     */
    captureGrade(data: CaptureGradeData, user: UserContext): Promise<any>;
    /**
     * Obtener boleta de calificaciones
     */
    getStudentReportCard(estudianteId: number, cicloEscolar: string): Promise<ReportCard>;
    /**
     * Obtener listado de periodos de evaluación
     */
    getAllPeriods(): Promise<any[]>;
    /**
     * Obtener materias asignadas a un docente
     */
    getTeacherSubjects(docenteId: number): Promise<any[]>;
    /**
     * Obtener estudiantes inscritos en una materia para captura
     */
    getSubjectStudents(materiaId: number): Promise<any[]>;
    /**
     * Obtener calificaciones de un grupo para un periodo específico
     */
    getGradesByGroup(materiaId: number, periodoId: number): Promise<any[]>;
}
declare const _default: GradesService;
export default _default;
//# sourceMappingURL=grades.service.d.ts.map