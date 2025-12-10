/**
 * 🔐 ADMIN DAO - TypeScript
 * Funciones administrativas para dashboard
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
import { UserRow } from './user.dao';
export interface TeacherListItem {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email?: string;
    especialidad?: string;
}
export interface StudentListItem {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email?: string;
    grado?: string;
    grupo?: string;
}
export interface ParentListItem {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
    fecha_registro: Date;
    activo: boolean;
}
declare class AdminDAO {
    static getTeachers(): Promise<TeacherListItem[]>;
    static getStudents(): Promise<StudentListItem[]>;
    static getParents(): Promise<ParentListItem[]>;
    static getUserById(id: number): Promise<UserRow | null>;
}
export default AdminDAO;
//# sourceMappingURL=admin.dao.d.ts.map