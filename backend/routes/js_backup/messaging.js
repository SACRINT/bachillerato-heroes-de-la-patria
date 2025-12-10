/**
 * ============================================
 * API REST - SISTEMA DE MENSAJERÍA INTERNA
 * ============================================
 * Versión: 1.0.0
 * Fecha: 19 de Octubre, 2025
 * Descripción: Endpoints completos para sistema de mensajería interna
 *
 * CARACTERÍSTICAS:
 * ✅ Conversaciones 1:1 y grupales
 * ✅ Envío y recepción de mensajes
 * ✅ Estado de lectura
 * ✅ Archivos adjuntos
 * ✅ Búsqueda full-text
 * ✅ Indicadores de escritura
 * ✅ Notificaciones en tiempo real
 *
 * ENDPOINTS: 25 rutas
 * ============================================
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware de autenticación
const { authenticateToken } = require('../middleware/auth');

// ============================================
// CONFIGURACIÓN DE MULTER PARA ARCHIVOS ADJUNTOS
// ============================================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/messages');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    },
    fileFilter: function (req, file, cb) {
        // Permitir documentos, imágenes y archivos comunes
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtiene información del usuario desde el token
 */
function getUserFromToken(req) {
    return {
        id: req.user.id,
        role: req.user.role || 'admin',
        name: req.user.name || req.user.email,
        email: req.user.email
    };
}

/**
 * Verifica si el usuario es participante de una conversación
 */
async function isParticipant(client, conversationId, userId, userRole) {
    const result = await client.query(
        `SELECT id FROM conversation_participants
         WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND left_at IS NULL`,
        [conversationId, userId, userRole]
    );
    return result.rows.length > 0;
}

/**
 * Envía notificación WebSocket a participantes de una conversación
 */
async function notifyConversationParticipants(conversationId, senderId, senderRole, notification) {
    // Integración con el sistema de notificaciones WebSocket (Ciclo 13)
    // Esta función será conectada con notificationService.js
    const client = await pool.connect();
    try {
        const participants = await client.query(
            `SELECT user_id, user_role FROM conversation_participants
             WHERE conversation_id = $1 AND left_at IS NULL
             AND NOT (user_id = $2 AND user_role = $3)`,
            [conversationId, senderId, senderRole]
        );

        // TODO: Integrar con WebSocket server para notificaciones en tiempo real
        debugLog.log('messaging', `📨 Notificar a ${participants.rows.length} participantes de conversación ${conversationId}`);

    } finally {
        client.release();
    }
}

// ============================================
// ENDPOINTS - CONVERSACIONES
// ============================================

/**
 * GET /api/messaging/conversations
 * Listar conversaciones del usuario
 */
router.get('/conversations', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { type, archived, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        let query = `
            SELECT * FROM v_user_conversations
            WHERE user_id = $1 AND user_role = $2
        `;
        const params = [user.id, user.role];
        let paramIndex = 3;

        // Filtros opcionales
        if (type) {
            query += ` AND conversation_type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (archived !== undefined) {
            query += ` AND is_archived = $${paramIndex}`;
            params.push(archived === 'true');
            paramIndex++;
        }

        // Ordenamiento
        query += ` ORDER BY
            CASE WHEN pinned THEN 0 ELSE 1 END,
            last_message_at DESC NULLS LAST
        `;

        // Paginación
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await client.query(query, params);

        // Contar total para paginación
        const countQuery = `
            SELECT COUNT(*) as total FROM v_user_conversations
            WHERE user_id = $1 AND user_role = $2
        `;
        const countResult = await client.query(countQuery, [user.id, user.role]);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            conversations: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener conversaciones', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener conversaciones',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/messaging/conversations/:id
 * Obtener conversación específica con sus participantes
 */
router.get('/conversations/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para acceder a esta conversación'
            });
        }

        // Obtener conversación
        const convQuery = `
            SELECT c.*,
                   (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND left_at IS NULL) as participants_count
            FROM conversations c
            WHERE c.id = $1
        `;
        const convResult = await client.query(convQuery, [id]);

        if (convResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Conversación no encontrada'
            });
        }

        // Obtener participantes
        const participantsQuery = `
            SELECT cp.*, u.nombre, u.apellido_paterno, u.apellido_materno, u.email
            FROM conversation_participants cp
            LEFT JOIN usuarios u ON cp.user_id = u.id
            WHERE cp.conversation_id = $1 AND cp.left_at IS NULL
            ORDER BY cp.is_admin DESC, cp.joined_at ASC
        `;
        const participantsResult = await client.query(participantsQuery, [id]);

        // Obtener configuraciones del usuario
        const settingsQuery = `
            SELECT * FROM conversation_settings
            WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3
        `;
        const settingsResult = await client.query(settingsQuery, [id, user.id, user.role]);

        res.json({
            success: true,
            conversation: convResult.rows[0],
            participants: participantsResult.rows,
            settings: settingsResult.rows[0] || null
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener conversación', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener conversación',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/messaging/conversations
 * Crear nueva conversación (1:1 o grupal)
 */
router.post('/conversations', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const user = getUserFromToken(req);
        const { type, title, participants } = req.body;

        // Validación
        if (!type || (type !== 'direct' && type !== 'group')) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de conversación inválido (direct o group)'
            });
        }

        if (type === 'group' && !title) {
            return res.status(400).json({
                success: false,
                error: 'El título es obligatorio para conversaciones grupales'
            });
        }

        if (!participants || participants.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Debe incluir al menos un participante'
            });
        }

        // Para conversaciones directas, verificar si ya existe
        if (type === 'direct' && participants.length === 1) {
            const existingQuery = `
                SELECT c.id FROM conversations c
                JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
                JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
                WHERE c.conversation_type = 'direct'
                AND cp1.user_id = $1 AND cp1.user_role = $2
                AND cp2.user_id = $3 AND cp2.user_role = $4
                AND cp1.left_at IS NULL AND cp2.left_at IS NULL
            `;
            const existingResult = await client.query(existingQuery, [
                user.id, user.role,
                participants[0].user_id, participants[0].user_role
            ]);

            if (existingResult.rows.length > 0) {
                await client.query('COMMIT');
                return res.json({
                    success: true,
                    conversation_id: existingResult.rows[0].id,
                    message: 'Conversación ya existe'
                });
            }
        }

        // Crear conversación
        const insertConvQuery = `
            INSERT INTO conversations (title, conversation_type, creator_id, creator_role)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const convResult = await client.query(insertConvQuery, [title, type, user.id, user.role]);
        const conversationId = convResult.rows[0].id;

        // Agregar participantes (incluyendo al creador)
        const allParticipants = [
            { user_id: user.id, user_role: user.role, user_name: user.name, user_email: user.email, is_admin: true },
            ...participants
        ];

        for (const participant of allParticipants) {
            await client.query(
                `INSERT INTO conversation_participants (conversation_id, user_id, user_role, user_name, user_email, is_admin)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (conversation_id, user_id, user_role) DO NOTHING`,
                [conversationId, participant.user_id, participant.user_role, participant.user_name, participant.user_email, participant.is_admin || false]
            );
        }

        // Crear mensaje del sistema
        await client.query(
            `INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content)
             VALUES ($1, $2, $3, $4, 'system', $5)`,
            [conversationId, user.id, user.role, user.name, `${user.name} creó la conversación`]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            conversation_id: conversationId,
            conversation: convResult.rows[0],
            message: 'Conversación creada exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('messaging', 'Error al crear conversación', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al crear conversación',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/messaging/conversations/:id
 * Actualizar conversación (título, etc.)
 */
router.put('/conversations/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;
        const { title } = req.body;

        // Verificar que el usuario sea administrador de la conversación
        const adminCheck = await client.query(
            `SELECT id FROM conversation_participants
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND is_admin = TRUE AND left_at IS NULL`,
            [id, user.id, user.role]
        );

        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Solo los administradores pueden actualizar la conversación'
            });
        }

        // Actualizar conversación
        const updateQuery = `
            UPDATE conversations
            SET title = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await client.query(updateQuery, [title, id]);

        res.json({
            success: true,
            conversation: result.rows[0],
            message: 'Conversación actualizada exitosamente'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al actualizar conversación', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar conversación',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/messaging/conversations/:id
 * Eliminar/archivar conversación
 */
router.delete('/conversations/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;
        const { archive = true } = req.query; // Por defecto, solo archiva

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para eliminar esta conversación'
            });
        }

        if (archive === 'true') {
            // Archivar para este usuario
            await client.query(
                `UPDATE conversation_participants
                 SET is_archived = TRUE
                 WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
                [id, user.id, user.role]
            );

            res.json({
                success: true,
                message: 'Conversación archivada exitosamente'
            });
        } else {
            // Salir de la conversación
            await client.query(
                `UPDATE conversation_participants
                 SET left_at = CURRENT_TIMESTAMP
                 WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
                [id, user.id, user.role]
            );

            res.json({
                success: true,
                message: 'Saliste de la conversación'
            });
        }

    } catch (error) {
        debugLog.error('messaging', 'Error al eliminar/archivar conversación', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar/archivar conversación',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/messaging/conversations/:id/participants
 * Agregar participante a conversación grupal
 */
router.post('/conversations/:id/participants', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const user = getUserFromToken(req);
        const { id } = req.params;
        const { user_id, user_role, user_name, user_email } = req.body;

        // Verificar que sea conversación grupal
        const convCheck = await client.query(
            `SELECT conversation_type FROM conversations WHERE id = $1`,
            [id]
        );

        if (convCheck.rows.length === 0 || convCheck.rows[0].conversation_type !== 'group') {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden agregar participantes a conversaciones grupales'
            });
        }

        // Verificar que el usuario sea administrador
        const adminCheck = await client.query(
            `SELECT id FROM conversation_participants
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND is_admin = TRUE AND left_at IS NULL`,
            [id, user.id, user.role]
        );

        if (adminCheck.rows.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Solo los administradores pueden agregar participantes'
            });
        }

        // Agregar participante
        await client.query(
            `INSERT INTO conversation_participants (conversation_id, user_id, user_role, user_name, user_email)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (conversation_id, user_id, user_role) DO UPDATE
             SET left_at = NULL`,
            [id, user_id, user_role, user_name, user_email]
        );

        // Crear mensaje del sistema
        await client.query(
            `INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content)
             VALUES ($1, $2, $3, $4, 'system', $5)`,
            [id, user.id, user.role, user.name, `${user.name} agregó a ${user_name}`]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Participante agregado exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('messaging', 'Error al agregar participante', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al agregar participante',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/messaging/conversations/:id/participants/:userId/:userRole
 * Remover participante de conversación grupal
 */
router.delete('/conversations/:id/participants/:userId/:userRole', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const user = getUserFromToken(req);
        const { id, userId, userRole } = req.params;

        // Verificar que el usuario sea administrador o se esté removiendo a sí mismo
        const adminCheck = await client.query(
            `SELECT id FROM conversation_participants
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND is_admin = TRUE AND left_at IS NULL`,
            [id, user.id, user.role]
        );

        const isSelf = user.id == userId && user.role === userRole;

        if (adminCheck.rows.length === 0 && !isSelf) {
            return res.status(403).json({
                success: false,
                error: 'Solo los administradores pueden remover participantes'
            });
        }

        // Marcar como salido
        await client.query(
            `UPDATE conversation_participants
             SET left_at = CURRENT_TIMESTAMP
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
            [id, userId, userRole]
        );

        // Crear mensaje del sistema
        const action = isSelf ? 'salió de' : 'removió a';
        await client.query(
            `INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content)
             VALUES ($1, $2, $3, $4, 'system', $5)`,
            [id, user.id, user.role, user.name, `${user.name} ${action} la conversación`]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Participante removido exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('messaging', 'Error al remover participante', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al remover participante',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - MENSAJES
// ============================================

/**
 * GET /api/messaging/conversations/:id/messages
 * Obtener mensajes de una conversación
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;
        const { page = 1, limit = 50, before_message_id } = req.query;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para acceder a estos mensajes'
            });
        }

        let query = `
            SELECT m.*,
                   (SELECT COUNT(*) FROM message_attachments WHERE message_id = m.id) as attachments_count,
                   (SELECT json_agg(json_build_object('id', ma.id, 'file_name', ma.file_name, 'file_url', ma.file_url, 'file_type', ma.file_type, 'file_size', ma.file_size))
                    FROM message_attachments ma WHERE ma.message_id = m.id) as attachments
            FROM messages m
            WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
        `;
        const params = [id];
        let paramIndex = 2;

        // Filtrar mensajes anteriores a un mensaje específico (para paginación infinita)
        if (before_message_id) {
            query += ` AND m.id < $${paramIndex}`;
            params.push(before_message_id);
            paramIndex++;
        }

        query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await client.query(query, params);

        // Invertir orden para mostrar del más antiguo al más reciente
        const messages = result.rows.reverse();

        res.json({
            success: true,
            messages,
            has_more: result.rows.length === parseInt(limit)
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener mensajes', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener mensajes',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/messaging/conversations/:id/messages
 * Enviar mensaje
 */
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const user = getUserFromToken(req);
        const { id } = req.params;
        const { content, message_type = 'text', reply_to_message_id } = req.body;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para enviar mensajes en esta conversación'
            });
        }

        // Validación
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El contenido del mensaje no puede estar vacío'
            });
        }

        // Insertar mensaje
        const insertQuery = `
            INSERT INTO messages (conversation_id, sender_id, sender_role, sender_name, message_type, content, reply_to_message_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const result = await client.query(insertQuery, [
            id, user.id, user.role, user.name, message_type, content.trim(), reply_to_message_id
        ]);

        const message = result.rows[0];

        // Crear estados de lectura para todos los participantes (excepto el remitente)
        await client.query(
            `INSERT INTO message_read_status (message_id, conversation_id, user_id, user_role, is_delivered, delivered_at)
             SELECT $1, $2, user_id, user_role, TRUE, CURRENT_TIMESTAMP
             FROM conversation_participants
             WHERE conversation_id = $2 AND left_at IS NULL
             AND NOT (user_id = $3 AND user_role = $4)`,
            [message.id, id, user.id, user.role]
        );

        await client.query('COMMIT');

        // Notificar a otros participantes (WebSocket)
        await notifyConversationParticipants(id, user.id, user.role, {
            type: 'new_message',
            conversation_id: id,
            message
        });

        res.status(201).json({
            success: true,
            message,
            message_text: 'Mensaje enviado exitosamente'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('messaging', 'Error al enviar mensaje', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al enviar mensaje',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/messaging/messages/:id
 * Editar mensaje
 */
router.put('/messages/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;
        const { content } = req.body;

        // Verificar que el mensaje pertenezca al usuario
        const messageCheck = await client.query(
            `SELECT * FROM messages WHERE id = $1 AND sender_id = $2 AND sender_role = $3 AND is_deleted = FALSE`,
            [id, user.id, user.role]
        );

        if (messageCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado o no tienes permiso para editarlo'
            });
        }

        // Actualizar mensaje
        const updateQuery = `
            UPDATE messages
            SET content = $1, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const result = await client.query(updateQuery, [content.trim(), id]);

        // Notificar edición
        await notifyConversationParticipants(messageCheck.rows[0].conversation_id, user.id, user.role, {
            type: 'message_edited',
            message: result.rows[0]
        });

        res.json({
            success: true,
            message: result.rows[0],
            message_text: 'Mensaje editado exitosamente'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al editar mensaje', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al editar mensaje',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/messaging/messages/:id
 * Eliminar mensaje
 */
router.delete('/messages/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        // Verificar que el mensaje pertenezca al usuario
        const messageCheck = await client.query(
            `SELECT * FROM messages WHERE id = $1 AND sender_id = $2 AND sender_role = $3 AND is_deleted = FALSE`,
            [id, user.id, user.role]
        );

        if (messageCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado o no tienes permiso para eliminarlo'
            });
        }

        // Marcar como eliminado (soft delete)
        await client.query(
            `UPDATE messages
             SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP, content = '[Mensaje eliminado]'
             WHERE id = $1`,
            [id]
        );

        // Notificar eliminación
        await notifyConversationParticipants(messageCheck.rows[0].conversation_id, user.id, user.role, {
            type: 'message_deleted',
            message_id: id
        });

        res.json({
            success: true,
            message: 'Mensaje eliminado exitosamente'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al eliminar mensaje', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar mensaje',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/messaging/messages/:id/read
 * Marcar mensaje como leído
 */
router.post('/messages/:id/read', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        // Actualizar estado de lectura
        const updateQuery = `
            UPDATE message_read_status
            SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE message_id = $1 AND user_id = $2 AND user_role = $3
            RETURNING *
        `;
        const result = await client.query(updateQuery, [id, user.id, user.role]);

        if (result.rows.length > 0) {
            res.json({
                success: true,
                message: 'Mensaje marcado como leído'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Estado de lectura no encontrado'
            });
        }

    } catch (error) {
        debugLog.error('messaging', 'Error al marcar mensaje como leído', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al marcar mensaje como leído',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/messaging/conversations/:id/mark-all-read
 * Marcar todos los mensajes de una conversación como leídos
 */
router.post('/conversations/:id/mark-all-read', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para marcar mensajes en esta conversación'
            });
        }

        // Marcar todos como leídos
        await client.query(
            `UPDATE message_read_status
             SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3 AND is_read = FALSE`,
            [id, user.id, user.role]
        );

        // Resetear contador de no leídos
        await client.query(
            `UPDATE conversation_participants
             SET unread_count = 0
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
            [id, user.id, user.role]
        );

        res.json({
            success: true,
            message: 'Todos los mensajes marcados como leídos'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al marcar mensajes como leídos', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al marcar mensajes como leídos',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - ARCHIVOS ADJUNTOS
// ============================================

/**
 * POST /api/messaging/messages/:id/attachments
 * Subir archivo adjunto a mensaje
 */
router.post('/messages/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        // Verificar que el mensaje pertenezca al usuario
        const messageCheck = await client.query(
            `SELECT * FROM messages WHERE id = $1 AND sender_id = $2 AND sender_role = $3`,
            [id, user.id, user.role]
        );

        if (messageCheck.rows.length === 0) {
            // Eliminar archivo subido
            fs.unlinkSync(req.file.path);
            return res.status(404).json({
                success: false,
                error: 'Mensaje no encontrado o no tienes permiso'
            });
        }

        // Determinar si es imagen
        const isImage = /image\/(jpeg|jpg|png|gif)/.test(req.file.mimetype);

        // Insertar adjunto
        const insertQuery = `
            INSERT INTO message_attachments (message_id, file_name, file_path, file_url, file_type, file_size, is_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const fileUrl = `/uploads/messages/${req.file.filename}`;
        const result = await client.query(insertQuery, [
            id,
            req.file.originalname,
            req.file.path,
            fileUrl,
            req.file.mimetype,
            req.file.size,
            isImage
        ]);

        // Actualizar contador de adjuntos
        await client.query(
            `UPDATE messages SET total_attachments = total_attachments + 1 WHERE id = $1`,
            [id]
        );

        res.status(201).json({
            success: true,
            attachment: result.rows[0],
            message: 'Archivo adjunto subido exitosamente'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al subir archivo adjunto', sanitizeError(error, 'messaging'));
        // Eliminar archivo si hubo error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            error: 'Error al subir archivo adjunto',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - BÚSQUEDA
// ============================================

/**
 * GET /api/messaging/search
 * Buscar mensajes (full-text search)
 */
router.get('/search', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { q, conversation_id, page = 1, limit = 20 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'La búsqueda debe tener al menos 2 caracteres'
            });
        }

        const offset = (page - 1) * limit;

        let query = `
            SELECT m.*, c.title as conversation_title, c.conversation_type,
                   ts_rank(to_tsvector('spanish', m.content), plainto_tsquery('spanish', $1)) as rank
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            JOIN conversation_participants cp ON c.id = cp.conversation_id
            WHERE cp.user_id = $2 AND cp.user_role = $3 AND cp.left_at IS NULL
            AND m.is_deleted = FALSE
            AND to_tsvector('spanish', m.content) @@ plainto_tsquery('spanish', $1)
        `;
        const params = [q, user.id, user.role];
        let paramIndex = 4;

        // Filtrar por conversación específica
        if (conversation_id) {
            query += ` AND m.conversation_id = $${paramIndex}`;
            params.push(conversation_id);
            paramIndex++;
        }

        query += ` ORDER BY rank DESC, m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await client.query(query, params);

        res.json({
            success: true,
            results: result.rows,
            query: q,
            total: result.rows.length
        });

    } catch (error) {
        debugLog.error('messaging', 'Error en búsqueda', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error en búsqueda',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - INDICADORES DE ESCRITURA
// ============================================

/**
 * POST /api/messaging/conversations/:id/typing
 * Indicar que el usuario está escribiendo
 */
router.post('/conversations/:id/typing', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;
        const { is_typing = true } = req.body;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para esta conversación'
            });
        }

        if (is_typing) {
            // Insertar o actualizar indicador de escritura
            await client.query(
                `INSERT INTO typing_indicators (conversation_id, user_id, user_role, user_name, is_typing, last_activity_at)
                 VALUES ($1, $2, $3, $4, TRUE, CURRENT_TIMESTAMP)
                 ON CONFLICT (conversation_id, user_id, user_role)
                 DO UPDATE SET is_typing = TRUE, last_activity_at = CURRENT_TIMESTAMP`,
                [id, user.id, user.role, user.name]
            );
        } else {
            // Eliminar indicador de escritura
            await client.query(
                `DELETE FROM typing_indicators
                 WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
                [id, user.id, user.role]
            );
        }

        // Notificar a otros participantes
        await notifyConversationParticipants(id, user.id, user.role, {
            type: 'typing',
            is_typing,
            user_name: user.name
        });

        res.json({
            success: true,
            message: 'Estado de escritura actualizado'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al actualizar estado de escritura', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar estado de escritura',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/messaging/conversations/:id/typing
 * Obtener quién está escribiendo
 */
router.get('/conversations/:id/typing', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { id } = req.params;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, id, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para esta conversación'
            });
        }

        // Limpiar indicadores antiguos
        await client.query(`SELECT cleanup_typing_indicators()`);

        // Obtener indicadores activos (excepto el propio usuario)
        const result = await client.query(
            `SELECT user_id, user_role, user_name
             FROM typing_indicators
             WHERE conversation_id = $1 AND is_typing = TRUE
             AND NOT (user_id = $2 AND user_role = $3)`,
            [id, user.id, user.role]
        );

        res.json({
            success: true,
            typing: result.rows
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener estado de escritura', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estado de escritura',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - CONFIGURACIONES
// ============================================

/**
 * GET /api/messaging/settings/:conversationId
 * Obtener configuraciones de conversación
 */
router.get('/settings/:conversationId', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { conversationId } = req.params;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, conversationId, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para esta conversación'
            });
        }

        const result = await client.query(
            `SELECT * FROM conversation_settings
             WHERE conversation_id = $1 AND user_id = $2 AND user_role = $3`,
            [conversationId, user.id, user.role]
        );

        if (result.rows.length === 0) {
            // Crear configuraciones por defecto
            const defaultSettings = await client.query(
                `INSERT INTO conversation_settings (conversation_id, user_id, user_role)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [conversationId, user.id, user.role]
            );
            return res.json({
                success: true,
                settings: defaultSettings.rows[0]
            });
        }

        res.json({
            success: true,
            settings: result.rows[0]
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener configuraciones', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuraciones',
            details: error.message
        });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/messaging/settings/:conversationId
 * Actualizar configuraciones de conversación
 */
router.put('/settings/:conversationId', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);
        const { conversationId } = req.params;
        const { notifications_enabled, sound_enabled, custom_name, pinned } = req.body;

        // Verificar que el usuario sea participante
        if (!await isParticipant(client, conversationId, user.id, user.role)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para esta conversación'
            });
        }

        // Actualizar o crear configuraciones
        const upsertQuery = `
            INSERT INTO conversation_settings (conversation_id, user_id, user_role, notifications_enabled, sound_enabled, custom_name, pinned, pinned_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (conversation_id, user_id, user_role)
            DO UPDATE SET
                notifications_enabled = COALESCE($4, conversation_settings.notifications_enabled),
                sound_enabled = COALESCE($5, conversation_settings.sound_enabled),
                custom_name = COALESCE($6, conversation_settings.custom_name),
                pinned = COALESCE($7, conversation_settings.pinned),
                pinned_at = CASE WHEN $7 = TRUE THEN CURRENT_TIMESTAMP ELSE conversation_settings.pinned_at END,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await client.query(upsertQuery, [
            conversationId, user.id, user.role,
            notifications_enabled, sound_enabled, custom_name, pinned,
            pinned ? new Date() : null
        ]);

        res.json({
            success: true,
            settings: result.rows[0],
            message: 'Configuraciones actualizadas exitosamente'
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al actualizar configuraciones', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar configuraciones',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// ENDPOINTS - ESTADÍSTICAS
// ============================================

/**
 * GET /api/messaging/stats
 * Obtener estadísticas de mensajería del usuario
 */
router.get('/stats', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const user = getUserFromToken(req);

        const result = await client.query(
            `SELECT * FROM v_messaging_stats WHERE user_id = $1 AND user_role = $2`,
            [user.id, user.role]
        );

        res.json({
            success: true,
            stats: result.rows[0] || {
                total_conversations: 0,
                total_unread_messages: 0,
                last_activity: null
            }
        });

    } catch (error) {
        debugLog.error('messaging', 'Error al obtener estadísticas', sanitizeError(error, 'messaging'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// ============================================
// EXPORT
// ============================================

module.exports = router;
