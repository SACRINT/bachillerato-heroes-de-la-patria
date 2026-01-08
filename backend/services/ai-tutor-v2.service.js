/**
 * 🤖 AI TUTOR V2 SERVICE (Contextual)
 * Propósito: Chatbot educativo con memoria y contexto del usuario (Fase 6 - Semana 42)
 */

const { executeQuery } = require('../config/database');

class AiTutorV2Service {

    async startSession(userId, topic) {
        const query = `
            INSERT INTO tutor_chat_sessions (user_id, current_topic)
            VALUES ($1, $2)
            RETURNING id
        `;
        const res = await executeQuery(query, [userId, topic]);
        return res[0];
    }

    async sendMessage(sessionId, userId, userMessage) {
        // 1. Save User Message
        await this._saveMessage(sessionId, 'user', userMessage);

        // 2. Build Context (Mock AI Logic)
        // En producción: Fetch user grades, recent content, then call OpenAI/Gemini API
        const context = await this._getUserContext(userId);

        let aiResponse = "";
        let contextMeta = {};

        if (userMessage.includes("examen")) {
            aiResponse = `Veo que sacaste ${context.lastGrade} en tu último examen de ${context.lastTopic}. ¿Quieres repasar los errores?`;
            contextMeta = { intent: "review_exam", Grade: context.lastGrade };
        } else {
            aiResponse = `Entendido. Para ${context.currentTopic}, te recomiendo empezar con el video introductorio. ¿Te lo muestro?`;
            contextMeta = { intent: "recommendation" };
        }

        // 3. Save AI Response
        const aiMsg = await this._saveMessage(sessionId, 'ai', aiResponse, contextMeta);

        return {
            id: aiMsg.id,
            text: aiResponse,
            context: contextMeta
        };
    }

    async _saveMessage(sessionId, sender, text, meta = {}) {
        const query = `
            INSERT INTO tutor_chat_messages (session_id, sender, message_text, context_data_json)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        const res = await executeQuery(query, [sessionId, sender, text, JSON.stringify(meta)]);
        return res[0];
    }

    async _getUserContext(userId) {
        // Mock context retrieval
        return {
            lastGrade: 75,
            lastTopic: "Matemáticas",
            currentTopic: "Historia"
        };
    }
}

module.exports = new AiTutorV2Service();
