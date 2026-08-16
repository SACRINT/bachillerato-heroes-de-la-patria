"use strict";
/**
 * 📋 DSAR DAO - TypeScript
 * Data Access Object para solicitudes de acceso a datos GDPR
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// DSAR DAO CLASS
// =====================================================
class DsarDAO {
    static async createRequest(requestId, userId, requestType, email, verificationToken, metadata) {
        const result = await database_1.pool.query(`INSERT INTO dsar_requests (id, user_id, request_type, email, status, verification_token, metadata, created_at, due_date) VALUES ($1, $2, $3, $4, 'pending_verification', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days') RETURNING *`, [requestId, userId, requestType, email, verificationToken, JSON.stringify(metadata)]);
        return result.rows[0];
    }
    static async verifyRequest(token) {
        const result = await database_1.pool.query(`UPDATE dsar_requests SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE verification_token = $1 AND status = 'pending_verification' RETURNING *`, [token]);
        return result.rows[0] || null;
    }
    static async getById(requestId) {
        const result = await database_1.pool.query('SELECT * FROM dsar_requests WHERE id = $1', [requestId]);
        return result.rows[0] || null;
    }
    static async updateStatus(requestId, status, extraFields = {}) {
        let query = `UPDATE dsar_requests SET status = $1`;
        const params = [status];
        if (status === 'processing')
            query += `, processing_started_at = CURRENT_TIMESTAMP`;
        if (status === 'completed' && extraFields.exportPath) {
            query += `, completed_at = CURRENT_TIMESTAMP, export_path = $2`;
            params.push(extraFields.exportPath);
        }
        if (status === 'failed' && extraFields.error) {
            query += `, error_message = $2`;
            params.push(extraFields.error);
        }
        query += ` WHERE id = $${params.length + 1}`;
        params.push(requestId);
        await database_1.pool.query(query, params);
    }
    static async getUserProfile(userId) {
        const result = await database_1.pool.query('SELECT uuid, email, username, nombre, apellido_paterno, apellido_materno, role, status, created_at, updated_at, last_login FROM usuarios WHERE uuid = $1', [userId]);
        return result.rows[0] || null;
    }
    static async getAcademicData(userId) {
        const data = { grades: [], attendance: [], enrollments: [] };
        try {
            data.grades = (await database_1.pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows;
        }
        catch {
            data.grades = [];
        }
        try {
            data.attendance = (await database_1.pool.query('SELECT * FROM asistencia WHERE estudiante_id = $1 ORDER BY fecha DESC', [userId])).rows;
        }
        catch {
            data.attendance = [];
        }
        try {
            data.enrollments = (await database_1.pool.query('SELECT * FROM inscripciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows;
        }
        catch {
            data.enrollments = [];
        }
        return data;
    }
    static async getActivityLogs(userId) {
        try {
            const result = await database_1.pool.query('SELECT id, action, resource, resource_id, timestamp, ip_address, user_agent FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1000', [userId]);
            return result.rows;
        }
        catch {
            return [];
        }
    }
    static async getUserConsents(userId) {
        try {
            const result = await database_1.pool.query('SELECT * FROM user_consents WHERE user_id = $1 ORDER BY granted_at DESC', [userId]);
            return result.rows;
        }
        catch {
            return [];
        }
    }
    static async getCommunications(userId) {
        const data = { notifications: [] };
        try {
            data.notifications = (await database_1.pool.query('SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 100', [userId])).rows;
        }
        catch {
            data.notifications = [];
        }
        return data;
    }
    static async getFinancialData(userId) {
        const data = { payments: [] };
        try {
            data.payments = (await database_1.pool.query('SELECT * FROM pagos WHERE estudiante_id = $1', [userId])).rows;
        }
        catch {
            data.payments = [];
        }
        return data;
    }
    static async getUserFiles(userId) {
        try {
            const result = await database_1.pool.query('SELECT id, filename, file_path, file_size, mime_type, uploaded_at, category FROM user_files WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]);
            return result.rows;
        }
        catch {
            return [];
        }
    }
    /**
     * Obtener solicitud por ID (campos públicos para status)
     */
    static async getByIdPublic(requestId) {
        const result = await database_1.pool.query('SELECT id, request_type, status, created_at, due_date, completed_at FROM dsar_requests WHERE id = $1', [requestId]);
        return result.rows[0] || null;
    }
    /**
     * Obtener todas las solicitudes de un usuario
     */
    static async getUserRequests(userId) {
        const result = await database_1.pool.query(`SELECT id, request_type, status, created_at, due_date, completed_at, verified_at
             FROM dsar_requests WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
        return result.rows;
    }
    /**
     * Obtener solicitud verificando ownership
     */
    static async getByIdAndUser(requestId, userId) {
        const result = await database_1.pool.query('SELECT * FROM dsar_requests WHERE id = $1 AND user_id = $2', [requestId, userId]);
        return result.rows[0] || null;
    }
    /**
     * Cancelar solicitud (soft delete)
     */
    static async cancelRequest(requestId) {
        await database_1.pool.query(`UPDATE dsar_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [requestId]);
    }
    /**
     * Obtener solicitudes pendientes para admin
     */
    static async getPendingAdmin() {
        const result = await database_1.pool.query(`SELECT dr.id, dr.user_id, dr.request_type, dr.status, dr.created_at, dr.due_date, dr.email,
                    u.nombre, u.apellido_paterno, u.email AS user_email
             FROM dsar_requests dr
             LEFT JOIN usuarios u ON dr.user_id = u.uuid
             WHERE dr.status IN ('verified', 'processing')
             ORDER BY dr.created_at ASC`);
        return result.rows;
    }
}
exports.default = DsarDAO;
module.exports = DsarDAO;
//# sourceMappingURL=dsar.dao.js.map