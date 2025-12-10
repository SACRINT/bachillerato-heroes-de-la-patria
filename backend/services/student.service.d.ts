/**
 * Student Service - TypeScript
 * Capa de servicios para gestión de estudiantes
 * Separa la lógica de negocio de las rutas
 * GDPR Compliant - Logging condicional
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface StudentServiceFilters {
    role?: string;
    status?: string;
    search?: string;
    grado?: string;
    grupo?: string;
    [key: string]: any;
}
export interface PaginationOptions {
    page: number;
    limit: number;
}
declare class StudentService {
    /**
     * Obtener lista de estudiantes con filtros opcionales
     */
    getStudents(filters?: StudentServiceFilters): Promise<any[]>;
    /**
     * Obtener un estudiante por ID
     */
    getStudentById(id: number): Promise<any>;
    /**
     * Crear un nuevo estudiante
     */
    createStudent(data: any): Promise<any>;
    /**
     * Actualizar datos de un estudiante
     */
    updateStudent(id: number, data: any): Promise<any>;
    /**
     * Eliminar un estudiante
     */
    deleteStudent(id: number): Promise<boolean>;
    /**
     * Obtener calificaciones de un estudiante
     */
    getStudentGrades(studentId: number): Promise<any[]>;
    /**
     * Obtener asistencia de un estudiante
     */
    getStudentAttendance(studentId: number): Promise<any[]>;
    /**
     * Obtener estadísticas de estudiantes
     */
    getStats(filters?: any): Promise<any>;
    /**
     * Obtener todos los estudiantes con paginación
     */
    getAll(filters?: StudentServiceFilters, pagination?: PaginationOptions): Promise<any>;
    /**
     * Validar datos de estudiante
     */
    private _validateStudentData;
}
declare const _default: StudentService;
export default _default;
//# sourceMappingURL=student.service.d.ts.map