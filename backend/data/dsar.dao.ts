/**
 * 📋 DSAR DAO - TypeScript
 * Data Access Object para solicitudes de acceso a datos GDPR
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface DsarRequest {
    id: string;
    user_id: string;
    request_type: string;
    email: string;
    status: string;
    verification_token: string;
    metadata: any;
    created_at: Date;
    due_date: Date;
    completed_at?: Date;
    verified_at?: Date;
    processing_started_at?: Date;
    export_path?: string;
    error_message?: string;
    nombre?: string; // Joined field
    apellido_paterno?: string; // Joined field
    user_email?: string; // Joined field
}

export interface UserProfile {
    uuid: string;
    email: string;
    username: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    role: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date;
}

export interface AcademicData {
    grades: any[];
    attendance: any[];
    enrollments: any[];
}

export interface CommunicationData {
    notifications: any[];
}

export interface FinancialData {
    payments: any[];
}

export interface UserFile {
    id: number;
    filename: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: Date;
    category: string;
}

export interface UserConsent {
    id: number;
    user_id: string;
    consent_type: string;
    granted_at: Date;
    revoked_at?: Date;
}

// =====================================================
// DSAR DAO CLASS
// =====================================================

class DsarDAO {

    static async createRequest(requestId: string, userId: string, requestType: string, email: string, verificationToken: string, metadata: any): Promise<DsarRequest> {
        const result = await pool.query(`INSERT INTO dsar_requests (id, user_id, request_type, email, status, verification_token, metadata, created_at, due_date) VALUES ($1, $2, $3, $4, 'pending_verification', $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days') RETURNING *`, [requestId, userId, requestType, email, verificationToken, JSON.stringify(metadata)]);
        return result.rows[0];
    }

    static async verifyRequest(token: string): Promise<DsarRequest | null> {
        const result = await pool.query(`UPDATE dsar_requests SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE verification_token = $1 AND status = 'pending_verification' RETURNING *`, [token]);
        return result.rows[0] || null;
    }

    static async getById(requestId: string): Promise<DsarRequest | null> {
        const result = await pool.query('SELECT * FROM dsar_requests WHERE id = $1', [requestId]);
        return result.rows[0] || null;
    }

    static async updateStatus(requestId: string, status: string, extraFields: { exportPath?: string; error?: string } = {}): Promise<void> {
        let query = `UPDATE dsar_requests SET status = $1`;
        const params: string[] = [status];
        if (status === 'processing') query += `, processing_started_at = CURRENT_TIMESTAMP`;
        if (status === 'completed' && extraFields.exportPath) { query += `, completed_at = CURRENT_TIMESTAMP, export_path = $2`; params.push(extraFields.exportPath); }
        if (status === 'failed' && extraFields.error) { query += `, error_message = $2`; params.push(extraFields.error); }
        query += ` WHERE id = $${params.length + 1}`;
        params.push(requestId);
        await pool.query(query, params);
    }

    static async getUserProfile(userId: string): Promise<UserProfile | null> {
        const result = await pool.query('SELECT uuid, email, username, nombre, apellido_paterno, apellido_materno, role, status, created_at, updated_at, last_login FROM usuarios WHERE uuid = $1', [userId]);
        return result.rows[0] || null;
    }

    static async getAcademicData(userId: string): Promise<AcademicData> {
        const data: AcademicData = { grades: [], attendance: [], enrollments: [] };
        try { data.grades = (await pool.query('SELECT * FROM calificaciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows; } catch { data.grades = []; }
        try { data.attendance = (await pool.query('SELECT * FROM asistencia WHERE estudiante_id = $1 ORDER BY fecha DESC', [userId])).rows; } catch { data.attendance = []; }
        try { data.enrollments = (await pool.query('SELECT * FROM inscripciones WHERE estudiante_id = $1 ORDER BY created_at DESC', [userId])).rows; } catch { data.enrollments = []; }
        return data;
    }

    static async getActivityLogs(userId: string): Promise<any[]> {
        try { const result = await pool.query('SELECT id, action, resource, resource_id, timestamp, ip_address, user_agent FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1000', [userId]); return result.rows; } catch { return []; }
    }

    static async getUserConsents(userId: string): Promise<UserConsent[]> {
        try { const result = await pool.query('SELECT * FROM user_consents WHERE user_id = $1 ORDER BY granted_at DESC', [userId]); return result.rows; } catch { return []; }
    }

    static async getCommunications(userId: string): Promise<CommunicationData> {
        const data: CommunicationData = { notifications: [] };
        try { data.notifications = (await pool.query('SELECT * FROM notificaciones WHERE usuario_id = $1 ORDER BY created_at DESC LIMIT 100', [userId])).rows; } catch { data.notifications = []; }
        return data;
    }

    static async getFinancialData(userId: string): Promise<FinancialData> {
        const data: FinancialData = { payments: [] };
        try { data.payments = (await pool.query('SELECT * FROM pagos WHERE estudiante_id = $1', [userId])).rows; } catch { data.payments = []; }
        return data;
    }

    static async getUserFiles(userId: string): Promise<UserFile[]> {
        try { const result = await pool.query('SELECT id, filename, file_path, file_size, mime_type, uploaded_at, category FROM user_files WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]); return result.rows; } catch { return []; }
    }

    /**
     * Obtener solicitud por ID (campos públicos para status)
     */
    static async getByIdPublic(requestId: string): Promise<DsarRequest | null> {
        const result = await pool.query(
            'SELECT id, request_type, status, created_at, due_date, completed_at FROM dsar_requests WHERE id = $1',
            [requestId]
        );
        return result.rows[0] || null;
    }

    /**
     * Obtener todas las solicitudes de un usuario
     */
    static async getUserRequests(userId: string): Promise<DsarRequest[]> {
        const result = await pool.query(
            `SELECT id, request_type, status, created_at, due_date, completed_at, verified_at
             FROM dsar_requests WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Obtener solicitud verificando ownership
     */
    static async getByIdAndUser(requestId: string, userId: string): Promise<DsarRequest | null> {
        const result = await pool.query(
            'SELECT * FROM dsar_requests WHERE id = $1 AND user_id = $2',
            [requestId, userId]
        );
        return result.rows[0] || null;
    }

    /**
     * Cancelar solicitud (soft delete)
     */
    static async cancelRequest(requestId: string): Promise<void> {
        await pool.query(
            `UPDATE dsar_requests SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [requestId]
        );
    }

    /**
     * Obtener solicitudes pendientes para admin
     */
    static async getPendingAdmin(): Promise<DsarRequest[]> {
        const result = await pool.query(
            `SELECT dr.id, dr.user_id, dr.request_type, dr.status, dr.created_at, dr.due_date, dr.email,
                    u.nombre, u.apellido_paterno, u.email AS user_email
             FROM dsar_requests dr
             LEFT JOIN usuarios u ON dr.user_id = u.uuid
             WHERE dr.status IN ('verified', 'processing')
             ORDER BY dr.created_at ASC`
        );
        return result.rows;
    }
}

export default DsarDAO;
module.exports = DsarDAO;
