/**
 * 💬 AI CHATBOT DAO - TypeScript
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface FaqRow {
    id: number;
    question: string;
    answer: string;
    keywords?: string[];
    created_at: Date;
    updated_at?: Date;
}
declare class AIChatbotDAO {
    static deleteChatHistory(userId: number): Promise<number>;
    static deleteFaq(id: number): Promise<FaqRow | null>;
}
export default AIChatbotDAO;
//# sourceMappingURL=ai-chatbot.dao.d.ts.map