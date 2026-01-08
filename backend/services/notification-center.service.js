/**
 * 🔔 NOTIFICATION CENTER SERVICE
 * Propósito: Envío y gestión de notificaciones multicanal (Fase 7 - Semana 51)
 */

const { executeQuery } = require('../config/database');
const SocketService = require('../services/socket-service'); // Reusing Week 5 logic

class NotificationCenterService {

    async send(userId, type, title, message, actionLink = null) {
        // 1. Persist to DB
        const query = `
            INSERT INTO notification_center (user_id, type, title, message, action_link)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, created_at
        `;
        const res = await executeQuery(query, [userId, type, title, message, actionLink]);
        const notification = res[0];

        // 2. Real-time Push (Socket.io)
        // Check if SocketService has a way to emit to specific user room
        // Assuming SocketService.io instance is available globally or passed
        // For now, pseudo-code:
        // io.to(`user_${userId}`).emit('new_notification', notification);

        return notification;
    }

    async getUnread(userId) {
        return await executeQuery(
            'SELECT * FROM notification_center WHERE user_id = $1 AND is_read = FALSE ORDER BY created_at DESC',
            [userId]
        );
    }

    async markRead(notificationId, userId) {
        await executeQuery(
            'UPDATE notification_center SET is_read = TRUE WHERE id = $1 AND user_id = $2',
            [notificationId, userId]
        );
    }
}

module.exports = new NotificationCenterService();
