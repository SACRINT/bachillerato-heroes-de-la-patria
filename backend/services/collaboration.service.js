const { executeQuery } = require('../config/database.js');

class CollaborationService {

    /**
     * Crea una nueva sesión colaborativa (Pizarra, Documento, Código)
     */
    async createSession(userId, sessionData) {
        const query = `
            INSERT INTO collaboration_sessions (name, session_type, created_by, group_id, current_state)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, session_type
        `;
        const result = await executeQuery(query, [
            sessionData.name,
            sessionData.type || 'whiteboard',
            userId,
            sessionData.groupId || null,
            sessionData.initialState || {}
        ]);

        return result[0];
    }

    /**
     * Une a un usuario a la sesión
     */
    async joinSession(sessionId, userId, role = 'editor') {
        // Verificar si la sesión existe y está activa
        const sessions = await executeQuery('SELECT * FROM collaboration_sessions WHERE id = $1 AND is_active = TRUE', [sessionId]);
        if (sessions.length === 0) throw new Error('Sesión no encontrada o finalizada');

        // Registrar participante
        const query = `
            INSERT INTO collaboration_participants (session_id, user_id, role, last_heartbeat)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (session_id, user_id) 
            DO UPDATE SET last_heartbeat = NOW(), role = $3
            RETURNING *
        `;
        await executeQuery(query, [sessionId, userId, role]);

        return {
            session: sessions[0],
            state: sessions[0].current_state
        };
    }

    /**
     * Guarda el snapshot del estado actual (Para persistencia periódica)
     */
    async saveState(sessionId, stateJson) {
        await executeQuery(
            'UPDATE collaboration_sessions SET current_state = $1, last_activity_at = NOW() WHERE id = $2',
            [stateJson, sessionId]
        );
        return { success: true };
    }

    /**
     * Registra una acción en el historial (opcional, para auditoría)
     */
    async logAction(sessionId, userId, actionType, actionData) {
        await executeQuery(
            'INSERT INTO collaboration_history (session_id, user_id, action_type, action_data) VALUES ($1, $2, $3, $4)',
            [sessionId, userId, actionType, actionData]
        );
    }
}

module.exports = new CollaborationService();
