export = GradeDAO;
declare class GradeDAO {
    /**
     * Obtener calificación por ID
     * @param {number} id
     */
    static get(id: number): Promise<any>;
    /**
     * Verificar existencia de calificación (Unique constraint check)
     */
    static exists(estudianteId: any, materiaId: any, periodoEvaluacionId: any): Promise<any>;
    /**
     * Crear calificación
     */
    static create(data: any): Promise<any>;
    /**
     * Actualizar calificación
     */
    static update(id: any, data: any): Promise<any>;
    /**
     * Listar calificaciones con filtros y joins completos
     */
    static list(filters?: {}, limit?: number, offset?: number): Promise<any[]>;
    /**
     * Obtener calificaciones de un estudiante (Vista detallada para historial/boleta)
     */
    static getByStudent(estudianteId: any, filters?: {}): Promise<any[]>;
    /**
     * Calcular promedio de estudiante en un ciclo/periodo
     */
    static getAverage(estudianteId: any, cicloEscolar: any): Promise<number>;
}
//# sourceMappingURL=grade.dao.d.ts.map