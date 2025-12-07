/**
 * 🔒 GDPR DATA EXPORT DAO - TypeScript
 * Data Access Object para GDPR/FERPA compliance
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface GDPRRequestExport { // Shared name with gdpr.dao might conflict if imported together, naming unique here
    id: string | number; // ID seems to be passed in, so likely a string UUID or manually managed ID
    user_id: number;
    type: string;
    status: string;
    reason: string;
    requested_by: number;
    metadata: any;
    created_at: Date;
    expires_at: Date;
    updated_at?: Date;
    completed_at?: Date;
}

export interface ConsentReportEntry {
    id: number;
    email: string;
    consent_type: string;
    given_at: Date;
    revoked_at?: Date;
    ip_address: string;
}

// =====================================================
// GDPR DATA EXPORT DAO CLASS
// =====================================================

class GDPRDataExportDAO {

    // ==========================================
    // SOLICITUDES GDPR
    // ==========================================

    static async createRequest(requestId: string | number, userId: number, type: string, status: string, reason: string, requestedBy: number): Promise<GDPRRequestExport> {
        const result = await pool.query(`
            INSERT INTO gdpr_requests (id, user_id, type, status, reason, requested_by, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days') RETURNING *
        `, [requestId, userId, type, status, reason, requestedBy]);
        return result.rows[0];
    }

    static async getRequest(requestId: string | number): Promise<GDPRRequestExport | null> {
        const result = await pool.query('SELECT * FROM gdpr_requests WHERE id = $1', [requestId]);
        return result.rows[0] || null;
    }

    static async updateRequestStatus(requestId: string | number, status: string, metadata: any = {}, isCompleted: boolean = false): Promise<void> {
        await pool.query(`UPDATE gdpr_requests SET status = $2, metadata = metadata || $3, updated_at = NOW()
            ${isCompleted ? ', completed_at = NOW()' : ''} WHERE id = $1`,
            [requestId, status, JSON.stringify(metadata)]);
    }

    static async listUserRequests(userId: number): Promise<GDPRRequestExport[]> {
        const result = await pool.query('SELECT * FROM gdpr_requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return result.rows;
    }

    // ==========================================
    // RECOLECCIÓN DE DATOS
    // ==========================================

    static async getUserData(userId: number): Promise<any> {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0];
    }

    static async getTableData(tableName: string, identifier: string, targetId: number | string): Promise<any[]> {
        // Warning: Direct string interpolation for tableName/identifier. These must be safe values.
        // Assuming they come from trusted internal logic.
        const result = await pool.query(`SELECT * FROM ${tableName} WHERE ${identifier} = $1`, [targetId]);
        return result.rows;
    }

    static async getStudentData(userId: number): Promise<any> {
        const result = await pool.query('SELECT * FROM estudiantes WHERE id = $1', [userId]);
        return result.rows[0];
    }

    // ==========================================
    // CONSENTIMIENTOS
    // ==========================================

    static async getConsentReport(tenantId: number | null = null): Promise<ConsentReportEntry[]> {
        let query = `SELECT u.id, u.email, c.type as consent_type, c.given_at, c.revoked_at, c.ip_address
            FROM usuarios u LEFT JOIN user_consents c ON u.id = c.user_id`;
        const params: any[] = [];
        if (tenantId) { params.push(tenantId); query += ' WHERE u.tenant_id = $1'; }
        query += ' ORDER BY c.given_at DESC';
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async giveConsent(userId: number, type: string, ipAddress: string): Promise<any> {
        const result = await pool.query(`
            INSERT INTO user_consents (user_id, type, given_at, ip_address) VALUES ($1, $2, NOW(), $3)
            ON CONFLICT (user_id, type) DO UPDATE SET given_at = NOW(), revoked_at = NULL, ip_address = $3 RETURNING *
        `, [userId, type, ipAddress]);
        return result.rows[0];
    }

    static async revokeConsent(userId: number, type: string): Promise<any> {
        const result = await pool.query('UPDATE user_consents SET revoked_at = NOW() WHERE user_id = $1 AND type = $2 RETURNING *', [userId, type]);
        return result.rows[0];
    }

    // ==========================================
    // SUPRESIÓN DE DATOS
    // ==========================================

    static async anonymizeTable(tableName: string, columns: string[], identifier: string, targetId: number | string): Promise<number> {
        // Warning: Direct string interpolation again.
        const setClauses = columns.filter(c => c !== identifier).map(c => `${c} = '[ELIMINADO]'`).join(', ');
        const result = await pool.query(`UPDATE ${tableName} SET ${setClauses} WHERE ${identifier} = $1 RETURNING id`, [targetId]);
        return result.rows.length;
    }

    static async deleteFromTable(tableName: string, identifier: string, targetId: number | string): Promise<number> {
        const result = await pool.query(`DELETE FROM ${tableName} WHERE ${identifier} = $1 RETURNING id`, [targetId]);
        return result.rows.length;
    }
}

export default GDPRDataExportDAO;
module.exports = GDPRDataExportDAO;
