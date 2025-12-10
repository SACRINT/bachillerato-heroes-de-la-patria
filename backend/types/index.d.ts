/**
 * 🏢 Base Types for BGE Heroes de la Patria Backend
 * @description Core type definitions for the school management system
 * @version 1.0.0
 */
export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number;
}
export interface User {
    id: number;
    email: string;
    password_hash: string;
    nombre_completo: string;
    rol: 'admin' | 'docente' | 'estudiante' | 'padre';
    activo: boolean;
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface AuthPayload {
    userId: number;
    email: string;
    rol: string;
    tenantId?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface TokenResponse {
    token: string;
    user: Omit<User, 'password_hash'>;
}
export interface Student {
    id: number;
    matricula: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email?: string;
    fecha_nacimiento: Date;
    grado: number;
    grupo: string;
    turno: 'matutino' | 'vespertino';
    activo: boolean;
    created_at: Date;
}
export interface Grade {
    id: number;
    student_id: number;
    materia_id: number;
    periodo_id: number;
    calificacion: number;
    observaciones?: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
export interface Subject {
    id: number;
    nombre: string;
    clave: string;
    creditos: number;
    activo: boolean;
}
export interface GradePeriod {
    id: number;
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    activo: boolean;
}
export interface StudentGradeReport {
    student: Student;
    grades: (Grade & {
        materia_nombre: string;
        periodo_nombre: string;
    })[];
    average: number;
}
export interface Parent {
    id: number;
    nombre_completo: string;
    email: string;
    password_hash: string;
    telefono?: string;
    activo: boolean;
    email_verified: boolean;
    created_at: Date;
}
export interface ParentStudent {
    parent_id: number;
    student_id: number;
    relacion: 'padre' | 'madre' | 'tutor';
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface Tenant {
    id: string;
    nombre: string;
    slug: string;
    config: TenantConfig;
    activo: boolean;
}
export interface TenantConfig {
    school_name: string;
    school_short_name: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    address?: string;
    phone?: string;
    email?: string;
}
//# sourceMappingURL=index.d.ts.map