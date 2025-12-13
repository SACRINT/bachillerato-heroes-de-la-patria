/**
 * 📊 GRADES DAO - TypeScript
 * Data Access Object para calificaciones
 *
 * Refactorizado: 06 Diciembre 2025 (Migración TypeScript)
 */
export interface GradeRow {
    id: number;
    estudiante_id: number;
    materia_id: number;
    calificacion: number;
    tipo_evaluacion: string;
    periodo_academico: string;
    observaciones?: string;
    docente_id: number;
    created_at: Date;
    updated_at?: Date;
    estudiante_nombre?: string;
    apellido_paterno?: string;
    materia_nombre?: string;
}
export interface GradeGetAllOptions {
    estudianteId?: number;
    materiaId?: number;
    periodo?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}
export interface GradeCreateData {
    estudianteId: number;
    materiaId: number;
    calificacion: number;
    tipoEvaluacion: string;
    periodoAcademico: string;
    observaciones?: string;
    docenteId: number;
}
export interface GradeUpdateData {
    calificacion?: number;
    observaciones?: string;
    tipoEvaluacion?: string;
}
export interface GradeStats {
    total: string;
    promedio: string | null;
    min: number | null;
    max: number | null;
    desviacion: string | null;
}
export interface GradesPaginatedResult {
    rows: GradeRow[];
    total: number;
}
declare class GradesDAO {
    static getAll(options: GradeGetAllOptions): Promise<GradesPaginatedResult>;
    static getById(id: number): Promise<GradeRow | undefined>;
    static getByStudent(estudianteId: number): Promise<GradeRow[]>;
    static create(data: GradeCreateData): Promise<GradeRow>;
    static update(id: number, data: GradeUpdateData): Promise<GradeRow | undefined>;
    static delete(id: number): Promise<{
        id: number;
    } | undefined>;
    static getStats(options: Partial<GradeGetAllOptions>): Promise<GradeStats>;
    static bulkCreate(grades: GradeCreateData[]): Promise<GradeRow[]>;
    static exists(estudianteId: number, materiaId: number, periodo: string | number): Promise<GradeRow | null>;
}
export default GradesDAO;
//# sourceMappingURL=grades.dao.d.ts.map