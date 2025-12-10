/**
 * Obtener instancia del servicio
 */
export function getGoogleClassroomService(): any;
export class GoogleClassroomService {
    initialized: boolean;
    /**
     * Inicializar el servicio
     */
    initialize(): Promise<this>;
    /**
     * Sincronizar datos de Google Classroom
     */
    syncCourses(userData: any, courses: any): Promise<{
        success: boolean;
        message: string;
        courses: any;
        timestamp: string;
    }>;
    /**
     * Obtener cursos del usuario
     */
    getUserCourses(userId: any): Promise<{
        success: boolean;
        courses: any[];
        timestamp: string;
    }>;
    /**
     * Obtener tareas de un curso
     */
    getCourseAssignments(courseId: any): Promise<{
        success: boolean;
        assignments: any[];
        timestamp: string;
    }>;
}
//# sourceMappingURL=googleClassroomService.d.ts.map