/**
 * 👨‍🏫 TEACHER SERVICE - TypeScript
 * Capa de servicios para gestión de docentes
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface TeacherData {
    id?: number;
    email: string;
    password?: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    numero_empleado: string;
    especialidad: string;
    tipo_contrato: 'base' | 'contrato' | 'honorarios';
    [key: string]: any;
}
export declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
declare class TeacherService {
    /**
     * Obtener todos los docentes con filtros
     */
    getAll(options?: any): Promise<any>;
    /**
     * Obtener docente por ID
     */
    getById(id: number): Promise<any>;
    /**
     * Crear nuevo docente
     */
    create(data: TeacherData, createdBy: number): Promise<any>;
    /**
     * Actualizar docente
     */
    update(id: number, data: any, updatedBy: number): Promise<any>;
    /**
     * Desactivar docente (soft delete)
     */
    deactivate(id: number, deactivatedBy: number): Promise<any>;
    /**
     * Obtener horario de un docente
     */
    getSchedule(teacherId: number): Promise<any>;
    /**
     * Obtener directorio público de docentes
     */
    getPublicDirectory(especialidad?: string | null): Promise<any>;
    /**
     * Obtener especialidades disponibles
     */
    getSpecialties(): Promise<any>;
    private _validateCreateData;
}
declare const _default: TeacherService;
export default _default;
//# sourceMappingURL=teacher.service.d.ts.map