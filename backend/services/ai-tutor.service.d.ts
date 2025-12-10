/**
 * 🤖 AI TUTOR SERVICE - TypeScript Version
 * Servicio de tutoría IA personalizada
 * FASE 3 - Semana 17-18
 * Refactorizado: 07 Diciembre 2025
 */
export interface TutorLevel {
    level: number;
    xp: number;
    title: string;
}
export interface LearnerProfile {
    id: number;
    user_id: number;
    level: number;
    xp: number;
    learning_style: string;
    subjects_proficiency: Record<string, number>;
    adaptive_difficulty: number;
    preferred_session_duration: number;
    streak_days: number;
    total_sessions: number;
    created_at: Date;
    updated_at: Date;
}
export interface TutoringSession {
    id: string;
    userId: number;
    subject?: string;
    topic?: string;
    difficulty: number;
    startedAt: Date;
    endedAt?: Date;
    xpEarned: number;
    questionsAnswered: number;
    correctAnswers: number;
    messages: SessionMessage[];
}
export interface SessionMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface LearningPath {
    id: string;
    name: string;
    description: string;
    subject: string;
    difficulty: number;
    modules: PathModule[];
    estimatedDuration: number;
}
export interface PathModule {
    id: string;
    name: string;
    order: number;
    concepts: string[];
    completed?: boolean;
}
export interface Recommendation {
    id: string;
    userId: number;
    type: 'topic' | 'practice' | 'review' | 'path';
    title: string;
    description: string;
    subject?: string;
    priority: number;
    status: 'active' | 'viewed' | 'accepted' | 'dismissed';
    createdAt: Date;
}
export interface ConceptMastery {
    userId: number;
    subject: string;
    concept: string;
    mastery: number;
    reviewCount: number;
    nextReviewDate: Date;
    lastAttemptCorrect: boolean;
}
export interface SessionData {
    subject?: string;
    topic?: string;
    difficulty?: number;
}
export interface SessionResults {
    questionsAnswered?: number;
    correctAnswers?: number;
    topicsCovered?: string[];
}
declare class AITutorService {
    private aiService;
    private tutorLevels;
    constructor();
    getOrCreateProfile(userId: number): Promise<LearnerProfile>;
    getProfileWithStats(userId: number): Promise<LearnerProfile & {
        stats: any;
    }>;
    updateProfile(userId: number, profileData: Partial<LearnerProfile>): Promise<LearnerProfile>;
    updateSubjectProficiency(userId: number, subject: string, score: number): Promise<void>;
    calculateLevel(xp: number): {
        level: number;
        title: string;
        xpToNext: number;
        progress: number;
    };
    startSession(userId: number, sessionData: SessionData): Promise<TutoringSession>;
    addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<SessionMessage>;
    endSession(sessionId: string, sessionResults?: SessionResults): Promise<TutoringSession>;
    getSessionHistory(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<TutoringSession[]>;
    getSessionById(sessionId: string): Promise<TutoringSession | null>;
    calculateAdaptiveDifficulty(userId: number, subject?: string): Promise<number>;
    getLearningPaths(options?: {
        subject?: string;
        difficulty?: number;
    }): Promise<LearningPath[]>;
    getPathById(pathId: string, userId?: number): Promise<LearningPath | null>;
    startLearningPath(userId: number, pathId: string): Promise<void>;
    updatePathProgress(userId: number, pathId: string, progressData: {
        currentModule: number;
        completed?: boolean;
    }): Promise<void>;
    getUserPaths(userId: number): Promise<any[]>;
    generateRecommendations(userId: number): Promise<Recommendation[]>;
    getActiveRecommendations(userId: number, limit?: number): Promise<Recommendation[]>;
    updateRecommendationStatus(userId: number, recommendationId: string, status: string): Promise<void>;
    updateConceptMastery(userId: number, subject: string, concept: string, isCorrect: boolean): Promise<void>;
    calculateNewMastery(currentMastery: number, isCorrect: boolean): number;
    calculateReviewInterval(mastery: number, currentInterval: number, isCorrect: boolean): Date;
    getConceptsToReview(userId: number, limit?: number): Promise<ConceptMastery[]>;
    getDetailedStats(userId: number): Promise<any>;
}
declare const aiTutorService: AITutorService;
export { AITutorService };
export default aiTutorService;
//# sourceMappingURL=ai-tutor.service.d.ts.map