"use strict";
/**
 * 🔔 NOTIFICATION DAO - TypeScript
 * Gestión de notificaciones del sistema
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
// =====================================================
// NOTIFICATION DAO CLASS
// =====================================================
class NotificationDAO {
    static async create(data) {
        const query = `
            INSERT INTO notificaciones (
                usuario_id, titulo, mensaje, tipo, 
                leida, data, prioridad, canal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [
            data.usuario_id,
            data.titulo,
            data.mensaje,
            data.tipo || 'info',
            false,
            data.data ? JSON.stringify(data.data) : null,
            data.prioridad || 'normal',
            data.canal || 'in_app'
        ]);
        return result[0];
    }
    static async get(id) {
        const query = `SELECT * FROM notificaciones WHERE id = $1`;
        const result = await (0, database_1.executeQuery)(query, [id]);
        return result[0];
    }
    static async list(filters = {}) {
        let query = `SELECT * FROM notificaciones WHERE 1=1`;
        const params = [];
        let paramCount = 1;
        if (filters.usuario_id) {
            query += ` AND usuario_id = $${paramCount++}`;
            params.push(filters.usuario_id);
        }
        if (filters.leida !== undefined) {
            query += ` AND leida = $${paramCount++}`;
            params.push(filters.leida);
        }
        if (filters.tipo) {
            query += ` AND tipo = $${paramCount++}`;
            params.push(filters.tipo);
        }
        query += ` ORDER BY created_at DESC`;
        if (filters.limit) {
            query += ` LIMIT $${paramCount++}`;
            params.push(filters.limit);
        }
        const result = await (0, database_1.executeQuery)(query, params);
        return result;
    }
    static async getByUser(userId, filters = {}) {
        return await this.list({ ...filters, usuario_id: userId });
    }
    static async markAsRead(id, userId) {
        const query = `
            UPDATE notificaciones 
            SET leida = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND usuario_id = $2
            RETURNING *
        `;
        const result = await (0, database_1.executeQuery)(query, [id, userId]);
        return result[0];
    }
    static async markAllAsRead(userId) {
        const query = `
            UPDATE notificaciones 
            SET leida = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE usuario_id = $1 AND leida = FALSE
            RETURNING count(*) as updated_count
        `;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        return result[0]?.updated_count || 0;
    }
    static async delete(id, userId) {
        const query = `
            DELETE FROM notificaciones 
            WHERE id = $1 AND usuario_id = $2
            RETURNING id
        `;
        const result = await (0, database_1.executeQuery)(query, [id, userId]);
        return result.length > 0;
    }
    static async deleteOld(days = 30) {
        const query = `
            DELETE FROM notificaciones 
            WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
            RETURNING count(*) as deleted_count
        `;
        const result = await (0, database_1.executeQuery)(query);
        return result[0]?.deleted_count || 0;
    }
    static async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM notificaciones 
            WHERE usuario_id = $1 AND leida = FALSE
        `;
        const result = await (0, database_1.executeQuery)(query, [userId]);
        return parseInt(result[0].count);
    }
}
exports.default = NotificationDAO;
module.exports = NotificationDAO;
//# sourceMappingURL=notifications.dao.js.map