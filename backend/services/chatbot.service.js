"use strict";
/**
 * 🤖 CHATBOT SERVICE - TypeScript Version
 * Servicio centralizado para el chatbot inteligente
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const conversation_dao_1 = __importDefault(require("../data/conversation.dao"));
// ==================== CHATBOT SERVICE ====================
class ChatbotService {
    /**
     * Procesar un mensaje de usuario
     */
    async processMessage(userId, message, sessionId) {
        // 1. Buscar en FAQs primero (respuesta rápida y barata)
        const faqs = await conversation_dao_1.default.searchFAQs(message, 1);
        let assistantResponse = '';
        let source = 'ai';
        if (faqs.length > 0 && faqs[0].prioridad >= 8) {
            // Si hay un match de alta prioridad, usarlo
            assistantResponse = faqs[0].respuesta;
            source = 'faq';
        }
        else {
            // 2. Si no, generar respuesta con "IA" (Simulada por ahora)
            assistantResponse = this.generateMockAIResponse(message);
        }
        // 3. Persistir interacción si hay usuario
        let savedInteraction = null;
        if (userId !== null) {
            const messageData = {
                user_id: userId,
                user_message: message,
                assistant_message: assistantResponse,
                tokens_used: Math.ceil(message.length / 4), // Estimación
                language: 'es',
                session_id: sessionId
            };
            savedInteraction = await conversation_dao_1.default.createMessage(messageData);
            // 4. Actualizar analytics
            const today = new Date().toISOString().split('T')[0];
            const stats = {
                conversations: 1,
                messages: 1,
                unique_users: 1,
                tokens: Math.ceil(message.length / 4)
            };
            await conversation_dao_1.default.logDailyStats(today, stats);
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
    generateMockAIResponse(message) {
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
    async createFAQ(data) {
        return await conversation_dao_1.default.createFAQ(data);
    }
    /**
     * Obtener FAQs públicas
     */
    async getPublicFAQs(category = null) {
        const filters = { activo: true };
        if (category)
            filters.categoria = category;
        return await conversation_dao_1.default.getAllFAQs(filters);
    }
}
exports.ChatbotService = ChatbotService;
// ==================== EXPORTS ====================
const chatbotService = new ChatbotService();
exports.default = chatbotService;
//# sourceMappingURL=chatbot.service.js.map