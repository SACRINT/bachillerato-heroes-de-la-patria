/**
 * 🧠 LEARNING PROFILE DAO - TypeScript
 * Gestión de perfiles de aprendizaje y dominio de conocimientos
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface LearningProfile {
    user_id: number;
    total_sessions?: number;
    total_time_spent?: number;
    tutor_xp?: number;
    last_session_at?: Date;
    created_at?: Date;
    updated_at?: Date;
    [key: string]: any;
}
export interface LearningStats {
    duration: number;
    xp: number;
}
export interface CreateConceptMasteryInput {
    user_id: number;
    subject: string;
    concept: string;
    mastery_level: number;
    confidence: number;
    times_practiced?: number;
    times_correct?: number;
    next_review_at: Date;
    review_interval: number;
}
export interface ConceptMastery extends CreateConceptMasteryInput {
    last_practiced_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
export interface MasterySummary {
    subject: string;
    concepts: number;
    avg_mastery: number;
}
export interface CreateRecommendationInput {
    user_id: number;
    type: string;
    title: string;
    description: string;
    reason: string;
    reference_type: string;
    reference_id: number | string;
    priority: number;
    confidence: number;
}
export interface Recommendation extends CreateRecommendationInput {
    id: number;
    is_dismissed: boolean;
    expires_at: Date;
    created_at: Date;
}
declare class LearningProfileDAO {
    /**
     * Obtener o crear perfil
     */
    static getOrCreate(userId: number): Promise<LearningProfile>;
    /**
     * Actualizar perfil
     */
    static update(userId: number, data: Partial<LearningProfile>): Promise<LearningProfile | null>;
    /**
     * Actualizar estadísticas acumuladas del perfil
     */
    static updateStats(userId: number, stats: LearningStats): Promise<LearningProfile>;
    static getConceptMastery(userId: number, subject: string, concept: string): Promise<ConceptMastery | undefined>;
    static upsertConceptMastery(data: CreateConceptMasteryInput): Promise<ConceptMastery>;
    static getConceptsToReview(userId: number, limit?: number): Promise<ConceptMastery[]>;
    static getMasteryBySubject(userId: number): Promise<MasterySummary[]>;
    static createRecommendation(data: CreateRecommendationInput): Promise<Recommendation>;
    static getActiveRecommendations(userId: number, limit?: number): Promise<Recommendation[]>;
}
export default LearningProfileDAO;
//# sourceMappingURL=learning-profile.dao.d.ts.map