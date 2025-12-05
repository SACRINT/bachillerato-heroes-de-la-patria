/**
 * 📋 DSAR DAO
 * Data Access Object para solicitudes de acceso a datos GDPR
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const pool = require('../config/database');

class DsarDAO {

    static async createRequest(requestId, userId, requestType, email, verificationToken, metadata) {
        const result = await pool.query(`INSERT INTO dsar_requests (id, user_id, request_type, email, status, verification_token, metadata, created_at, due_date) VALUES ($1, $2, $3, $4, 'pending_verification', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days') RETURNING *`, [requestId, userId, requestType, email, verificationToken, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    static async verifyRequest(token) {
        const result = await pool.query(`UPDATE dsar_requests SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE verification_token = $1 AND status = 'pending_verification' RETURNING *`, [token]);
        return result.rows[0];
    }

    static async getById(requestId) {
        const result = await pool.query('SELECT * FROM dsar_requests WHERE id = $1', [requestId]);
        return result.rows[0];
    }

    static async updateStatus(requestId, status, extraFields = {}) {
        let query = `UPDATE dsar_requests SET status = $1`;
        const params = [status];
        if (status === 'processing') query += `, processing_started_at = CURRENT_TIMESTAMP`;
        if (status === 'completed' && extraFields.exportPath) { query += `, completed_at = CURRENT_TIMESTAMP, export_path = $2`; params.push(extraFields.exportPath); }
        if (status === 'failed' && extraFields.error) { query += `, error_message = $2`; params.push(extraFields.error); }
        query += ` WHERE id = $${params.length + 1}`;
        params.push(requestId);
        await pool.query(query, params);
    }

    static async getUserProfile(userId) {
        const result = await pool.query('SELECT uuid, email, username, nombre, apellido_paterno, apellido_materno, role, status, created_at, updated_at, last_login FROM usuarios WHERE uuid = $1', [userId]);
        return result.rows[0];
    }

    static async getAcademicData(userId) {
        const data = {};
        try { data.grades = (await pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows; } catch { data.grades = []; }
        try { data.attendance = (await pool.query('SELECT * FROM asistencia WHERE estudiante_id = $1 ORDER BY fecha DESC', [userId])).rows; } catch { data.attendance = []; }
        try { data.enrollments = (await pool.query('SELECT * FROM inscripciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows; } catch { data.enrollments = []; }
        return data;
    }

    static async getActivityLogs(userId) {
        try { const result = await pool.query('SELECT id, action, resource, resource_id, timestamp, ip_address, user_agent FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1000', [userId]); return result.rows; } catch { return []; }
    }

    static async getUserConsents(userId) {
        try { const result = await pool.query('SELECT * FROM user_consents WHERE user_id = $1 ORDER BY granted_at DESC', [userId]); return result.rows; } catch { return []; }
    }

    static async getCommunications(userId) {
        const data = {};
        try { data.notifications = (await pool.query('SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 100', [userId])).rows; } catch { data.notifications = []; }
        return data;
    }

    static async getFinancialData(userId) {
        const data = {};
        try { data.payments = (await pool.query('SELECT * FROM pagos WHERE estudiante_id = $1', [userId])).rows; } catch { data.payments = []; }
        return data;
    }

    static async getUserFiles(userId) {
        try { const result = await pool.query('SELECT id, filename, file_path, file_size, mime_type, uploaded_at, category FROM user_files WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]); return result.rows; } catch { return []; }
    }
}

module.exports = DsarDAO;
