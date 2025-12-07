/**
 * 🤖 CHATBOT SERVICE - TypeScript Version
 * Servicio centralizado para el chatbot inteligente
 * Migrado: 07 Diciembre 2025
 */

import ConversationDAO from '../data/conversation.dao';

// ==================== INTERFACES ====================

interface FAQ {
    id: number;
    pregunta: string;
    respuesta: string;
    categoria: string;
    prioridad: number;
    activo: boolean;
}

interface MessageData {
    user_id: number;
    user_message: string;
    assistant_message: string;
    tokens_used?: number;
    language?: string;
    session_id?: string;
}

interface ProcessMessageResult {
    response: string;
    source: 'faq' | 'ai';
    interactionId: number | null;
}

interface FAQFilters {
    activo?: boolean;
    categoria?: string;
}

interface CreateFAQData {
    pregunta: string;
    respuesta: string;
    categoria: string;
    prioridad?: number;
    activo?: boolean;
}

interface DailyStats {
    conversations: number;
    messages: number;
    unique_users: number;
    tokens: number;
}

// ==================== CHATBOT SERVICE ====================

class ChatbotService {

    /**
     * Procesar un mensaje de usuario
     */
    async processMessage(
        userId: number | null,
        message: string,
        sessionId: string
    ): Promise<ProcessMessageResult> {
        // 1. Buscar en FAQs primero (respuesta rápida y barata)
        const faqs: FAQ[] = await ConversationDAO.searchFAQs(message, 1);
        let assistantResponse = '';
        let source: 'faq' | 'ai' = 'ai';

        if (faqs.length > 0 && faqs[0].prioridad >= 8) {
            // Si hay un match de alta prioridad, usarlo
            assistantResponse = faqs[0].respuesta;
            source = 'faq';
        } else {
            // 2. Si no, generar respuesta con "IA" (Simulada por ahora)
            assistantResponse = this.generateMockAIResponse(message);
        }

        // 3. Persistir interacción si hay usuario
        let savedInteraction: { id: number } | null = null;
        if (userId !== null) {
            const messageData: MessageData = {
                user_id: userId,
                user_message: message,
                assistant_message: assistantResponse,
                tokens_used: Math.ceil(message.length / 4), // Estimación
                language: 'es',
                session_id: sessionId
            };

            savedInteraction = await ConversationDAO.createMessage(messageData);

            // 4. Actualizar analytics
            const today = new Date().toISOString().split('T')[0];
            const stats: DailyStats = {
                conversations: 1,
                messages: 1,
                unique_users: 1,
                tokens: Math.ceil(message.length / 4)
            };
            await ConversationDAO.logDailyStats(today, stats);
        }

        return {
            response: assistantResponse,
            source: source,
            interactionId: savedInteraction ? savedInteraction.id : null
        };
    }

    /**
     * Generar respuesta mock de IA
     */
    generateMockAIResponse(message: string): string {
        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('hola') || lowerMsg.includes('buenos dias')) {
            return '¡Hola! Soy el asistente virtual del Bachillerato Héroes de la Patria. ¿En qué puedo ayudarte hoy?';
        }
        if (lowerMsg.includes('inscripci')) {
            return 'Las inscripciones están abiertas. Puedes iniciar el proceso en la sección de "Admisiones" de nuestro portal.';
        }
        if (lowerMsg.includes('horario')) {
            return 'Nuestro horario de atención es de Lunes a Viernes de 7:00 AM a 8:00 PM.';
        }

        return 'Entiendo tu consulta. Para darte una mejor respuesta, ¿podrías ser más específico o contactar a control escolar?';
    }

    // ==========================================
    // GESTIÓN DE FAQs
    // ==========================================

    /**
     * Crear una nueva FAQ
     */
    async createFAQ(data: CreateFAQData): Promise<FAQ> {
        return await ConversationDAO.createFAQ(data);
    }

    /**
     * Obtener FAQs públicas
     */
    async getPublicFAQs(category: string | null = null): Promise<FAQ[]> {
        const filters: FAQFilters = { activo: true };
        if (category) filters.categoria = category;
        return await ConversationDAO.getAllFAQs(filters);
    }
}

// ==================== EXPORTS ====================

const chatbotService = new ChatbotService();

export default chatbotService;
export { ChatbotService, ProcessMessageResult, FAQ, CreateFAQData };
