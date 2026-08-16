"use strict";
/**
 * 🔑 PASSWORD RECOVERY DAO - TypeScript
 * Data Access Object para recuperación de contraseña
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// PASSWORD RECOVERY DAO CLASS
// =====================================================
class PasswordRecoveryDAO {
    static async create(data) {
        const query = `INSERT INTO password_recovery_requests (email, student_id, ip_address, user_agent) VALUES ($1,$2,$3,$4) RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [data.email, data.student_id, data.ip_address, data.user_agent]);
        return result[0];
    }
    static async updateToken(id, token, expiresAt) {
        await (0, database_1.executeQuery)('UPDATE password_recovery_requests SET token = $1, token_expires_at = $2 WHERE id = $3', [token, expiresAt, id]);
    }
    static async getAll(filters) {
        const { status, limit = 50, offset = 0 } = filters;
        let query = 'SELECT * FROM password_recovery_requests';
        const params = [];
        if (status) {
            query += ' WHERE status = $1';
            params.push(status);
        }
        query += ` ORDER BY fecha_solicitud DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const data = await (0, database_1.executeQuery)(query, params);
        const countQuery = status ?
            'SELECT COUNT(*) FROM password_recovery_requests WHERE status = $1' :
            'SELECT COUNT(*) FROM password_recovery_requests';
        const countResult = await (0, database_1.executeQuery)(countQuery, status ? [status] : []);
        return { data, total: parseInt(countResult[0].count) };
    }
    static async getStats() {
        const query = `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
            COUNT(*) FILTER (WHERE status = 'processed') as procesados, COUNT(*) FILTER (WHERE status = 'expired') as expirados,
            COUNT(*) FILTER (WHERE DATE(fecha_solicitud) = CURRENT_DATE) as hoy,
            COUNT(*) FILTER (WHERE DATE(fecha_solicitud) >= CURRENT_DATE - INTERVAL '7 days') as esta_semana FROM password_recovery_requests`;
        const result = await (0, database_1.executeQuery)(query, []);
        return result[0];
    }
    static async update(id, data) {
        const query = `UPDATE password_recovery_requests SET status = COALESCE($1, status), notas_admin = COALESCE($2, notas_admin),
            procesado_por = COALESCE($3, procesado_por), fecha_procesado = CASE WHEN $1 = 'processed' THEN NOW() ELSE fecha_procesado END
            WHERE id = $4 RETURNING *`;
        const result = await (0, database_1.executeQuery)(query, [data.status, data.notas_admin, data.procesado_por, id]);
        return result[0] || null;
    }
}
exports.default = PasswordRecoveryDAO;
module.exports = PasswordRecoveryDAO;
//# sourceMappingURL=password-recovery.dao.js.map