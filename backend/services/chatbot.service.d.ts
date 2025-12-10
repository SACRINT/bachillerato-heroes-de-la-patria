/**
 * 🤖 CHATBOT SERVICE - TypeScript Version
 * Servicio centralizado para el chatbot inteligente
 * Migrado: 07 Diciembre 2025
 */
interface FAQ {
    id: number;
    pregunta: string;
    respuesta: string;
    categoria: string;
    prioridad: number;
    activo: boolean;
}
interface ProcessMessageResult {
    response: string;
    source: 'faq' | 'ai';
    interactionId: number | null;
}
interface CreateFAQData {
    pregunta: string;
    respuesta: string;
    categoria: string;
    prioridad?: number;
    activo?: boolean;
}
declare class ChatbotService {
    /**
     * Procesar un mensaje de usuario
     */
    processMessage(userId: number | null, message: string, sessionId: string): Promise<ProcessMessageResult>;
    /**
     * Generar respuesta mock de IA
     */
    generateMockAIResponse(message: string): string;
    /**
     * Crear una nueva FAQ
     */
    createFAQ(data: CreateFAQData): Promise<FAQ>;
    /**
     * Obtener FAQs públicas
     */
    getPublicFAQs(category?: string | null): Promise<FAQ[]>;
}
declare const chatbotService: ChatbotService;
export default chatbotService;
export { ChatbotService, ProcessMessageResult, FAQ, CreateFAQData };
//# sourceMappingURL=chatbot.service.d.ts.map