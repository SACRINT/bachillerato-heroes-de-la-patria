/**
 * 📧 EMAIL CONFIRMATION DAO - TypeScript
 * Data Access Object para confirmación de email
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface PendingConfirmation {
    id: number;
    uuid: string;
    email: string;
    confirmation_token: string;
    token_expires_at: Date;
    form_data: any; // JSON
    ip_address: string;
    user_agent: string;
    email_sent_count: number;
    last_email_sent_at?: Date;
    confirmed_at?: Date;
    created_at: Date;
    status?: string; // Calculated field
}

export interface ConfirmationListData {
    data: PendingConfirmation[];
    total: number;
}

export interface ApprovalRecord {
    id: number;
    uuid: string;
}

// =====================================================
// EMAIL CONFIRMATION DAO CLASS
// =====================================================

class EmailConfirmationDAO {

    static async savePendingConfirmation(email: string, token: string, expiresAt: Date, formData: any, ipAddress: string, userAgent: string): Promise<PendingConfirmation> {
        const result = await pool.query(`
            INSERT INTO bolsa_trabajo_pending_confirmation (email, confirmation_token, token_expires_at, form_data, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO UPDATE SET confirmation_token = EXCLUDED.confirmation_token, token_expires_at = EXCLUDED.token_expires_at,
            form_data = EXCLUDED.form_data, email_sent_count = bolsa_trabajo_pending_confirmation.email_sent_count + 1, last_email_sent_at = NOW(), confirmed_at = NULL
            RETURNING id, uuid, confirmation_token, email
        `, [email, token, expiresAt, JSON.stringify(formData), ipAddress, userAgent]);
        return result.rows[0];
    }

    static async findByToken(token: string): Promise<PendingConfirmation | null> {
        const result = await pool.query('SELECT id, uuid, email, form_data, token_expires_at, confirmed_at FROM bolsa_trabajo_pending_confirmation WHERE confirmation_token = $1', [token]);
        return result.rows[0] || null;
    }

    static async markConfirmed(id: number): Promise<PendingConfirmation | null> {
        const result = await pool.query('UPDATE bolsa_trabajo_pending_confirmation SET confirmed_at = NOW() WHERE id = $1 RETURNING uuid, email, form_data', [id]);
        return result.rows[0] || null;
    }

    static async insertApprovalRecord(email: string, formData: any): Promise<ApprovalRecord> {
        const result = await pool.query(`INSERT INTO pendientes_aprobacion (tipo_solicitud, email_usuario, datos_json, estado, email_confirmado, fecha_solicitud) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, uuid`, ['bolsa_trabajo', email, formData, 'pendiente', true]);
        return result.rows[0];
    }

    static async getPendingConfirmations(limit: number, offset: number): Promise<ConfirmationListData> {
        const dataResult = await pool.query(`
            SELECT id, uuid, email, form_data, created_at, confirmed_at, email_sent_count, last_email_sent_at, token_expires_at,
            CASE WHEN confirmed_at IS NOT NULL THEN 'confirmado' WHEN token_expires_at < NOW() THEN 'expirado' ELSE 'pendiente' END as status
            FROM bolsa_trabajo_pending_confirmation ORDER BY created_at DESC LIMIT $1 OFFSET $2
        `, [limit, offset]);
        const countResult = await pool.query('SELECT COUNT(*) as total FROM bolsa_trabajo_pending_confirmation');
        return { data: dataResult.rows, total: parseInt(countResult.rows[0].total) };
    }

    static async cleanExpiredTokens(): Promise<number> {
        const result = await pool.query('DELETE FROM bolsa_trabajo_pending_confirmation WHERE token_expires_at < NOW() AND confirmed_at IS NULL RETURNING id');
        return result.rows.length;
    }
}

export default EmailConfirmationDAO;
module.exports = EmailConfirmationDAO;
