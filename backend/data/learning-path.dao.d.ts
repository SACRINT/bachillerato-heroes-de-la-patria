/**
 * 🛣️ LEARNING PATH DAO - TypeScript
 * Gestión de rutas de aprendizaje
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface LearningPath {
    id: number;
    title: string;
    description: string;
    subject: string;
    difficulty: string;
    estimated_hours: number;
    is_active: boolean;
    is_featured: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface PathProgress {
    id: number;
    user_id: number;
    path_id: number;
    status: string;
    current_module: number;
    current_topic: number;
    completed_topics: any;
    progress_percent: number;
    time_spent: number;
    sessions_completed: number;
    last_activity_at: Date;
    completed_at?: Date;
    title?: string;
    subject?: string;
    estimated_hours?: number;
}
export interface UpsertProgressInput {
    user_id: number;
    path_id: number;
    status: string;
    current_module: number;
    current_topic: number;
    completed_topics: number[];
    progress_percent: number;
    time_spent?: number;
    sessions_completed?: number;
    completed_at?: Date | null;
}
declare class LearningPathDAO {
    /**
     * Listar rutas disponibles
     */
    static findAll(filters?: {
        subject?: string;
        difficulty?: string;
        featured?: boolean;
    }, limit?: number, offset?: number): Promise<LearningPath[]>;
    /**
     * Obtener ruta por ID
     */
    static findById(id: number): Promise<LearningPath | undefined>;
    /**
     * Obtener progreso de usuario en una ruta
     */
    static getProgress(userId: number, pathId: number): Promise<PathProgress | undefined>;
    /**
     * Iniciar o actualizar progreso
     */
    static upsertProgress(data: UpsertProgressInput): Promise<PathProgress>;
    /**
     * Obtener rutas activas del usuario
     */
    static getUserPaths(userId: number): Promise<PathProgress[]>;
}
export default LearningPathDAO;
//# sourceMappingURL=learning-path.dao.d.ts.map