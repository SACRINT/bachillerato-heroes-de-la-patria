/**
 * 💬 CONVERSATION DAO - TypeScript
 * Gestión de historial de chat, FAQs y analytics
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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

// =====================================================
// CONVERSATION DAO CLASS
// =====================================================

class ConversationDAO {

    // ==========================================
    // HISTORIAL DE CHAT
    // ==========================================

    static async createMessage(data: CreateMessageInput): Promise<ChatHistory> {
        const query = `
            INSERT INTO chat_history (
                user_id, user_message, assistant_message, 
                tokens_used, language, session_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const params = [
            data.user_id,
            data.user_message,
            data.assistant_message,
            data.tokens_used || 0,
            data.language || 'es',
            data.session_id
        ];
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async getHistory(userId: number, limit: number = 20): Promise<ChatHistory[]> {
        const query = `
            SELECT * FROM chat_history 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        return await executeQuery(query, [userId, limit]);
    }

    static async clearHistory(userId: number): Promise<{ id: number }[]> {
        const query = `DELETE FROM chat_history WHERE user_id = $1 RETURNING id`;
        return await executeQuery(query, [userId]);
    }

    // ==========================================
    // FAQs (BASE DE CONOCIMIENTO)
    // ==========================================

    static async createFAQ(data: CreateFaqInput): Promise<FaqChatbot> {
        const query = `
            INSERT INTO faqs_chatbot (
                pregunta, respuesta, categoria, idioma, activo, prioridad
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const params = [
            data.pregunta,
            data.respuesta,
            data.categoria,
            data.idioma || 'es',
            data.activo !== undefined ? data.activo : true,
            data.prioridad || 0
        ];
        const result = await executeQuery(query, params);
        return result[0];
    }

    static async searchFAQs(text: string, limit: number = 5): Promise<FaqChatbot[]> {
        // Búsqueda simple por similitud de texto o full-text search si está configurado
        const query = `
            SELECT * FROM faqs_chatbot
            WHERE activo = true
            AND (
                pregunta ILIKE $1 OR 
                respuesta ILIKE $1
            )
            ORDER BY prioridad DESC
            LIMIT $2
        `;
        const searchPattern = `%${text}%`;
        return await executeQuery(query, [searchPattern, limit]);
    }

    static async getAllFAQs(filters: FaqFilters = {}): Promise<FaqChatbot[]> {
        let query = `SELECT * FROM faqs_chatbot WHERE 1=1`;
        const params: (string | boolean)[] = [];
        let paramIndex = 1;

        if (filters.categoria) {
            query += ` AND categoria = $${paramIndex++}`;
            params.push(filters.categoria);
        }
        if (filters.idioma) {
            query += ` AND idioma = $${paramIndex++}`;
            params.push(filters.idioma);
        }
        if (filters.activo !== undefined) {
            query += ` AND activo = $${paramIndex++}`;
            params.push(filters.activo);
        }

        query += ` ORDER BY prioridad DESC, created_at DESC`;
        return await executeQuery(query, params);
    }

    // ==========================================
    // ANALYTICS
    // ==========================================

    static async logDailyStats(date: Date | string, stats: DailyStatsInput): Promise<ChatbotAnalytics> {
        const query = `
            INSERT INTO chatbot_analytics (
                fecha, total_conversaciones, total_mensajes, 
                usuarios_unicos, tokens_totales
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (fecha) DO UPDATE SET
                total_conversaciones = chatbot_analytics.total_conversaciones + $2,
                total_mensajes = chatbot_analytics.total_mensajes + $3,
                usuarios_unicos = GREATEST(chatbot_analytics.usuarios_unicos, $4),
                tokens_totales = chatbot_analytics.tokens_totales + $5,
                updated_at = NOW()
            RETURNING *
        `;
        const params = [
            date,
            stats.conversations || 0,
            stats.messages || 0,
            stats.unique_users || 0,
            stats.tokens || 0
        ];
        const result = await executeQuery(query, params);
        return result[0];
    }
}

export default ConversationDAO;
module.exports = ConversationDAO;
