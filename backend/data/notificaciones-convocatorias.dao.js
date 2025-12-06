/**
 * 🔔 NOTIFICACIONES CONVOCATORIAS DAO
 * Capa de acceso a datos para suscripciones a convocatorias.
 * 
 * @author Gemini Code
 * @date 2025-12-05
 * @version 1.0.0
 */

const { executeQuery } = require('../config/database');

class NotificacionesConvocatoriasDAO {

    static async getByEmail(email) {
        const result = await executeQuery('SELECT id, status FROM notificaciones_convocatorias WHERE email = $1', [email]);
        return result[0] || null;
    }

    static async reactivate(email, data) {
        const query = `
            UPDATE notificaciones_convocatorias SET
                nombre = COALESCE($1, nombre), tipo_interes = COALESCE($2, tipo_interes),
                status = 'activo', fecha_suscripcion = NOW(), fecha_baja = NULL,
                ip_address = $3, user_agent = $4
            WHERE email = $5 RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.tipo_interes, data.ip_address, data.user_agent, email]);
        return result[0];
    }

    static async create(data) {
        const query = `
            INSERT INTO notificaciones_convocatorias (nombre, email, tipo_interes, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.email, data.tipo_interes, data.ip_address, data.user_agent]);
        return result[0];
    }

    static async getAll({ status, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM notificaciones_convocatorias';
        const params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY fecha_suscripcion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));

        const data = await executeQuery(query, params);
        const countQuery = status ? 'SELECT COUNT(*) FROM notificaciones_convocatorias WHERE status = $1' : 'SELECT COUNT(*) FROM notificaciones_convocatorias';
        const countResult = await executeQuery(countQuery, status ? [status] : []);
        return { data, total: parseInt(countResult[0].count) };
    }

    static async getStats() {
        const query = `
            SELECT COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'activo') as activos,
                COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos,
                COUNT(*) FILTER (WHERE status = 'cancelado') as cancelados,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) = CURRENT_DATE) as hoy,
                COUNT(*) FILTER (WHERE DATE(fecha_suscripcion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana,
                COUNT(*) FILTER (WHERE verificado = true) as verificados
            FROM notificaciones_convocatorias;
        `;
        const result = await executeQuery(query, []);

        const tipoQuery = `
            SELECT tipo_interes, COUNT(*) as cantidad FROM notificaciones_convocatorias
            WHERE tipo_interes IS NOT NULL AND status = 'activo' GROUP BY tipo_interes ORDER BY cantidad DESC;
        `;
        const tipoResult = await executeQuery(tipoQuery, []);
        const byTipo = tipoResult.reduce((acc, row) => { acc[row.tipo_interes] = parseInt(row.cantidad); return acc; }, {});

        return { ...result[0], byTipo };
    }

    static async getById(id) {
        const result = await executeQuery('SELECT * FROM notificaciones_convocatorias WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async update(id, data) {
        const query = `
            UPDATE notificaciones_convocatorias SET
                nombre = COALESCE($1, nombre), tipo_interes = COALESCE($2, tipo_interes),
                status = COALESCE($3, status),
                fecha_baja = CASE WHEN $3 IN ('inactivo', 'cancelado') THEN NOW() ELSE fecha_baja END
            WHERE id = $4 RETURNING *;
        `;
        const result = await executeQuery(query, [data.nombre, data.tipo_interes, data.status, id]);
        return result[0] || null;
    }

    static async cancel(id) {
        const query = `UPDATE notificaciones_convocatorias SET status = 'cancelado', fecha_baja = NOW() WHERE id = $1 RETURNING id, email`;
        const result = await executeQuery(query, [id]);
        return result[0] || null;
    }

    static async unsubscribeByEmail(email) {
        const query = `UPDATE notificaciones_convocatorias SET status = 'cancelado', fecha_baja = NOW() WHERE email = $1 AND status = 'activo' RETURNING id`;
        const result = await executeQuery(query, [email]);
        return result[0] || null;
    }
}

module.exports = NotificacionesConvocatoriasDAO;
