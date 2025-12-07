/**
 * 💬 AI CHATBOT DAO - TypeScript
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface FaqRow {
    id: number;
    question: string;
    answer: string;
    keywords?: string[];
    created_at: Date;
    updated_at?: Date;
}

// =====================================================
// AI CHATBOT DAO CLASS
// =====================================================

class AIChatbotDAO {

    static async deleteChatHistory(userId: number): Promise<number> {
        const result = await executeQuery('DELETE FROM chat_history WHERE user_id = $1 RETURNING id', [userId]);
        return result.length;
    }

    static async deleteFaq(id: number): Promise<FaqRow | null> {
        const result = await executeQuery('DELETE FROM faqs_chatbot WHERE id = $1 RETURNING *', [id]);
        return result[0] || null;
    }

    // Health check excluido - debe ser directo para verificar conectividad
}

export default AIChatbotDAO;
module.exports = AIChatbotDAO;
