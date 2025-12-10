export class LocalIAProcessor {
    knowledgeBase: Map<any, any>;
    responseTemplates: Map<any, any>;
    contextPatterns: Map<any, any>;
    intentClassifier: Map<any, any>;
    init(): void;
    /**
     * CARGAR BASE DE CONOCIMIENTO LOCAL
     */
    loadKnowledgeBase(): void;
    /**
     * CONFIGURAR PLANTILLAS DE RESPUESTA
     */
    setupResponseTemplates(): void;
    /**
     * CONFIGURAR CLASIFICADOR DE INTENCIONES
     */
    setupIntentClassifier(): void;
    /**
     * CONFIGURAR PATRONES DE CONTEXTO
     */
    setupContextPatterns(): void;
    /**
     * PROCESAR MENSAJE PRINCIPAL
     */
    process(params: any): Promise<{
        text: string;
        confidence: number;
        intent: string;
        processingTime: number;
        contextModifiers: any[];
        knowledgeSource: string;
        isLocal: boolean;
        error: boolean;
    } | {
        text: string;
        confidence: number;
        intent: string;
        processingTime: number;
        contextModifiers: any[];
        knowledgeSource: string;
        isLocal: boolean;
    }>;
    /**
     * CLASIFICAR INTENCIÓN DEL MENSAJE
     */
    classifyIntent(message: any): {
        name: string;
        confidence: number;
    };
    /**
     * ANALIZAR CONTEXTO DEL MENSAJE
     */
    analyzeContext(message: any, context: any): {
        modifiers: any[];
        elements: {
            userType: any;
            currentPage: any;
            sessionId: any;
        }[];
        messageLength: any;
        complexity: string;
    };
    /**
     * BUSCAR EN BASE DE CONOCIMIENTO
     */
    searchKnowledgeBase(message: any): {
        topic: any;
        data: any;
        score: number;
        source: string;
    };
    /**
     * GENERAR RESPUESTA
     */
    generateResponse(intent: any, knowledgeMatch: any, contextAnalysis: any, originalMessage: any): string;
    /**
     * PERSONALIZAR RESPUESTA
     */
    personalizeResponse(response: any, contextAnalysis: any): any;
    /**
     * CALCULAR CONFIANZA DE LA RESPUESTA
     */
    calculateConfidence(intent: any, knowledgeMatch: any, contextAnalysis: any): number;
    /**
     * EVALUAR COMPLEJIDAD DEL MENSAJE
     */
    assessComplexity(message: any): "media" | "simple" | "compleja";
    /**
     * OBTENER PLANTILLA ALEATORIA
     */
    getRandomTemplate(templateType: any): any;
    /**
     * OBTENER RESPUESTA ALEATORIA
     */
    getRandomResponse(responses: any): any;
    /**
     * GENERAR RESPUESTA DE ERROR
     */
    generateErrorResponse(message: any): {
        text: string;
        confidence: number;
        intent: string;
        processingTime: number;
        contextModifiers: any[];
        knowledgeSource: string;
        isLocal: boolean;
        error: boolean;
    };
    /**
     * OBTENER ESTADÍSTICAS DEL PROCESADOR
     */
    getStats(): {
        knowledgeBaseSize: number;
        responseTemplates: number;
        intentClassifier: number;
        contextPatterns: number;
        version: string;
        lastUpdate: string;
    };
    /**
     * AGREGAR NUEVO CONOCIMIENTO
     */
    addKnowledge(topic: any, data: any): void;
    /**
     * ACTUALIZAR PLANTILLA DE RESPUESTA
     */
    updateTemplate(templateType: any, responses: any): void;
}
export function getLocalIAProcessor(): any;
//# sourceMappingURL=localIAProcessor.d.ts.map