/**
 * 🛡️ GDPR DAO
 * Data Access Object consolidado para GDPR, Consent Management y Email Confirmation
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class GDPRDAO {
    // ==========================================
    // CONSENT MANAGEMENT
    // ==========================================

    static async recordConsent(userId, consents, ipAddress) {
        const result = await pool.query('INSERT INTO gdpr_consents (user_id, consents, ip_address, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id', [userId, JSON.stringify(consents), ipAddress]);
        return result.rows[0].id;
    }

    static async getConsent(userId) {
        const result = await pool.query('SELECT consents, created_at FROM gdpr_consents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        return result.rows[0] || null;
    }

    static async grantConsent(userId, consentType, granted, ipAddress, userAgent, metadata) {
        const result = await pool.query(`
            INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent, metadata, granted_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = EXCLUDED.granted, ip_address = EXCLUDED.ip_address, updated_at = NOW()
            RETURNING id
        `, [userId, consentType, granted, ipAddress, userAgent, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    static async revokeConsent(userId, consentType) {
        const result = await pool.query('UPDATE user_consents SET granted = false, revoked_at = NOW() WHERE user_id = $1 AND consent_type = $2 RETURNING id', [userId, consentType]);
        return result.rowCount > 0;
    }

    static async getUserConsents(userId) {
        const result = await pool.query('SELECT * FROM user_consents WHERE user_id = $1', [userId]);
        return result.rows;
    }

    static async hasActiveConsent(userId, consentType) {
        const result = await pool.query('SELECT granted FROM user_consents WHERE user_id = $1 AND consent_type = $2 AND granted = true', [userId, consentType]);
        return result.rows.length > 0;
    }

    // ==========================================
    // DATA EXPORT & DELETE
    // ==========================================

    static async getUser(userId) {
        const result = await pool.query('SELECT id, email, nombre, apellido_paterno, apellido_materno, role, created_at FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0];
    }

    static async getStudentData(userId) {
        const result = await pool.query('SELECT * FROM estudiantes WHERE id = $1', [userId]);
        return result.rows[0];
    }

    static async getGrades(userId) {
        const result = await pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1', [userId]);
        return result.rows;
    }

    static async getAttendance(userId) {
        const result = await pool.query('SELECT * FROM asistencias WHERE estudiante_id = $1', [userId]);
        return result.rows;
    }

    static async getNotifications(userId) {
        const result = await pool.query('SELECT * FROM notificaciones WHERE user_id = $1', [userId]);
        return result.rows;
    }

    static async getActivity(userId) {
        const result = await pool.query('SELECT action, entity, created_at FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
        return result.rows;
    }

    static async deleteUserData(userId, keepAuditLogs) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM calificaciones WHERE estudiante_id = $1', [userId]);
            await client.query('DELETE FROM asistencias WHERE estudiante_id = $1', [userId]);
            await client.query('DELETE FROM notificaciones WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM gdpr_consents WHERE user_id = $1', [userId]);
            await client.query('DELETE FROM estudiantes WHERE id = $1', [userId]);
            await client.query(`UPDATE usuarios SET email = 'deleted_' || id || '@deleted.local', nombre = 'Usuario', apellido_paterno = 'Eliminado', apellido_materno = '', password_hash = 'DELETED', status = 'deleted' WHERE id = $1`, [userId]);
            if (!keepAuditLogs) await client.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
            await client.query('COMMIT');
            return true;
        } catch (error) { await client.query('ROLLBACK'); throw error; }
        finally { client.release(); }
    }

    // ==========================================
    // GDPR REQUESTS
    // ==========================================

    static async logRequest(userId, type, status, details) {
        try { await pool.query('INSERT INTO gdpr_requests (user_id, request_type, status, details, created_at) VALUES ($1, $2, $3, $4, NOW())', [userId, type, status, details]); } catch { }
    }

    static async getRequests(userId, status, limit, offset) {
        let query = 'SELECT * FROM gdpr_requests WHERE 1=1'; const params = []; let idx = 1;
        if (userId) { query += ` AND user_id = $${idx++}`; params.push(userId); }
        if (status) { query += ` AND status = $${idx++}`; params.push(status); }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`; params.push(limit, offset);
        try { const result = await pool.query(query, params); return result.rows; } catch { return []; }
    }

    static async applyRetentionPolicy(daysToKeep) {
        let deleted = 0;
        const result1 = await pool.query(`DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`);
        deleted += result1.rowCount;
        const result2 = await pool.query("DELETE FROM notificaciones WHERE leida = true AND created_at < NOW() - INTERVAL '90 days'");
        deleted += result2.rowCount;
        return deleted;
    }

    // ==========================================
    // EMAIL CONFIRMATION
    // ==========================================

    static async savePendingConfirmation(uuid, token, formData, ipAddress, userAgent, expiresAt) {
        const result = await pool.query(`
            INSERT INTO pending_confirmations (uuid, confirmation_token, email, nombre, telefono, profesion, experiencia, habilidades, mensaje, ip_address, user_agent, expires_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id
        `, [uuid, token, formData.email, formData.nombre, formData.telefono, formData.profesion, formData.experiencia, formData.habilidades, formData.mensaje, ipAddress, userAgent, expiresAt]);
        return result.rows[0].id;
    }

    static async findPendingToken(token) {
        const result = await pool.query('SELECT * FROM pending_confirmations WHERE confirmation_token = $1 AND confirmed = false AND expires_at > NOW()', [token]);
        return result.rows[0];
    }

    static async markConfirmed(token) {
        await pool.query('UPDATE pending_confirmations SET confirmed = true, confirmed_at = NOW() WHERE confirmation_token = $1', [token]);
    }

    static async getPendingConfirmations(limit, offset) {
        const result = await pool.query('SELECT * FROM pending_confirmations WHERE confirmed = false ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countResult = await pool.query('SELECT COUNT(*) FROM pending_confirmations WHERE confirmed = false');
        return { rows: result.rows, total: parseInt(countResult.rows[0].count) };
    }

    static async cleanExpiredTokens() {
        const result = await pool.query('DELETE FROM pending_confirmations WHERE confirmed = false AND expires_at < NOW()');
        return result.rowCount;
    }

    // ==========================================
    // PRIVACY POLICY VERSION
    // ==========================================

    static async createPrivacyPolicyVersion(version, content, options) {
        const result = await pool.query('INSERT INTO privacy_policy_versions (version, content, effective_date, is_active, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id', [version, content, options.effectiveDate || new Date()]);
        await pool.query('UPDATE privacy_policy_versions SET is_active = false WHERE id != $1', [result.rows[0].id]);
        return result.rows[0];
    }

    static async getCurrentPrivacyPolicyVersion() {
        const result = await pool.query('SELECT * FROM privacy_policy_versions WHERE is_active = true LIMIT 1');
        return result.rows[0];
    }

    static async generateConsentReport(filters) {
        const result = await pool.query(`SELECT consent_type, COUNT(*) as total, COUNT(*) FILTER (WHERE granted = true) as granted, COUNT(*) FILTER (WHERE granted = false) as revoked FROM user_consents GROUP BY consent_type`);
        return result.rows;
    }
}

module.exports = GDPRDAO;
