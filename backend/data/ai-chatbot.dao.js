/**
 * 💬 AI CHATBOT DAO @author Gemini Code @date 2025-12-05
 */
const { executeQuery } = require('../config/database');

class AIChatbotDAO {
    static async deleteChatHistory(userId) {
        const result = await executeQuery('DELETE FROM chat_history WHERE user_id = $1 RETURNING id', [userId]);
        return result.length;
    }

    static async deleteFaq(id) {
        const result = await executeQuery('DELETE FROM faqs_chatbot WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }

    // Health check excluido - debe ser directo para verificar conectividad
}
module.exports = AIChatbotDAO;
