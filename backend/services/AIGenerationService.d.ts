declare const _exports: AIGenerationService;
export = _exports;
declare class AIGenerationService {
    providers: {
        openai: {
            name: string;
            models: {
                'gpt-4': {
                    costPerRequest: number;
                    maxTokens: number;
                };
                'gpt-4-turbo': {
                    costPerRequest: number;
                    maxTokens: number;
                };
                'gpt-3.5-turbo': {
                    costPerRequest: number;
                    maxTokens: number;
                };
            };
            baseUrl: string;
        };
        anthropic: {
            name: string;
            models: {
                'claude-3-opus': {
                    costPerRequest: number;
                    maxTokens: number;
                };
                'claude-3-sonnet': {
                    costPerRequest: number;
                    maxTokens: number;
                };
                'claude-3-haiku': {
                    costPerRequest: number;
                    maxTokens: number;
                };
            };
            baseUrl: string;
        };
        gemini: {
            name: string;
            models: {
                'gemini-pro': {
                    costPerRequest: number;
                    maxTokens: number;
                };
                'gemini-pro-vision': {
                    costPerRequest: number;
                    maxTokens: number;
                };
            };
            baseUrl: string;
        };
    };
    generationTypes: {
        text: {
            name: string;
            description: string;
        };
        essay: {
            name: string;
            description: string;
        };
        summary: {
            name: string;
            description: string;
        };
        code: {
            name: string;
            description: string;
        };
        explanation: {
            name: string;
            description: string;
        };
        quiz: {
            name: string;
            description: string;
        };
        translation: {
            name: string;
            description: string;
        };
    };
    /**
     * Generar contenido con IA
     */
    generate(userId: any, options: any): Promise<{
        success: boolean;
        content: any;
        tokensUsed: any;
        coinsCost: any;
        generationId: any;
        provider: any;
        model: any;
    }>;
    /**
     * Llamar a OpenAI API
     */
    callOpenAI(model: any, prompt: any, systemPrompt: any, maxTokens: any, temperature: any): Promise<{
        content: any;
        tokensUsed: any;
    }>;
    /**
     * Llamar a Anthropic API
     */
    callAnthropic(model: any, prompt: any, systemPrompt: any, maxTokens: any, temperature: any): Promise<{
        content: any;
        tokensUsed: any;
    }>;
    /**
     * Llamar a Google Gemini API
     */
    callGemini(model: any, prompt: any, maxTokens: any, temperature: any): Promise<{
        content: any;
        tokensUsed: any;
    }>;
    /**
     * Generar respuesta demo (sin API key)
     */
    generateDemoResponse(provider: any, prompt: any): {
        content: any;
        tokensUsed: number;
    };
    /**
     * Obtener balance del usuario
     */
    getUserBalance(userId: any): Promise<any>;
    /**
     * Cobrar IACoins al usuario
     */
    chargeUser(userId: any, amount: any, metadata: any): Promise<number>;
    /**
     * Crear registro de generación
     */
    createGenerationRecord(userId: any, data: any): Promise<any>;
    /**
     * Actualizar registro de generación
     */
    updateGenerationRecord(generationId: any, data: any): Promise<void>;
    /**
     * Obtener historial de generaciones del usuario
     */
    getUserGenerations(userId: any, limit?: number, offset?: number): Promise<{
        generations: any;
        total: number;
        limit: number;
        offset: number;
    }>;
    /**
     * Obtener precios de modelos
     */
    getPricing(): {
        provider: string;
        providerName: string;
        model: string;
        costPerRequest: number;
        maxTokens: number;
    }[];
    /**
     * Obtener tipos de generación
     */
    getGenerationTypes(): {
        text: {
            name: string;
            description: string;
        };
        essay: {
            name: string;
            description: string;
        };
        summary: {
            name: string;
            description: string;
        };
        code: {
            name: string;
            description: string;
        };
        explanation: {
            name: string;
            description: string;
        };
        quiz: {
            name: string;
            description: string;
        };
        translation: {
            name: string;
            description: string;
        };
    };
}
//# sourceMappingURL=AIGenerationService.d.ts.map