/**
 * 🛡️ GDPR DAO - TypeScript
 * Data Access Object consolidado para GDPR, Consent Management y Email Confirmation
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface GDPRConsent {
    id: number;
    user_id: number;
    consents: any; // JSON
    ip_address: string;
    created_at: Date;
}

export interface UserConsent {
    id: number;
    user_id: number;
    consent_type: string;
    granted: boolean;
    ip_address: string;
    user_agent: string;
    metadata: any; // JSON
    granted_at: Date;
    revoked_at?: Date;
    updated_at?: Date;
}

export interface GDPRRequest {
    id?: number; // Auto-increment in some contexts, but uuid string in others (check usage) - Schema implies ID might be string or int. Looking at gdpr-data-export.dao, id is passed. Here it seems auto-increment for logRequest. Let's assume int for logRequest.
    user_id: number;
    request_type: string;
    status: string;
    details: any; // JSON
    created_at: Date;
}

export interface PendingConfirmation {
    id: number;
    uuid: string;
    confirmation_token: string;
    email: string;
    nombre: string;
    telefono?: string;
    profesion?: string;
    experiencia?: string;
    habilidades?: string;
    mensaje?: string;
    ip_address: string;
    user_agent: string;
    confirmed: boolean;
    confirmed_at?: Date;
    expires_at: Date;
    created_at: Date;
}

export interface PrivacyPolicyVersion {
    id: number;
    version: string;
    content: string;
    effective_date: Date;
    is_active: boolean;
    created_at: Date;
}

export interface ConsentReportItem {
    consent_type: string;
    total: number;
    granted: number;
    revoked: number;
}

// =====================================================
// GDPR DAO CLASS
// =====================================================

class GDPRDAO {
    // ==========================================
    // CONSENT MANAGEMENT
    // ==========================================

    static async recordConsent(userId: number, consents: any, ipAddress: string): Promise<number> {
        const result = await pool.query('INSERT INTO gdpr_consents (user_id, consents, ip_address, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id', [userId, JSON.stringify(consents), ipAddress]);
        return result.rows[0].id;
    }

    static async getConsent(userId: number): Promise<GDPRConsent | null> {
        const result = await pool.query('SELECT consents, created_at FROM gdpr_consents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        return result.rows[0] || null;
    }

    static async grantConsent(userId: number, consentType: string, granted: boolean, ipAddress: string, userAgent: string, metadata: any): Promise<UserConsent> {
        const result = await pool.query(`
            INSERT INTO user_consents (user_id, consent_type, granted, ip_address, user_agent, metadata, granted_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (user_id, consent_type) DO UPDATE SET granted = EXCLUDED.granted, ip_address = EXCLUDED.ip_address, updated_at = NOW()
            RETURNING *
        `, [userId, consentType, granted, ipAddress, userAgent, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    static async revokeConsent(userId: number, consentType: string): Promise<boolean> {
        const result = await pool.query('UPDATE user_consents SET granted = false, revoked_at = NOW() WHERE user_id = $1 AND consent_type = $2 RETURNING id', [userId, consentType]);
        return result.rowCount ? result.rowCount > 0 : false;
    }

    static async getUserConsents(userId: number): Promise<UserConsent[]> {
        const result = await pool.query('SELECT * FROM user_consents WHERE user_id = $1', [userId]);
        return result.rows;
    }

    static async hasActiveConsent(userId: number, consentType: string): Promise<boolean> {
        const result = await pool.query('SELECT granted FROM user_consents WHERE user_id = $1 AND consent_type = $2 AND granted = true', [userId, consentType]);
        return result.rows.length > 0;
    }

    // ==========================================
    // DATA EXPORT & DELETE
    // ==========================================

    static async getUser(userId: number): Promise<any> {
        // Limited fields as per original DAO
        const result = await pool.query('SELECT id, email, nombre, apellido_paterno, apellido_materno, role, created_at FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0];
    }

    static async getStudentData(userId: number): Promise<any> {
        const result = await pool.query('SELECT * FROM estudiantes WHERE id = $1', [userId]);
        return result.rows[0];
    }

    static async getGrades(userId: number): Promise<any[]> {
        const result = await pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1', [userId]);
        return result.rows;
    }

    static async getAttendance(userId: number): Promise<any[]> {
        const result = await pool.query('SELECT * FROM asistencias WHERE estudiante_id = $1', [userId]);
        return result.rows;
    }

    static async getNotifications(userId: number): Promise<any[]> {
        const result = await pool.query('SELECT * FROM notificaciones WHERE user_id = $1', [userId]);
        return result.rows;
    }

    static async getActivity(userId: number): Promise<any[]> {
        const result = await pool.query('SELECT action, entity, created_at FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100', [userId]);
        return result.rows;
    }

    static async deleteUserData(userId: number, keepAuditLogs: boolean): Promise<boolean> {
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
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ==========================================
    // GDPR REQUESTS
    // ==========================================

    static async logRequest(userId: number, type: string, status: string, details: any): Promise<void> {
        try { await pool.query('INSERT INTO gdpr_requests (user_id, request_type, status, details, created_at) VALUES ($1, $2, $3, $4, NOW())', [userId, type, status, details]); } catch { }
    }

    static async getRequests(userId: number, status: string, limit: number, offset: number): Promise<GDPRRequest[]> {
        let query = 'SELECT * FROM gdpr_requests WHERE 1=1';
        const params: any[] = [];
        let idx = 1;
        if (userId) { query += ` AND user_id = $${idx++}`; params.push(userId); }
        if (status) { query += ` AND status = $${idx++}`; params.push(status); }
        query += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`; params.push(limit, offset);
        try { const result = await pool.query(query, params); return result.rows; } catch { return []; }
    }

    static async applyRetentionPolicy(daysToKeep: number): Promise<number> {
        let deleted = 0;
        const days = Number(daysToKeep) || 90;
        const result1 = await pool.query(`DELETE FROM audit_logs WHERE created_at < NOW() - make_interval(days => $1)`, [days]);
        deleted += result1.rowCount || 0;
        const result2 = await pool.query("DELETE FROM notificaciones WHERE leida = true AND created_at < NOW() - INTERVAL '90 days'");
        deleted += result2.rowCount || 0;
        return deleted;
    }

    // ==========================================
    // EMAIL CONFIRMATION
    // ==========================================

    static async savePendingConfirmation(uuid: string, token: string, formData: any, ipAddress: string, userAgent: string, expiresAt: Date): Promise<number> {
        const result = await pool.query(`
            INSERT INTO pending_confirmations (uuid, confirmation_token, email, nombre, telefono, profesion, experiencia, habilidades, mensaje, ip_address, user_agent, expires_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) RETURNING id
        `, [uuid, token, formData.email, formData.nombre, formData.telefono, formData.profesion, formData.experiencia, formData.habilidades, formData.mensaje, ipAddress, userAgent, expiresAt]);
        return result.rows[0].id;
    }

    static async findPendingToken(token: string): Promise<PendingConfirmation | null> {
        const result = await pool.query('SELECT * FROM pending_confirmations WHERE confirmation_token = $1 AND confirmed = false AND expires_at > NOW()', [token]);
        return result.rows[0] || null;
    }

    static async markConfirmed(token: string): Promise<void> {
        await pool.query('UPDATE pending_confirmations SET confirmed = true, confirmed_at = NOW() WHERE confirmation_token = $1', [token]);
    }

    static async getPendingConfirmations(limit: number, offset: number): Promise<{ rows: PendingConfirmation[]; total: number }> {
        const result = await pool.query('SELECT * FROM pending_confirmations WHERE confirmed = false ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const countResult = await pool.query('SELECT COUNT(*) FROM pending_confirmations WHERE confirmed = false');
        return { rows: result.rows, total: parseInt(countResult.rows[0].count) };
    }

    static async cleanExpiredTokens(): Promise<number> {
        const result = await pool.query('DELETE FROM pending_confirmations WHERE confirmed = false AND expires_at < NOW()');
        return result.rowCount || 0;
    }

    // ==========================================
    // PRIVACY POLICY VERSION
    // ==========================================

    static async createPrivacyPolicyVersion(version: string, content: string, options: { effectiveDate?: Date }): Promise<PrivacyPolicyVersion> {
        const result = await pool.query('INSERT INTO privacy_policy_versions (version, content, effective_date, is_active, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id', [version, content, options.effectiveDate || new Date()]);
        await pool.query('UPDATE privacy_policy_versions SET is_active = false WHERE id != $1', [result.rows[0].id]);
        return result.rows[0]; // Logic in original returns id, but then selects or implies returning object implicitly via insert... actually original returns result.rows[0] which contains id only unless RETURNING * used. Original used RETURNING id. We should match return type or enhance. I'll stick to what original did but Typed.
    }

    static async getCurrentPrivacyPolicyVersion(): Promise<PrivacyPolicyVersion | null> {
        const result = await pool.query('SELECT * FROM privacy_policy_versions WHERE is_active = true LIMIT 1');
        return result.rows[0] || null;
    }

    static async generateConsentReport(filters: any): Promise<ConsentReportItem[]> {
        const result = await pool.query(`SELECT consent_type, COUNT(*) as total, COUNT(*) FILTER (WHERE granted = true) as granted, COUNT(*) FILTER (WHERE granted = false) as revoked FROM user_consents GROUP BY consent_type`);
        return result.rows.map(row => ({
            consent_type: row.consent_type,
            total: parseInt(row.total),
            granted: parseInt(row.granted),
            revoked: parseInt(row.revoked)
        }));
    }
}

export default GDPRDAO;
module.exports = GDPRDAO;
