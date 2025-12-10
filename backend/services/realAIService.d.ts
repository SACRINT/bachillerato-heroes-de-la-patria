export class RealAIService {
    isInitialized: boolean;
    providers: {
        openai: any;
        anthropic: any;
        local: any;
    };
    providerStatus: {
        openai: boolean;
        anthropic: boolean;
        local: boolean;
    };
    usage: {
        openai: {
            requests: number;
            tokens: number;
            errors: number;
        };
        anthropic: {
            requests: number;
            tokens: number;
            errors: number;
        };
        local: {
            requests: number;
            tokens: number;
            errors: number;
        };
    };
    rateLimits: {
        openai: {
            requestsPerMinute: number;
            tokensPerMinute: number;
        };
        anthropic: {
            requestsPerMinute: number;
            tokensPerMinute: number;
        };
    };
    /**
     * 🔧 Inicializar proveedores de IA
     */
    initialize(): Promise<void>;
    /**
     * 🧪 Test de conexión OpenAI
     */
    testOpenAIConnection(): Promise<any>;
    /**
     * 🧪 Test de conexión Anthropic
     */
    testAnthropicConnection(): Promise<any>;
    /**
     * 🎯 Procesar solicitud de IA con estrategia inteligente
     */
    processAIRequest(requestData: any): any;
    /**
     * 🔄 Seleccionar mejor proveedor disponible
     */
    selectBestProvider(requestData: any, preferredProvider: any): any;
    /**
     * 🤖 Procesar con OpenAI GPT-4
     */
    processWithOpenAI(requestData: any): Promise<{
        text: any;
        tokensUsed: any;
        model: string;
        confidence: number;
    }>;
    /**
     * 🧠 Procesar con Anthropic Claude
     */
    processWithAnthropic(requestData: any): Promise<{
        text: any;
        tokensUsed: any;
        model: string;
        confidence: number;
    }>;
    /**
     * 💻 Procesar con IA local (respaldo)
     */
    processWithLocal(requestData: any): Promise<{
        text: any;
        tokensUsed: number;
        model: string;
        confidence: any;
        isLocal: boolean;
    }>;
    /**
     * 🔄 Procesamiento con respaldo
     */
    processWithFallback(requestData: any, failedProvider: any): any;
    /**
     * 📋 Obtener prompts del sistema por tipo de usuario
     */
    getSystemPrompt(userType: any): any;
    /**
     * 🎛️ Configuración por tipo de usuario
     */
    getMaxTokens(userType: any): any;
    getTemperature(userType: any): any;
    /**
     * 🔍 Validar entrada
     */
    validateInput(input: any): {
        valid: boolean;
        error: string;
    } | {
        valid: boolean;
        error?: undefined;
    };
    /**
     * 📊 Obtener estadísticas del servicio
     */
    getStats(): {
        initialized: boolean;
        providers: {
            openai: boolean;
            anthropic: boolean;
            local: boolean;
        };
        usage: {
            openai: {
                requests: number;
                tokens: number;
                errors: number;
            };
            anthropic: {
                requests: number;
                tokens: number;
                errors: number;
            };
            local: {
                requests: number;
                tokens: number;
                errors: number;
            };
        };
        uptime: number;
        availableProviders: string[];
        totalRequests: number;
        totalTokens: number;
        totalErrors: number;
    };
    /**
     * 📋 Resumen de proveedores
     */
    getProviderSummary(): {
        active: string[];
        count: number;
        primary: string;
        fallback: string[];
    };
    /**
     * 🔄 Recargar configuración
     */
    reload(): Promise<{
        initialized: boolean;
        providers: {
            openai: boolean;
            anthropic: boolean;
            local: boolean;
        };
        usage: {
            openai: {
                requests: number;
                tokens: number;
                errors: number;
            };
            anthropic: {
                requests: number;
                tokens: number;
                errors: number;
            };
            local: {
                requests: number;
                tokens: number;
                errors: number;
            };
        };
        uptime: number;
        availableProviders: string[];
        totalRequests: number;
        totalTokens: number;
        totalErrors: number;
    }>;
    /**
     * 🧹 Limpiar estadísticas
     */
    clearStats(): void;
}
export function getRealAIService(): any;
//# sourceMappingURL=realAIService.d.ts.map