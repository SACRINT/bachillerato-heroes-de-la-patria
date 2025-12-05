/**
 * 🤖 CHATBOT SERVICE
 * Servicio centralizado para el chatbot inteligente
 * Refactorizado: Service Layer + DAO Pattern
 */

const ConversationDAO = require('../data/conversation.dao');

class ChatbotService {

    /**
     * Procesar un mensaje de usuario
     * @param {string} userId - ID del usuario (o null si es anónimo)
     * @param {string} message - Mensaje del usuario
     * @param {string} sessionId - ID de sesión para contexto
     */
    async processMessage(userId, message, sessionId) {
        // 1. Buscar en FAQs primero (respuesta rápida y barata)
        const faqs = await ConversationDAO.searchFAQs(message, 1);
        let assistantResponse = '';
        let source = 'ai';

        if (faqs.length > 0 && faqs[0].prioridad >= 8) {
            // Si hay un match de alta prioridad, usarlo
            assistantResponse = faqs[0].respuesta;
            source = 'faq';
        } else {
            // 2. Si no, generar respuesta con "IA" (Simulada por ahora o llamar a OpenAI real)
            // Aquí iría la llamada real a OpenAIService si estuviera disponible y configurado
            assistantResponse = this.generateMockAIResponse(message);
        }

        // 3. Persistir interacción si hay usuario (o si decidimos guardar anónimos también)
        let savedInteraction = null;
        if (userId) {
            savedInteraction = await ConversationDAO.createMessage({
                user_id: userId,
                user_message: message,
                assistant_message: assistantResponse,
                tokens_used: Math.ceil(message.length / 4), // Estimación burda
                language: 'es',
                session_id: sessionId
            });

            // 4. Actualizar analytics (simplificado, idealmente async o batch)
            const today = new Date().toISOString().split('T')[0];
            await ConversationDAO.logDailyStats(today, {
                conversations: 1, // Esto debería ser más inteligente para no contar doble
                messages: 1,
                unique_users: 1,
                tokens: Math.ceil(message.length / 4)
            });
        }

        return {
            response: assistantResponse,
            source: source,
            interactionId: savedInteraction ? savedInteraction.id : null
        };
    }

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

    async createFAQ(data) {
        return await ConversationDAO.createFAQ(data);
    }

    async getPublicFAQs(category = null) {
        const filters = { activo: true };
        if (category) filters.categoria = category;
        return await ConversationDAO.getAllFAQs(filters);
    }
}

module.exports = new ChatbotService();
