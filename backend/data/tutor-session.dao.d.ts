/**
 * 🤖 TUTOR SESSION DAO - TypeScript
 * Gestión de sesiones de tutoría y mensajes
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface TutorSession {
    id: number;
    user_id: number;
    subject: string;
    topic: string;
    subtopic: string | null;
    session_type: string;
    difficulty_level: string;
    target_duration: number;
    status: string;
    actual_duration?: number;
    quiz_score?: number;
    understanding_level?: number;
    was_helpful?: boolean;
    feedback_text?: string;
    ai_provider?: string;
    ai_model?: string;
    tokens_used?: number;
    iacoins_spent?: number;
    xp_earned?: number;
    coins_earned?: number;
    messages?: any;
    message_count?: number;
    started_at: Date;
    ended_at?: Date;
}
export interface CreateSessionInput {
    user_id: number;
    subject: string;
    topic: string;
    subtopic?: string;
    session_type?: string;
    difficulty_level: string;
    target_duration?: number;
}
export interface SessionMessage {
    role: string;
    content: string;
    timestamp: Date;
}
export interface SessionResults {
    actual_duration: number;
    quiz_score: number;
    understanding_level: number;
    was_helpful: boolean;
    feedback_text: string;
    ai_provider: string;
    ai_model: string;
    tokens_used: number;
    iacoins_spent: number;
    xp_earned: number;
    coins_earned: number;
}
export interface SessionFilter {
    subject?: string;
    status?: string;
}
export interface AdaptiveDifficultyStats {
    avg_score: number;
    session_count: number;
}
declare class TutorSessionDAO {
    /**
     * Crear nueva sesión
     */
    static create(data: CreateSessionInput): Promise<TutorSession>;
    /**
     * Obtener sesión por ID
     */
    static findById(id: number): Promise<TutorSession | null>;
    /**
     * Agregar mensaje a la sesión
     */
    static addMessage(sessionId: number, message: SessionMessage): Promise<TutorSession>;
    /**
     * Finalizar sesión
     */
    static complete(sessionId: number, results: SessionResults): Promise<TutorSession>;
    /**
     * Obtener historial de sesiones
     */
    static getHistory(userId: number, filters?: SessionFilter, limit?: number, offset?: number): Promise<TutorSession[]>;
    /**
     * Obtener estadísticas para dificultad adaptativa
     */
    static getStatsForAdaptiveDifficulty(userId: number, subject: string): Promise<AdaptiveDifficultyStats | null>;
}
export default TutorSessionDAO;
//# sourceMappingURL=tutor-session.dao.d.ts.map