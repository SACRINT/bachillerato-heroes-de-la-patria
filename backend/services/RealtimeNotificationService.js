/**
 * 🔔 REALTIME NOTIFICATION SERVICE
 * Servicio de notificaciones en tiempo real con Socket.IO
 * FASE 2 - Semana 11-12
 */

const { executeQuery } = require('../data/database-access');

class RealtimeNotificationService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // userId -> Set<socketId>
    }

    /**
     * Inicializa Socket.IO
     */
    initialize(io) {
        this.io = io;
        console.log('[NOTIFICATIONS] Servicio de notificaciones inicializado');
    }

    // =====================================
    // GESTIÓN DE CONEXIONES
    // =====================================

    /**
     * Registra conexión de usuario
     */
    async registerConnection(userId, socketId, connectionInfo = {}) {
        // Guardar en memoria
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socketId);

        // Guardar en BD
        const query = `
            INSERT INTO socket_sessions (
                user_id, socket_id, ip_address, user_agent, device_type
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (socket_id) DO UPDATE SET
                is_active = true,
                last_activity = NOW()
        `;

        await executeQuery(query, [
            userId, socketId,
            connectionInfo.ip || null,
            connectionInfo.userAgent || null,
            connectionInfo.deviceType || 'unknown'
        ]);

        console.log(`[NOTIFICATIONS] Usuario ${userId} conectado (${socketId})`);
    }

    /**
     * Registra desconexión de usuario
     */
    async unregisterConnection(userId, socketId) {
        // Remover de memoria
        if (this.userSockets.has(userId)) {
            this.userSockets.get(userId).delete(socketId);
            if (this.userSockets.get(userId).size === 0) {
                this.userSockets.delete(userId);
            }
        }

        // Actualizar BD
        const query = `
            UPDATE socket_sessions
            SET is_active = false, disconnected_at = NOW()
            WHERE socket_id = $1
        `;

        await executeQuery(query, [socketId]);

        console.log(`[NOTIFICATIONS] Usuario ${userId} desconectado (${socketId})`);
    }

    /**
     * Actualiza última actividad
     */
    async updateActivity(socketId) {
        const query = `
            UPDATE socket_sessions
            SET last_activity = NOW()
            WHERE socket_id = $1
        `;
        await executeQuery(query, [socketId]);
    }

    /**
     * Verifica si usuario está online
     */
    isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }

    /**
     * Obtiene usuarios online
     */
    getOnlineUsers() {
        return Array.from(this.userSockets.keys());
    }

    // =====================================
    // ENVÍO DE NOTIFICACIONES
    // =====================================

    /**
     * Envía notificación a un usuario
     */
    async sendToUser(userId, notification) {
        // Crear notificación en BD
        const saved = await this.createNotification(userId, notification);

        // Enviar por Socket.IO si está online
        if (this.isUserOnline(userId)) {
            const sockets = this.userSockets.get(userId);
            sockets.forEach(socketId => {
                if (this.io) {
                    this.io.to(socketId).emit('notification', {
                        ...saved,
                        isNew: true
                    });
                }
            });
        }

        return saved;
    }

    /**
     * Envía notificación a múltiples usuarios
     */
    async sendToUsers(userIds, notification) {
        const results = [];

        for (const userId of userIds) {
            const result = await this.sendToUser(userId, notification);
            results.push(result);
        }

        return results;
    }

    /**
     * Envía notificación broadcast a todos
     */
    async broadcast(notification, excludeUserIds = []) {
        // Obtener todos los usuarios
        const usersQuery = `SELECT id FROM usuarios WHERE status = 'activo'`;
        const users = await executeQuery(usersQuery, []);

        const userIds = users
            .map(u => u.id)
            .filter(id => !excludeUserIds.includes(id));

        return this.sendToUsers(userIds, notification);
    }

    /**
     * Envía notificación a un rol específico
     */
    async sendToRole(role, notification) {
        const query = `SELECT id FROM usuarios WHERE role = $1 AND status = 'activo'`;
        const users = await executeQuery(query, [role]);

        const userIds = users.map(u => u.id);
        return this.sendToUsers(userIds, notification);
    }

    // =====================================
    // CRUD DE NOTIFICACIONES
    // =====================================

    /**
     * Crea notificación en BD
     */
    async createNotification(userId, data) {
        const query = `
            INSERT INTO notifications (
                user_id, type, category, title, message,
                icon, image_url, action_url, action_text,
                metadata, priority, expires_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
            )
            RETURNING *
        `;

        const result = await executeQuery(query, [
            userId,
            data.type || 'system',
            data.category || 'info',
            data.title,
            data.message,
            data.icon,
            data.imageUrl,
            data.actionUrl,
            data.actionText,
            data.metadata ? JSON.stringify(data.metadata) : null,
            data.priority || 0,
            data.expiresAt
        ]);

        return result[0];
    }

    /**
     * Obtiene notificaciones de usuario
     */
    async getUserNotifications(userId, options = {}) {
        const {
            unreadOnly = false,
            type,
            limit = 50,
            offset = 0
        } = options;

        let query = `
            SELECT * FROM notifications
            WHERE user_id = $1
            AND is_archived = false
            AND (expires_at IS NULL OR expires_at > NOW())
        `;

        const params = [userId];
        let paramIndex = 2;

        if (unreadOnly) {
            query += ` AND is_read = false`;
        }

        if (type) {
            query += ` AND type = $${paramIndex++}`;
            params.push(type);
        }

        query += ` ORDER BY priority DESC, created_at DESC`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Cuenta notificaciones no leídas
     */
    async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) as count
            FROM notifications
            WHERE user_id = $1
            AND is_read = false
            AND is_archived = false
            AND (expires_at IS NULL OR expires_at > NOW())
        `;

        const result = await executeQuery(query, [userId]);
        return parseInt(result[0].count);
    }

    /**
     * Marca notificación como leída
     */
    async markAsRead(userId, notificationId) {
        const query = `
            UPDATE notifications
            SET is_read = true, read_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `;

        const result = await executeQuery(query, [notificationId, userId]);
        return result.length > 0;
    }

    /**
     * Marca todas como leídas
     */
    async markAllAsRead(userId) {
        const query = `
            UPDATE notifications
            SET is_read = true, read_at = NOW()
            WHERE user_id = $1 AND is_read = false
        `;

        await executeQuery(query, [userId]);

        // Emitir evento
        if (this.isUserOnline(userId)) {
            this.userSockets.get(userId).forEach(socketId => {
                if (this.io) {
                    this.io.to(socketId).emit('notifications_read_all');
                }
            });
        }

        return true;
    }

    /**
     * Archiva notificación
     */
    async archiveNotification(userId, notificationId) {
        const query = `
            UPDATE notifications
            SET is_archived = true
            WHERE id = $1 AND user_id = $2
        `;

        await executeQuery(query, [notificationId, userId]);
        return true;
    }

    /**
     * Elimina notificaciones antiguas
     */
    async cleanupOldNotifications(daysOld = 30) {
        const query = `
            DELETE FROM notifications
            WHERE created_at < NOW() - INTERVAL '${daysOld} days'
            AND is_archived = true
        `;

        await executeQuery(query, []);
    }

    // =====================================
    // PLANTILLAS
    // =====================================

    /**
     * Envía notificación desde plantilla
     */
    async sendFromTemplate(userId, templateSlug, variables = {}) {
        // Obtener plantilla
        const templateQuery = `SELECT * FROM notification_templates WHERE slug = $1 AND is_active = true`;
        const templateResult = await executeQuery(templateQuery, [templateSlug]);

        if (templateResult.length === 0) {
            throw new Error(`Plantilla no encontrada: ${templateSlug}`);
        }

        const template = templateResult[0];

        // Reemplazar variables
        const title = this.replaceVariables(template.title_template, variables);
        const message = this.replaceVariables(template.message_template, variables);
        const actionUrl = template.default_action_url
            ? this.replaceVariables(template.default_action_url, variables)
            : null;

        // Crear notificación
        return this.sendToUser(userId, {
            type: template.type,
            category: template.category,
            title,
            message,
            icon: template.icon,
            actionUrl,
            actionText: template.default_action_text,
            priority: template.priority,
            metadata: { template_slug: templateSlug, variables }
        });
    }

    /**
     * Reemplaza variables en texto
     */
    replaceVariables(text, variables) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] !== undefined ? variables[key] : match;
        });
    }

    // =====================================
    // PREFERENCIAS
    // =====================================

    /**
     * Obtiene preferencias de usuario
     */
    async getUserPreferences(userId) {
        const query = `SELECT * FROM notification_preferences WHERE user_id = $1`;
        const result = await executeQuery(query, [userId]);

        if (result.length === 0) {
            // Crear preferencias por defecto
            return this.createDefaultPreferences(userId);
        }

        return result[0];
    }

    /**
     * Crea preferencias por defecto
     */
    async createDefaultPreferences(userId) {
        const query = `
            INSERT INTO notification_preferences (user_id)
            VALUES ($1)
            RETURNING *
        `;

        const result = await executeQuery(query, [userId]);
        return result[0];
    }

    /**
     * Actualiza preferencias
     */
    async updatePreferences(userId, preferences) {
        const allowedFields = [
            'enable_push', 'enable_email', 'enable_sms', 'enable_in_app',
            'notify_achievements', 'notify_challenges', 'notify_messages',
            'notify_system', 'notify_marketing',
            'quiet_hours_start', 'quiet_hours_end', 'timezone', 'email_digest'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(preferences)) {
            if (allowedFields.includes(key)) {
                fields.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        if (fields.length === 0) return null;

        values.push(userId);
        const query = `
            UPDATE notification_preferences
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE user_id = $${paramIndex}
            RETURNING *
        `;

        const result = await executeQuery(query, values);

        if (result.length === 0) {
            // Crear preferencias si no existen
            await this.createDefaultPreferences(userId);
            return this.updatePreferences(userId, preferences);
        }

        return result[0];
    }

    /**
     * Verifica si debe enviar notificación según preferencias
     */
    async shouldNotify(userId, type, channel = 'in_app') {
        const prefs = await this.getUserPreferences(userId);

        // Verificar canal
        if (channel === 'push' && !prefs.enable_push) return false;
        if (channel === 'email' && !prefs.enable_email) return false;
        if (channel === 'sms' && !prefs.enable_sms) return false;
        if (channel === 'in_app' && !prefs.enable_in_app) return false;

        // Verificar tipo
        if (type === 'achievement' && !prefs.notify_achievements) return false;
        if (type === 'challenge' && !prefs.notify_challenges) return false;
        if (type === 'message' && !prefs.notify_messages) return false;
        if (type === 'system' && !prefs.notify_system) return false;
        if (type === 'marketing' && !prefs.notify_marketing) return false;

        // Verificar horas silenciosas
        if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            const start = prefs.quiet_hours_start;
            const end = prefs.quiet_hours_end;

            if (start < end) {
                // Rango normal (ej: 22:00 - 08:00)
                if (currentTime >= start && currentTime < end) return false;
            } else {
                // Rango que cruza medianoche
                if (currentTime >= start || currentTime < end) return false;
            }
        }

        return true;
    }

    // =====================================
    // NOTIFICACIONES PREDEFINIDAS
    // =====================================

    /**
     * Notifica subida de nivel
     */
    async notifyLevelUp(userId, level, title, coins) {
        return this.sendFromTemplate(userId, 'level_up', {
            level, title, coins
        });
    }

    /**
     * Notifica badge obtenido
     */
    async notifyBadgeEarned(userId, badgeName, description) {
        return this.sendFromTemplate(userId, 'badge_earned', {
            badge_name: badgeName, description
        });
    }

    /**
     * Notifica reto completado
     */
    async notifyChallengeCompleted(userId, challengeTitle, coins, xp) {
        return this.sendFromTemplate(userId, 'challenge_completed', {
            challenge_title: challengeTitle, coins, xp
        });
    }

    /**
     * Notifica milestone de racha
     */
    async notifyStreakMilestone(userId, days, bonus) {
        return this.sendFromTemplate(userId, 'streak_milestone', {
            days, bonus
        });
    }

    /**
     * Notifica nuevo mensaje
     */
    async notifyNewMessage(userId, senderName, preview) {
        return this.sendFromTemplate(userId, 'new_message', {
            sender_name: senderName,
            preview: preview.substring(0, 100)
        });
    }
}

module.exports = new RealtimeNotificationService();
