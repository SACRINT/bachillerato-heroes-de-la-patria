declare const _exports: AITutorService;
export = _exports;
declare class AITutorService {
    aiService: any;
    tutorLevels: {
        level: number;
        xp: number;
        title: string;
    }[];
    subjects: string[];
    /**
     * Obtiene o crea perfil de aprendizaje
     */
    getOrCreateProfile(userId: any): Promise<any>;
    /**
     * Obtiene perfil con estadísticas completas
     */
    getProfileWithStats(userId: any): Promise<any>;
    /**
     * Actualiza perfil de aprendizaje
     */
    updateProfile(userId: any, profileData: any): Promise<any>;
    /**
     * Actualiza proficiencia por materia
     */
    updateSubjectProficiency(userId: any, subject: any, score: any): Promise<any>;
    /**
     * Calcula nivel del tutor
     */
    calculateLevel(xp: any): {
        xp: any;
        progress: number;
        nextLevel: {
            level: number;
            xp: number;
            title: string;
        };
        level: number;
        title: string;
    };
    /**
     * Inicia una sesión de tutoría
     */
    startSession(userId: any, sessionData: any): Promise<any>;
    /**
     * Agrega mensaje a la sesión
     */
    addMessage(sessionId: any, role: any, content: any): Promise<any>;
    /**
     * Finaliza una sesión
     */
    endSession(sessionId: any, sessionResults?: {}): Promise<any>;
    /**
     * Actualiza perfil después de sesión
     */
    updateProfileAfterSession(userId: any, session: any): Promise<void>;
    /**
     * Obtiene historial de sesiones
     */
    getSessionHistory(userId: any, options?: {}): Promise<any>;
    getSessionById(sessionId: any): Promise<any>;
    /**
     * Calcula dificultad adaptativa
     */
    calculateAdaptiveDifficulty(userId: any, subject: any): Promise<"medium" | "easy" | "hard">;
    /**
     * Obtiene rutas de aprendizaje disponibles
     */
    getLearningPaths(options?: {}): Promise<any>;
    /**
     * Obtiene ruta por ID con progreso del usuario
     */
    getPathById(pathId: any, userId?: any): Promise<any>;
    /**
     * Inicia una ruta de aprendizaje
     */
    startLearningPath(userId: any, pathId: any): Promise<any>;
    /**
     * Actualiza progreso en ruta
     */
    updatePathProgress(userId: any, pathId: any, progressData: any): Promise<any>;
    /**
     * Obtiene rutas en progreso del usuario
     */
    getUserPaths(userId: any): Promise<any>;
    /**
     * Genera recomendaciones para el usuario
     */
    generateRecommendations(userId: any): Promise<({
        type: string;
        title: string;
        description: string;
        reason: string;
        priority: number;
        confidence: number;
        reference_type?: undefined;
        reference_id?: undefined;
    } | {
        type: string;
        title: any;
        description: any;
        reason: string;
        reference_type: string;
        reference_id: any;
        priority: number;
        confidence: number;
    })[]>;
    /**
     * Guarda una recomendación
     */
    saveRecommendation(userId: any, recommendation: any): Promise<any>;
    /**
     * Obtiene recomendaciones activas
     */
    getActiveRecommendations(userId: any, limit?: number): Promise<any>;
    /**
     * Marca recomendación como vista/aceptada/descartada
     */
    updateRecommendationStatus(userId: any, recommendationId: any, status: any): Promise<any>;
    /**
     * Actualiza dominio de concepto
     */
    updateConceptMastery(userId: any, subject: any, concept: any, isCorrect: any): Promise<any>;
    /**
     * Calcula nuevo nivel de dominio
     */
    calculateNewMastery(currentMastery: any, isCorrect: any): number;
    /**
     * Calcula intervalo de repaso (spaced repetition)
     */
    calculateReviewInterval(mastery: any, currentInterval: any, isCorrect: any): number;
    /**
     * Obtiene conceptos para repasar
     */
    getConceptsToReview(userId: any, limit?: number): Promise<any>;
    /**
     * Obtiene estadísticas detalladas del usuario
     */
    getDetailedStats(userId: any): Promise<{
        profile: any;
        weekly_activity: any;
        best_subject: any;
        mastered_concepts: number;
    }>;
}
//# sourceMappingURL=AITutorService.d.ts.map