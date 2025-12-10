/**
 * 👨‍🎓 STUDENT DAO - TypeScript
 * Data Access Object para estudiantes
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface StudentRow {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento: Date;
    curp: string;
    grado: string;
    grupo: string;
    turno: 'matutino' | 'vespertino';
    status: 'activo' | 'inactivo' | 'baja';
    fecha_inscripcion: Date;
    usuario_id?: number;
    created_at: Date;
    updated_at: Date;
}
export interface StudentFilters {
    grado?: string;
    grupo?: string;
    turno?: string;
    status?: string;
    search?: string;
}
export interface StudentCreateData {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    telefono?: string;
    fecha_nacimiento: Date | string;
    curp: string;
    grado: string;
    grupo: string;
    turno?: string;
    status?: string;
    fecha_inscripcion?: Date;
}
export interface StudentUpdateData extends Partial<StudentCreateData> {
}
declare class StudentDAO {
    static get(id: number): Promise<StudentRow | null>;
    static list(filters?: StudentFilters, limit?: number, offset?: number): Promise<StudentRow[]>;
    static count(filters?: StudentFilters): Promise<number>;
    static getByEmail(email: string): Promise<StudentRow | null>;
    static getByCURP(curp: string): Promise<StudentRow | null>;
    static create(data: StudentCreateData): Promise<StudentRow>;
    static update(id: number, data: StudentUpdateData): Promise<StudentRow>;
    static delete(id: number): Promise<boolean>;
    static hardDelete(id: number): Promise<boolean>;
    static getByGroup(grado: string, grupo: string): Promise<StudentRow[]>;
    static getByUserId(usuarioId: number): Promise<StudentRow | null>;
}
export default StudentDAO;
//# sourceMappingURL=student.dao.d.ts.map