/**
 * 👨‍🏫 TEACHER DAO - TypeScript
 * Capa de acceso a datos para Docentes.
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface TeacherRow {
    id: number;
    usuario_id: number;
    numero_empleado: string;
    especialidad: string;
    anos_experiencia: number;
    grado_academico?: string;
    tipo_contrato: string;
    fecha_ingreso: Date;
    telefono_oficina?: string;
    horario_atencion?: string;
    visible_directorio: boolean;
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    email?: string;
    fecha_creacion?: Date;
    ultimo_acceso?: Date;
}
export interface TeacherFilters {
    especialidad?: string;
    tipo_contrato?: string;
    search?: string;
}
export interface TeacherCreateData {
    numero_empleado: string;
    especialidad: string;
    anos_experiencia?: number;
    grado_academico?: string;
    tipo_contrato: string;
    fecha_ingreso?: Date;
    telefono_oficina?: string;
    horario_atencion?: string;
    visible_directorio?: boolean;
}
export interface TeacherUpdateData {
    especialidad?: string;
    anos_experiencia?: number;
    grado_academico?: string;
    tipo_contrato?: string;
    telefono_oficina?: string;
    horario_atencion?: string;
    visible_directorio?: boolean;
}
export interface TeacherSubject {
    materia_id: number;
    materia_nombre: string;
    grupo: string;
    semestre: string;
    horario: string;
    aula: string;
    total_estudiantes: number;
}
export interface SpecialtyStats {
    especialidad: string;
    total_docentes: number;
    docentes_publicos: number;
}
export interface PublicTeacher {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    especialidad: string;
    anos_experiencia: number;
    grado_academico?: string;
    telefono_oficina?: string;
    horario_atencion?: string;
}
declare class TeacherDAO {
    static get(id: number): Promise<TeacherRow | null>;
    static getByEmail(email: string): Promise<TeacherRow | null>;
    static getByEmployeeNumber(numero_empleado: string): Promise<TeacherRow | null>;
    static list(filters?: TeacherFilters, limit?: number, offset?: number): Promise<TeacherRow[]>;
    static count(filters?: TeacherFilters): Promise<number>;
    static create(userId: number, data: TeacherCreateData): Promise<TeacherRow>;
    static update(id: number, data: TeacherUpdateData): Promise<TeacherRow | null>;
    static deactivate(id: number): Promise<boolean>;
    static getSubjects(teacherId: number): Promise<TeacherSubject[]>;
    static getSchedule(teacherId: number): Promise<TeacherSubject[]>;
    static getSpecialties(): Promise<SpecialtyStats[]>;
    static getPublicDirectory(especialidadFilter?: string | null): Promise<PublicTeacher[]>;
}
export default TeacherDAO;
//# sourceMappingURL=teacher.dao.d.ts.map