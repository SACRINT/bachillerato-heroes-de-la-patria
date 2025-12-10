/**
 * 🤖 AI GENERATION SERVICE - TypeScript Version
 * Generación con múltiples proveedores de IA
 * Refactorizado: 07 Diciembre 2025
 */
export interface AIProvider {
    name: string;
    models: Record<string, AIModel>;
    available: boolean;
}
export interface AIModel {
    name: string;
    costPer1K: number;
    maxTokens: number;
    capabilities: string[];
}
export interface GenerationOptions {
    provider: string;
    model?: string;
    type: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
}
export interface GenerationResult {
    id: string;
    content: string;
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    createdAt: Date;
}
export interface UserBalance {
    userId: number;
    iaCoins: number;
    freeCreditsRemaining: number;
}
declare class AIGenerationService {
    private providers;
    private defaultProvider;
    constructor();
    generate(userId: number, options: GenerationOptions): Promise<GenerationResult>;
    private callOpenAI;
    private callAnthropic;
    private callGemini;
    private generateDemoResponse;
    getUserBalance(userId: number): Promise<UserBalance>;
    private chargeUser;
    private createGenerationRecord;
    private updateGenerationRecord;
    getUserGenerations(userId: number, limit?: number, offset?: number): Promise<any[]>;
    getPricing(): Record<string, Record<string, AIModel>>;
    getGenerationTypes(): string[];
}
declare const aiGenerationService: AIGenerationService;
export { AIGenerationService };
export default aiGenerationService;
//# sourceMappingURL=ai-generation.service.d.ts.map