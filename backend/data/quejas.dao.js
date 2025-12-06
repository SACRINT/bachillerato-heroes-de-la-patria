/**
 * 📝 QUEJAS DAO (Data Access Object)
 * @author Gemini Code @date 2025-12-05
 */
const { executeQuery } = require('../config/database');

class QuejasDAO {
    static async create(data) {
        const query = `INSERT INTO quejas (nombre, email, subject, message, form_type, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
        const result = await executeQuery(query, [data.nombre, data.email, data.subject, data.message, data.form_type || 'quejas', data.ip_address, data.user_agent]);
        return result[0];
    }

    static async getAll({ status, limit = 50, offset = 0 }) {
        let query = 'SELECT * FROM quejas';
        const params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY fecha_creacion DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        return await executeQuery(query, params);
    }

    static async getStats() {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE status = 'en_revision') as en_revision, COUNT(*) FILTER (WHERE status = 'respondida') as respondidas,
            COUNT(*) FILTER (WHERE subject = 'queja') as quejas, COUNT(*) FILTER (WHERE subject = 'sugerencia') as sugerencias,
            COUNT(*) FILTER (WHERE subject = 'felicitacion') as felicitaciones,
            COUNT(*) FILTER (WHERE DATE(fecha_creacion) = CURRENT_DATE) as hoy,
            COUNT(*) FILTER (WHERE DATE(fecha_creacion) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM quejas`;
        const result = await executeQuery(query, []);
        return result[0];
    }

    static async getById(id) {
        const result = await executeQuery('SELECT * FROM quejas WHERE id = $1', [id]);
        return result[0] || null;
    }

    static async update(id, data) {
        const query = `UPDATE quejas SET status = COALESCE($1, status), respuesta = COALESCE($2, respuesta),
            respondido_por = COALESCE($3, respondido_por), fecha_respuesta = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE fecha_respuesta END,
            fecha_actualizacion = NOW() WHERE id = $4 RETURNING *`;
        const result = await executeQuery(query, [data.status, data.respuesta, data.respondido_por, id]);
        return result[0] || null;
    }

    static async delete(id) {
        const result = await executeQuery('DELETE FROM quejas WHERE id = $1 RETURNING id', [id]);
        return result[0] || null;
    }
}
module.exports = QuejasDAO;
