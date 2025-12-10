/**
 * 💬 CONVERSATION DAO - TypeScript
 * Gestión de historial de chat, FAQs y analytics
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface ChatHistory {
    id: number;
    user_id: number;
    user_message: string;
    assistant_message: string;
    tokens_used: number;
    language: string;
    session_id?: string;
    created_at: Date;
}
export interface FaqChatbot {
    id: number;
    pregunta: string;
    respuesta: string;
    categoria: string;
    idioma: string;
    activo: boolean;
    prioridad: number;
    created_at: Date;
    updated_at?: Date;
}
export interface ChatbotAnalytics {
    id: number;
    fecha: Date;
    total_conversaciones: number;
    total_mensajes: number;
    usuarios_unicos: number;
    tokens_totales: number;
    created_at: Date;
    updated_at: Date;
}
export interface CreateMessageInput {
    user_id: number;
    user_message: string;
    assistant_message: string;
    tokens_used?: number;
    language?: string;
    session_id?: string;
}
export interface CreateFaqInput {
    pregunta: string;
    respuesta: string;
    categoria: string;
    idioma?: string;
    activo?: boolean;
    prioridad?: number;
}
export interface DailyStatsInput {
    conversations?: number;
    messages?: number;
    unique_users?: number;
    tokens?: number;
}
export interface FaqFilters {
    categoria?: string;
    idioma?: string;
    activo?: boolean;
}
declare class ConversationDAO {
    static createMessage(data: CreateMessageInput): Promise<ChatHistory>;
    static getHistory(userId: number, limit?: number): Promise<ChatHistory[]>;
    static clearHistory(userId: number): Promise<{
        id: number;
    }[]>;
    static createFAQ(data: CreateFaqInput): Promise<FaqChatbot>;
    static searchFAQs(text: string, limit?: number): Promise<FaqChatbot[]>;
    static getAllFAQs(filters?: FaqFilters): Promise<FaqChatbot[]>;
    static logDailyStats(date: Date | string, stats: DailyStatsInput): Promise<ChatbotAnalytics>;
}
export default ConversationDAO;
//# sourceMappingURL=conversation.dao.d.ts.map