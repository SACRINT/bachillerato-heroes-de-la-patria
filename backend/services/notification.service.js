const { executeQuery } = require('../config/database.js');

class NotificationService {

    // Crear Notificación
    async createNotification(userId, type, title, message, refId = null, refUrl = null) {
        const query = `
            INSERT INTO notifications (user_id, type, title, message, reference_id, reference_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        return await executeQuery(query, [userId, type, title, message, refId, refUrl]);
    }

    // Obtener Notificaciones (Paginadas)
    async getMyNotifications(userId, limit = 20, offset = 0) {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY is_read ASC, created_at DESC 
            LIMIT $2 OFFSET $3
        `;
        const items = await executeQuery(query, [userId, limit, offset]);

        // Count unread
        const unreadRes = await executeQuery('SELECT COUNT(*) as c FROM notifications WHERE user_id = $1 AND is_read = FALSE', [userId]);

        return { items, unreadCount: parseInt(unreadRes[0].c) };
    }

    // Marcar como leída
    async markAsRead(notificationId, userId) {
        await executeQuery('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [notificationId, userId]);
    }

    // Marcar todas como leídas
    async markAllAsRead(userId) {
        await executeQuery('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    }
}

module.exports = new NotificationService();