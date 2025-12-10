"use strict";
/**
 * 💬 AI CHATBOT DAO - TypeScript
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// AI CHATBOT DAO CLASS
// =====================================================
class AIChatbotDAO {
    static async deleteChatHistory(userId) {
        const result = await (0, database_1.executeQuery)('DELETE FROM chat_history WHERE user_id = $1 RETURNING id', [userId]);
        return result.length;
    }
    static async deleteFaq(id) {
        const result = await (0, database_1.executeQuery)('DELETE FROM faqs_chatbot WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }
}
exports.default = AIChatbotDAO;
module.exports = AIChatbotDAO;
//# sourceMappingURL=ai-chatbot.dao.js.map