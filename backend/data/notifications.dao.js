/**
 * 🔔 NOTIFICATION DAO - Data Access Object
 * Gestión de notificaciones del sistema
 * 
 * Patrón DAO - Abstrae toda la lógica SQL de notificaciones
 */

const { executeQuery } = require('../config/database');
const devLogger = require('../utils/devLogger');

class NotificationDAO {

    /**
     * Crear nueva notificación
     * @param {Object} data - Datos de la notificación
     */
    static async create(data) {
        const query = `
            INSERT INTO notificaciones (
                usuario_id, titulo, mensaje, tipo, 
                leida, data, prioridad, canal
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;

        const result = await executeQuery(query, [
            data.usuario_id,
            data.titulo,
            data.mensaje,
            data.tipo || 'info',
            false,
            data.data ? JSON.stringify(data.data) : null,
            data.prioridad || 'normal',
            data.canal || 'in_app'
        ]);

        return result.rows[0];
    }

    /**
     * Obtener notificación por ID
     */
    static async get(id) {
        const query = `SELECT * FROM notificaciones WHERE id = $1`;
        const result = await executeQuery(query, [id]);
        return result.rows[0];
    }

    /**
     * Listar notificaciones con filtros
     */
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

        const result = await executeQuery(query, params);
        return result.rows;
    }

    /**
     * Obtener notificaciones de un usuario
     */
    static async getByUser(userId, filters = {}) {
        return await this.list({ ...filters, usuario_id: userId });
    }

    /**
     * Marcar notificación como leída
     */
    static async markAsRead(id, userId) {
        const query = `
            UPDATE notificaciones 
            SET leida = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND usuario_id = $2
            RETURNING *
        `;
        const result = await executeQuery(query, [id, userId]);
        return result.rows[0];
    }

    /**
     * Marcar todas las notificaciones como leídas
     */
    static async markAllAsRead(userId) {
        const query = `
            UPDATE notificaciones 
            SET leida = TRUE, read_at = CURRENT_TIMESTAMP
            WHERE usuario_id = $1 AND leida = FALSE
            RETURNING count(*) as updated_count
        `;
        const result = await executeQuery(query, [userId]);
        return result.rows[0].updated_count;
    }

    /**
     * Eliminar notificación
     */
    static async delete(id, userId) {
        const query = `
            DELETE FROM notificaciones 
            WHERE id = $1 AND usuario_id = $2
            RETURNING id
        `;
        const result = await executeQuery(query, [id, userId]);
        return result.rowCount > 0;
    }

    /**
     * Eliminar notificaciones antiguas (limpieza)
     */
    static async deleteOld(days = 30) {
        const query = `
            DELETE FROM notificaciones 
            WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'
            RETURNING count(*) as deleted_count
        `;
        const result = await executeQuery(query);
        return result.rows[0].deleted_count;
    }

    /**
     * Contar notificaciones no leídas
     */
    static async getUnreadCount(userId) {
        const query = `
            SELECT COUNT(*) as count 
            FROM notificaciones 
            WHERE usuario_id = $1 AND leida = FALSE
        `;
        const result = await executeQuery(query, [userId]);
        return parseInt(result.rows[0].count);
    }
}

module.exports = NotificationDAO;
