/**
 * 📚 SUBJECT DAO - TypeScript
 * Acceso a datos de Materias e Inscripciones
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface SubjectRow {
    id: number;
    nombre: string;
    clave: string;
    semestre: string;
    creditos: number;
    docente_id?: number;
    total_estudiantes?: number;
    docente_nombre?: string;
    docente_apellido?: string;
}
export interface StudentInSubject {
    estudiante_id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    inscripcion_id: number;
}
declare class SubjectDAO {
    static getByTeacher(docenteId: number, _cicloEscolar?: string): Promise<SubjectRow[]>;
    static getStudentsInSubject(materiaId: number): Promise<StudentInSubject[]>;
    static listAll(): Promise<SubjectRow[]>;
}
export default SubjectDAO;
//# sourceMappingURL=subject.dao.d.ts.map