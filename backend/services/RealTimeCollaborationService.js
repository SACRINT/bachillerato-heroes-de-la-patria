/**
 * Real-Time Collaboration Service
 * Servicio de colaboración en tiempo real con video conferencing
 *
 * @version 1.0.0
 * @author Claude Code - Arquitecto IA
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // WebRTC configuration
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
    },

    // Room configuration
    rooms: {
        maxParticipants: 50,
        defaultDuration: 60 * 60 * 1000, // 1 hour
        recordingEnabled: false
    },

    // Chat configuration
    chat: {
        maxMessageLength: 2000,
        maxHistorySize: 1000
    },

    // Document collaboration
    documents: {
        maxSize: 10 * 1024 * 1024, // 10MB
        autoSaveInterval: 30000 // 30 seconds
    }
};

// ============================================
// SERVICE ERROR CLASS
// ============================================
class ServiceError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

// ============================================
// ROOM MANAGER
// ============================================
class RoomManager {
    constructor(pool) {
        this.pool = pool;
        this.activeRooms = new Map();
    }

    /**
     * Crea una sala de colaboración
     */
    async createRoom(options) {
        const {
            type,           // 'video', 'chat', 'document', 'whiteboard'
            name,
            hostId,
            scheduledStart,
            duration = CONFIG.rooms.defaultDuration,
            maxParticipants = CONFIG.rooms.maxParticipants,
            settings = {}
        } = options;

        const roomId = this._generateRoomId();
        const accessCode = this._generateAccessCode();

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

        try {
            const result = await this.pool.query(query, values);
            const room = result.rows[0];

            // Initialize in memory
            this.activeRooms.set(roomId, {
                ...room,
                participants: new Map(),
                messages: [],
                documentState: null
            });

            console.log(`[COLLAB] Sala creada: ${roomId} (${type})`);

            return {
                roomId,
                accessCode,
                joinUrl: `/collaboration/join/${roomId}`,
                ...room
            };
        } catch (error) {
            console.error('[COLLAB] Error creando sala:', error);
            throw new ServiceError('Error al crear sala', 'ROOM_CREATE_ERROR');
        }
    }

    /**
     * Une a un participante a una sala
     */
    async joinRoom(roomId, userId, options = {}) {
        const room = this.activeRooms.get(roomId);

        if (!room) {
            // Intentar cargar de BD
            const loaded = await this._loadRoom(roomId);
            if (!loaded) {
                throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
            }
        }

        const activeRoom = this.activeRooms.get(roomId);

        // Verificar límite de participantes
        if (activeRoom.participants.size >= activeRoom.max_participants) {
            throw new ServiceError('Sala llena', 'ROOM_FULL', 403);
        }

        // Verificar código de acceso si es requerido
        if (activeRoom.settings.requireAccessCode && options.accessCode !== activeRoom.access_code) {
            throw new ServiceError('Código de acceso inválido', 'INVALID_ACCESS_CODE', 403);
        }

        const participantId = crypto.randomUUID();
        const participant = {
            id: participantId,
            odafiUserId: userId,
            joinedAt: new Date(),
            role: userId === activeRoom.host_id ? 'host' : 'participant',
            mediaState: {
                video: options.video !== false,
                audio: options.audio !== false,
                screen: false
            }
        };

        activeRoom.participants.set(participantId, participant);

        // Registrar en BD
        await this._logParticipant(roomId, userId, 'join');

        // Actualizar status si es primera unión
        if (activeRoom.status === 'created') {
            await this._updateRoomStatus(roomId, 'active');
            activeRoom.status = 'active';
        }

        console.log(`[COLLAB] Usuario ${userId} unido a sala ${roomId}`);

        return {
            participantId,
            role: participant.role,
            participants: Array.from(activeRoom.participants.values()).map(p => ({
                id: p.id,
                role: p.role,
                mediaState: p.mediaState
            })),
            settings: activeRoom.settings,
            iceServers: CONFIG.webrtc.iceServers
        };
    }

    /**
     * Remueve un participante de la sala
     */
    async leaveRoom(roomId, participantId) {
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(participantId);
        if (!participant) return;

        room.participants.delete(participantId);
        await this._logParticipant(roomId, participant.userId, 'leave');

        // Cerrar sala si está vacía
        if (room.participants.size === 0) {
            await this.closeRoom(roomId);
        }

        console.log(`[COLLAB] Participante ${participantId} salió de sala ${roomId}`);
    }

    /**
     * Cierra una sala
     */
    async closeRoom(roomId) {
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        await this._updateRoomStatus(roomId, 'closed');
        this.activeRooms.delete(roomId);

        console.log(`[COLLAB] Sala ${roomId} cerrada`);
    }

    /**
     * Obtiene información de una sala
     */
    async getRoomInfo(roomId) {
        let room = this.activeRooms.get(roomId);

        if (!room) {
            room = await this._loadRoom(roomId);
        }

        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        return {
            roomId: room.room_id,
            type: room.type,
            name: room.name,
            status: room.status,
            participantCount: room.participants ? room.participants.size : 0,
            maxParticipants: room.max_participants,
            scheduledStart: room.scheduled_start,
            settings: room.settings
        };
    }

    /**
     * Lista salas activas para un usuario
     */
    async getUserRooms(userId) {
        const query = `
            SELECT r.*,
                   (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id AND left_at IS NULL) as participant_count
            FROM collaboration_rooms r
            WHERE r.host_id = $1 AND r.status IN ('created', 'active')
            ORDER BY r.created_at DESC
            LIMIT 20
        `;

        try {
            const result = await this.pool.query(query, [userId]);
            return result.rows;
        } catch (error) {
            console.error('[COLLAB] Error obteniendo salas:', error);
            return [];
        }
    }

    // Métodos privados

    _generateRoomId() {
        return `room_${crypto.randomBytes(8).toString('hex')}`;
    }

    _generateAccessCode() {
        return crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    async _loadRoom(roomId) {
        const query = 'SELECT * FROM collaboration_rooms WHERE room_id = $1';

        try {
            const result = await this.pool.query(query, [roomId]);
            if (result.rows.length === 0) return null;

            const room = result.rows[0];
            room.settings = typeof room.settings === 'string' ? JSON.parse(room.settings) : room.settings;

            this.activeRooms.set(roomId, {
                ...room,
                participants: new Map(),
                messages: [],
                documentState: null
            });

            return this.activeRooms.get(roomId);
        } catch (error) {
            console.error('[COLLAB] Error cargando sala:', error);
            return null;
        }
    }

    async _updateRoomStatus(roomId, status) {
        const query = 'UPDATE collaboration_rooms SET status = $1, updated_at = NOW() WHERE room_id = $2';

        try {
            await this.pool.query(query, [status, roomId]);
        } catch (error) {
            console.error('[COLLAB] Error actualizando status:', error);
        }
    }

    async _logParticipant(roomId, odafiUserId, action) {
        if (action === 'join') {
            const query = `
                INSERT INTO room_participants (room_id, user_id, joined_at)
                VALUES ($1, $2, NOW())
            `;
            await this.pool.query(query, [roomId, odafiUserId]).catch(() => {});
        } else {
            const query = `
                UPDATE room_participants
                SET left_at = NOW()
                WHERE room_id = $1 AND user_id = $2 AND left_at IS NULL
            `;
            await this.pool.query(query, [roomId, odafiUserId]).catch(() => {});
        }
    }
}

// ============================================
// VIDEO CONFERENCE MANAGER
// ============================================
class VideoConferenceManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
        this.peerConnections = new Map();
    }

    /**
     * Crea una conferencia de video
     */
    async createConference(options) {
        return this.roomManager.createRoom({
            ...options,
            type: 'video',
            settings: {
                ...options.settings,
                videoEnabled: true,
                audioEnabled: true,
                screenShareEnabled: true,
                recordingEnabled: CONFIG.rooms.recordingEnabled,
                waitingRoom: options.waitingRoom || false
            }
        });
    }

    /**
     * Obtiene configuración SDP para WebRTC
     */
    getWebRTCConfig() {
        return {
            iceServers: CONFIG.webrtc.iceServers,
            iceCandidatePoolSize: CONFIG.webrtc.iceCandidatePoolSize
        };
    }

    /**
     * Procesa señalización WebRTC
     */
    async handleSignaling(roomId, participantId, signal) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        const { type, data, targetParticipantId } = signal;

        // Retornar señal para enviar al target
        return {
            type,
            data,
            fromParticipantId: participantId,
            toParticipantId: targetParticipantId
        };
    }

    /**
     * Actualiza estado de media de participante
     */
    async updateMediaState(roomId, participantId, mediaState) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(participantId);
        if (!participant) return;

        participant.mediaState = { ...participant.mediaState, ...mediaState };

        return {
            participantId,
            mediaState: participant.mediaState
        };
    }

    /**
     * Lista participantes en conferencia
     */
    getParticipants(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return [];

        return Array.from(room.participants.values()).map(p => ({
            id: p.id,
            odafiUserId: p.userId,
            role: p.role,
            mediaState: p.mediaState,
            joinedAt: p.joinedAt
        }));
    }
}

// ============================================
// CHAT MANAGER
// ============================================
class ChatManager {
    constructor(roomManager, pool) {
        this.roomManager = roomManager;
        this.pool = pool;
    }

    /**
     * Envía mensaje a sala
     */
    async sendMessage(roomId, participantId, content, options = {}) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        const participant = room.participants.get(participantId);
        if (!participant) {
            throw new ServiceError('Participante no encontrado', 'PARTICIPANT_NOT_FOUND', 404);
        }

        if (content.length > CONFIG.chat.maxMessageLength) {
            throw new ServiceError('Mensaje muy largo', 'MESSAGE_TOO_LONG', 400);
        }

        const message = {
            id: crypto.randomUUID(),
            roomId,
            participantId,
            userId: participant.userId,
            content,
            type: options.type || 'text', // text, file, system
            replyTo: options.replyTo || null,
            timestamp: new Date(),
            edited: false
        };

        // Agregar a memoria
        room.messages.push(message);
        if (room.messages.length > CONFIG.chat.maxHistorySize) {
            room.messages.shift();
        }

        // Persistir
        await this._persistMessage(message);

        return message;
    }

    /**
     * Obtiene historial de chat
     */
    async getChatHistory(roomId, options = {}) {
        const { limit = 50, before = null } = options;

        const room = this.roomManager.activeRooms.get(roomId);

        // Si está en memoria, retornar de ahí
        if (room && room.messages.length > 0) {
            let messages = room.messages;

            if (before) {
                const index = messages.findIndex(m => m.id === before);
                if (index > 0) {
                    messages = messages.slice(Math.max(0, index - limit), index);
                }
            } else {
                messages = messages.slice(-limit);
            }

            return messages;
        }

        // Cargar de BD
        let query = `
            SELECT * FROM chat_messages
            WHERE room_id = $1
        `;
        const values = [roomId];

        if (before) {
            query += ` AND timestamp < (SELECT timestamp FROM chat_messages WHERE id = $2)`;
            values.push(before);
        }

        query += ` ORDER BY timestamp DESC LIMIT $${values.length + 1}`;
        values.push(limit);

        try {
            const result = await this.pool.query(query, values);
            return result.rows.reverse();
        } catch (error) {
            console.error('[COLLAB] Error obteniendo chat:', error);
            return [];
        }
    }

    /**
     * Edita un mensaje
     */
    async editMessage(roomId, messageId, newContent) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            const message = room.messages.find(m => m.id === messageId);
            if (message) {
                message.content = newContent;
                message.edited = true;
                message.editedAt = new Date();
            }
        }

        const query = `
            UPDATE chat_messages
            SET content = $1, edited = true, edited_at = NOW()
            WHERE id = $2 AND room_id = $3
        `;

        await this.pool.query(query, [newContent, messageId, roomId]).catch(() => {});

        return { messageId, edited: true };
    }

    /**
     * Elimina un mensaje
     */
    async deleteMessage(roomId, messageId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.messages = room.messages.filter(m => m.id !== messageId);
        }

        const query = 'DELETE FROM chat_messages WHERE id = $1 AND room_id = $2';
        await this.pool.query(query, [messageId, roomId]).catch(() => {});

        return { messageId, deleted: true };
    }

    async _persistMessage(message) {
        const query = `
            INSERT INTO chat_messages (
                id, room_id, participant_id, user_id, content, type, reply_to, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        await this.pool.query(query, [
            message.id, message.roomId, message.participantId,
            message.userId, message.content, message.type,
            message.replyTo, message.timestamp
        ]).catch(err => console.error('[COLLAB] Error persistiendo mensaje:', err));
    }
}

// ============================================
// DOCUMENT COLLABORATION MANAGER
// ============================================
class DocumentCollaborationManager {
    constructor(roomManager, pool) {
        this.roomManager = roomManager;
        this.pool = pool;
        this.autoSaveIntervals = new Map();
    }

    /**
     * Crea sesión de colaboración de documento
     */
    async createDocumentSession(options) {
        const room = await this.roomManager.createRoom({
            ...options,
            type: 'document',
            settings: {
                ...options.settings,
                documentId: options.documentId,
                autoSave: true
            }
        });

        // Cargar documento inicial
        const documentState = await this._loadDocument(options.documentId);
        const activeRoom = this.roomManager.activeRooms.get(room.roomId);
        if (activeRoom) {
            activeRoom.documentState = documentState;
        }

        // Iniciar auto-guardado
        this._startAutoSave(room.roomId);

        return room;
    }

    /**
     * Aplica operación al documento
     */
    async applyOperation(roomId, participantId, operation) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) {
            throw new ServiceError('Sala no encontrada', 'ROOM_NOT_FOUND', 404);
        }

        // Aplicar operación (simplified OT)
        const { type, position, content, length } = operation;

        if (!room.documentState) {
            room.documentState = { content: '', version: 0 };
        }

        let newContent = room.documentState.content;

        switch (type) {
            case 'insert':
                newContent = newContent.slice(0, position) + content + newContent.slice(position);
                break;
            case 'delete':
                newContent = newContent.slice(0, position) + newContent.slice(position + length);
                break;
            case 'replace':
                newContent = newContent.slice(0, position) + content + newContent.slice(position + length);
                break;
        }

        room.documentState.content = newContent;
        room.documentState.version++;
        room.documentState.lastModified = new Date();
        room.documentState.lastModifiedBy = participantId;

        return {
            version: room.documentState.version,
            operation,
            participantId
        };
    }

    /**
     * Obtiene estado actual del documento
     */
    getDocumentState(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.documentState) {
            return null;
        }

        return {
            content: room.documentState.content,
            version: room.documentState.version,
            lastModified: room.documentState.lastModified
        };
    }

    /**
     * Guarda documento manualmente
     */
    async saveDocument(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.documentState) return;

        const documentId = room.settings.documentId;
        await this._persistDocument(documentId, room.documentState);

        console.log(`[COLLAB] Documento guardado: ${documentId}`);
    }

    async _loadDocument(documentId) {
        const query = 'SELECT content, version FROM collaborative_documents WHERE id = $1';

        try {
            const result = await this.pool.query(query, [documentId]);
            if (result.rows.length > 0) {
                return {
                    content: result.rows[0].content || '',
                    version: result.rows[0].version || 0
                };
            }
        } catch (error) {
            console.error('[COLLAB] Error cargando documento:', error);
        }

        return { content: '', version: 0 };
    }

    async _persistDocument(documentId, state) {
        const query = `
            INSERT INTO collaborative_documents (id, content, version, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id) DO UPDATE SET
                content = EXCLUDED.content,
                version = EXCLUDED.version,
                updated_at = NOW()
        `;

        await this.pool.query(query, [documentId, state.content, state.version])
            .catch(err => console.error('[COLLAB] Error guardando documento:', err));
    }

    _startAutoSave(roomId) {
        const interval = setInterval(async () => {
            await this.saveDocument(roomId);
        }, CONFIG.documents.autoSaveInterval);

        this.autoSaveIntervals.set(roomId, interval);
    }

    stopAutoSave(roomId) {
        const interval = this.autoSaveIntervals.get(roomId);
        if (interval) {
            clearInterval(interval);
            this.autoSaveIntervals.delete(roomId);
        }
    }
}

// ============================================
// WHITEBOARD MANAGER
// ============================================
class WhiteboardManager {
    constructor(roomManager) {
        this.roomManager = roomManager;
    }

    /**
     * Crea sesión de pizarra
     */
    async createWhiteboardSession(options) {
        return this.roomManager.createRoom({
            ...options,
            type: 'whiteboard',
            settings: {
                ...options.settings,
                canvasWidth: options.canvasWidth || 1920,
                canvasHeight: options.canvasHeight || 1080
            }
        });
    }

    /**
     * Agrega elemento a la pizarra
     */
    addElement(roomId, participantId, element) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room) return null;

        if (!room.whiteboardElements) {
            room.whiteboardElements = [];
        }

        const newElement = {
            id: crypto.randomUUID(),
            ...element,
            createdBy: participantId,
            createdAt: new Date()
        };

        room.whiteboardElements.push(newElement);

        return newElement;
    }

    /**
     * Actualiza elemento de la pizarra
     */
    updateElement(roomId, elementId, updates) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements) return null;

        const element = room.whiteboardElements.find(e => e.id === elementId);
        if (!element) return null;

        Object.assign(element, updates, { updatedAt: new Date() });

        return element;
    }

    /**
     * Elimina elemento de la pizarra
     */
    removeElement(roomId, elementId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (!room || !room.whiteboardElements) return;

        room.whiteboardElements = room.whiteboardElements.filter(e => e.id !== elementId);
    }

    /**
     * Obtiene todos los elementos de la pizarra
     */
    getElements(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        return room?.whiteboardElements || [];
    }

    /**
     * Limpia la pizarra
     */
    clearWhiteboard(roomId) {
        const room = this.roomManager.activeRooms.get(roomId);
        if (room) {
            room.whiteboardElements = [];
        }
    }
}

// ============================================
// MAIN SERVICE
// ============================================
class RealTimeCollaborationService {
    constructor() {
        this.pool = null;
        this.roomManager = null;
        this.videoConference = null;
        this.chat = null;
        this.documentCollab = null;
        this.whiteboard = null;
        this.initialized = false;
    }

    /**
     * Inicializa el servicio
     */
    async initialize(pool) {
        if (this.initialized) return;

        this.pool = pool || new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        this.roomManager = new RoomManager(this.pool);
        this.videoConference = new VideoConferenceManager(this.roomManager);
        this.chat = new ChatManager(this.roomManager, this.pool);
        this.documentCollab = new DocumentCollaborationManager(this.roomManager, this.pool);
        this.whiteboard = new WhiteboardManager(this.roomManager);

        this.initialized = true;
        console.log('[COLLAB] Real-Time Collaboration Service inicializado');
    }

    // ============================================
    // VIDEO CONFERENCE METHODS
    // ============================================

    async createVideoConference(options) {
        return this.videoConference.createConference(options);
    }

    async joinVideoConference(roomId, userId, options) {
        return this.roomManager.joinRoom(roomId, userId, options);
    }

    async leaveVideoConference(roomId, participantId) {
        return this.roomManager.leaveRoom(roomId, participantId);
    }

    getWebRTCConfig() {
        return this.videoConference.getWebRTCConfig();
    }

    async handleSignaling(roomId, participantId, signal) {
        return this.videoConference.handleSignaling(roomId, participantId, signal);
    }

    async updateMediaState(roomId, participantId, mediaState) {
        return this.videoConference.updateMediaState(roomId, participantId, mediaState);
    }

    // ============================================
    // CHAT METHODS
    // ============================================

    async sendChatMessage(roomId, participantId, content, options) {
        return this.chat.sendMessage(roomId, participantId, content, options);
    }

    async getChatHistory(roomId, options) {
        return this.chat.getChatHistory(roomId, options);
    }

    async editChatMessage(roomId, messageId, newContent) {
        return this.chat.editMessage(roomId, messageId, newContent);
    }

    async deleteChatMessage(roomId, messageId) {
        return this.chat.deleteMessage(roomId, messageId);
    }

    // ============================================
    // DOCUMENT COLLABORATION METHODS
    // ============================================

    async createDocumentSession(options) {
        return this.documentCollab.createDocumentSession(options);
    }

    async applyDocumentOperation(roomId, participantId, operation) {
        return this.documentCollab.applyOperation(roomId, participantId, operation);
    }

    getDocumentState(roomId) {
        return this.documentCollab.getDocumentState(roomId);
    }

    async saveDocument(roomId) {
        return this.documentCollab.saveDocument(roomId);
    }

    // ============================================
    // WHITEBOARD METHODS
    // ============================================

    async createWhiteboardSession(options) {
        return this.whiteboard.createWhiteboardSession(options);
    }

    addWhiteboardElement(roomId, participantId, element) {
        return this.whiteboard.addElement(roomId, participantId, element);
    }

    updateWhiteboardElement(roomId, elementId, updates) {
        return this.whiteboard.updateElement(roomId, elementId, updates);
    }

    removeWhiteboardElement(roomId, elementId) {
        return this.whiteboard.removeElement(roomId, elementId);
    }

    getWhiteboardElements(roomId) {
        return this.whiteboard.getElements(roomId);
    }

    clearWhiteboard(roomId) {
        return this.whiteboard.clearWhiteboard(roomId);
    }

    // ============================================
    // GENERAL ROOM METHODS
    // ============================================

    async getRoomInfo(roomId) {
        return this.roomManager.getRoomInfo(roomId);
    }

    async getUserRooms(userId) {
        return this.roomManager.getUserRooms(userId);
    }

    async closeRoom(roomId) {
        // Guardar documento si existe
        const room = this.roomManager.activeRooms.get(roomId);
        if (room && room.type === 'document') {
            this.documentCollab.stopAutoSave(roomId);
            await this.documentCollab.saveDocument(roomId);
        }

        return this.roomManager.closeRoom(roomId);
    }

    getParticipants(roomId) {
        return this.videoConference.getParticipants(roomId);
    }
}

// ============================================
// EXPORT
// ============================================
const collaborationService = new RealTimeCollaborationService();

module.exports = {
    RealTimeCollaborationService,
    collaborationService,
    ServiceError
};
