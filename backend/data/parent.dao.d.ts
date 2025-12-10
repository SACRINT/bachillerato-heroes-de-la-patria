/**
 * 👨‍👩‍👧 PARENT DAO - TypeScript
 * Gestión de padres y portal familiar
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface ParentRow {
    id: number;
    nombre: string;
    email: string;
    password_hash: string;
    telefono?: string;
    activo: boolean;
    email_verified?: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface ParentCreateData {
    nombre?: string;
    nombre_completo?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    email: string;
    password_hash: string;
}
export interface ParentUpdateData {
    [key: string]: any;
}
export interface StudentSummary {
    id: number;
    matricula: string;
    nombre_completo: string;
    grado: string;
    especialidad?: string;
}
export interface ParentStudentPermission {
    parent_id: number;
    student_id: number;
    ver_calificaciones?: boolean;
    ver_asistencia?: boolean;
}
export interface PaymentsSummary {
    count: number;
    total: number;
}
declare class ParentDAO {
    static create(data: ParentCreateData): Promise<Pick<ParentRow, 'id' | 'nombre' | 'email'>>;
    static findById(id: number): Promise<ParentRow | undefined>;
    static findByEmail(email: string): Promise<ParentRow | undefined>;
    static update(id: number, data: ParentUpdateData): Promise<Pick<ParentRow, 'id' | 'nombre' | 'email' | 'updated_at'> | null>;
    static delete(id: number): Promise<boolean>;
    static findAll(): Promise<ParentRow[]>;
    static getStudentsByParentId(parentId: number): Promise<StudentSummary[]>;
    static checkPermission(parentId: number, studentId: number): Promise<ParentStudentPermission | undefined>;
    static countUnreadNotifications(parentId: number): Promise<number>;
    static countUnreadMessages(parentId: number): Promise<number>;
    static getPendingPaymentsSummary(parentId: number): Promise<PaymentsSummary>;
}
export default ParentDAO;
//# sourceMappingURL=parent.dao.d.ts.map