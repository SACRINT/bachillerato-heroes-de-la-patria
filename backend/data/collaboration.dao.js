/**
 * Collaboration DAO
 * Capa de acceso a datos para sistema de colaboración en tiempo real
 * Incluye: salas, participantes, chat, documentos colaborativos
 * 
 * @version 1.0.0
 * @module data/collaboration.dao
 */

const { pool } = require('../config/database');

// ============================================
// ROOM QUERIES
// ============================================

/**
 * Crea una sala de colaboración
 * @param {Object} roomData - Datos de la sala
 * @returns {Promise<Object>}
 */
async function createRoom(roomData) {
    const { roomId, type, name, hostId, accessCode, scheduledStart, duration, maxParticipants, settings } = roomData;

    const query = `
        INSERT INTO collaboration_rooms (
            room_id, type, name, host_id, access_code,
            scheduled_start, duration_ms, max_participants,
            settings, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'created', NOW())
        RETURNING *
    `;

    const values = [
        roomId, type, name, hostId, accessCode,
        scheduledStart, duration, maxParticipants,
        JSON.stringify(settings)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
}

/**
 * Carga una sala por ID
 * @param {string} roomId - ID de la sala
 * @returns {Promise<Object|null>}
 */
async function getRoomById(roomId) {
    const query = 'SELECT * FROM collaboration_rooms WHERE room_id = $1';
    const result = await pool.query(query, [roomId]);
    return result.rows[0] || null;
}

/**
 * Obtiene salas de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>}
 */
async function getUserRooms(userId) {
    const query = `
        SELECT r.*,
               (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id AND left_at IS NULL) as participant_count
        FROM collaboration_rooms r
        WHERE r.host_id = $1 AND r.status IN ('created', 'active')
        ORDER BY r.created_at DESC
        LIMIT 20
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

/**
 * Actualiza el estado de una sala
 * @param {string} roomId - ID de la sala
 * @param {string} status - Nuevo estado
 * @returns {Promise<void>}
 */
async function updateRoomStatus(roomId, status) {
    const query = 'UPDATE collaboration_rooms SET status = $1, updated_at = NOW() WHERE room_id = $2';
    await pool.query(query, [status, roomId]);
}

// ============================================
// PARTICIPANT QUERIES
// ============================================

/**
 * Registra unión de participante a sala
 * @param {string} roomId - ID de la sala
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function logParticipantJoin(roomId, userId) {
    const query = `
        INSERT INTO room_participants (room_id, user_id, joined_at)
        VALUES ($1, $2, NOW())
    `;
    await pool.query(query, [roomId, userId]).catch(() => { });
}

/**
 * Registra salida de participante de sala
 * @param {string} roomId - ID de la sala
 * @param {number} userId - ID del usuario
 * @returns {Promise<void>}
 */
async function logParticipantLeave(roomId, userId) {
    const query = `
        UPDATE room_participants
        SET left_at = NOW()
        WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
    `;
    await pool.query(query, [roomId, userId]).catch(() => { });
}

// ============================================
// CHAT QUERIES
// ============================================

/**
 * Guarda mensaje de chat
 * @param {Object} message - Datos del mensaje
 * @returns {Promise<void>}
 */
async function persistChatMessage(message) {
    const query = `
        INSERT INTO chat_messages (
            id, room_id, participant_id, user_id, content, type, reply_to, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [
        message.id, message.roomId, message.participantId,
        message.userId, message.content, message.type,
        message.replyTo, message.timestamp
    ]).catch(err => console.error('[COLLAB-DAO] Error persistiendo mensaje:', err));
}

/**
 * Obtiene historial de chat
 * @param {string} roomId - ID de la sala
 * @param {Object} options - Opciones de paginación
 * @returns {Promise<Array>}
 */
async function getChatHistory(roomId, options = {}) {
    const { limit = 50, before = null } = options;

    let query = `SELECT * FROM chat_messages WHERE room_id = $1`;
    const values = [roomId];

    if (before) {
        query += ` AND timestamp < (SELECT timestamp FROM chat_messages WHERE id = $2)`;
        values.push(before);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows.reverse();
}

/**
 * Edita un mensaje de chat
 * @param {string} roomId - ID de la sala
 * @param {string} messageId - ID del mensaje
 * @param {string} newContent - Nuevo contenido
 * @returns {Promise<void>}
 */
async function editChatMessage(roomId, messageId, newContent) {
    const query = `
        UPDATE chat_messages
        SET content = $1, edited = true, edited_at = NOW()
        WHERE id = $2 AND room_id = $3
    `;
    await pool.query(query, [newContent, messageId, roomId]).catch(() => { });
}

/**
 * Elimina un mensaje de chat
 * @param {string} roomId - ID de la sala
 * @param {string} messageId - ID del mensaje
 * @returns {Promise<void>}
 */
async function deleteChatMessage(roomId, messageId) {
    const query = 'DELETE FROM chat_messages WHERE id = $1 AND room_id = $2';
    await pool.query(query, [messageId, roomId]).catch(() => { });
}

// ============================================
// DOCUMENT QUERIES
// ============================================

/**
 * Carga documento colaborativo
 * @param {string} documentId - ID del documento
 * @returns {Promise<Object>}
 */
async function loadDocument(documentId) {
    const query = 'SELECT content, version FROM collaborative_documents WHERE id = $1';
    const result = await pool.query(query, [documentId]);

    if (result.rows.length > 0) {
        return {
            content: result.rows[0].content || '',
            version: result.rows[0].version || 0
        };
    }

    return { content: '', version: 0 };
}

/**
 * Guarda documento colaborativo
 * @param {string} documentId - ID del documento
 * @param {Object} state - Estado del documento
 * @returns {Promise<void>}
 */
async function persistDocument(documentId, state) {
    const query = `
        INSERT INTO collaborative_documents (id, content, version, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            version = EXCLUDED.version,
            updated_at = NOW()
    `;
    await pool.query(query, [documentId, state.content, state.version])
        .catch(err => console.error('[COLLAB-DAO] Error guardando documento:', err));
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Rooms
    createRoom,
    getRoomById,
    getUserRooms,
    updateRoomStatus,

    // Participants
    logParticipantJoin,
    logParticipantLeave,

    // Chat
    persistChatMessage,
    getChatHistory,
    editChatMessage,
    deleteChatMessage,

    // Documents
    loadDocument,
    persistDocument
};
