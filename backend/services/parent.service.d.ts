/**
 * 👨‍👩‍👧 PARENT SERVICE - TypeScript
 * Lógica de negocio para el portal de padres
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface ParentLoginResponse {
    token: string;
    parent: {
        id: number;
        nombre: string;
        email: string;
    };
}
declare class ParentService {
    /**
     * Autenticación de padres
     */
    login(email: string, password: string): Promise<ParentLoginResponse>;
    /**
     * Registro de nuevos padres
     */
    register(data: any): Promise<any>;
    /**
     * Obtener Dashboard completo
     */
    getDashboard(parentId: number): Promise<any>;
    /**
     * Obtener calificaciones de un estudiante (con verificación de permisos)
     */
    getStudentGrades(parentId: number, studentId: number, filters?: any): Promise<any>;
    /**
     * Obtener asistencia de un estudiante
     */
    getStudentAttendance(parentId: number, studentId: number, filters?: any): Promise<any>;
    getAllParents(): Promise<any>;
    createParentAdmin(data: any): Promise<any>;
    updateParent(id: number, data: any): Promise<any>;
    deleteParent(id: number): Promise<any>;
}
declare const _default: ParentService;
export default _default;
//# sourceMappingURL=parent.service.d.ts.map