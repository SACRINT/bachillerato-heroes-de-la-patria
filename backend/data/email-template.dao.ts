/**
 * 📧 EMAIL TEMPLATE DAO - TypeScript
 * Data Access Object para plantillas de email
 * Abstrae todas las queries SQL de EmailTemplateService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface EmailLogEntry {
    to: string;
    template: string;
    subject: string;
    status: string;
    messageId?: string;
    error?: string;
    recipient?: string; // DB uses recipient, input uses to 
    created_at?: Date;
    [key: string]: any;
}

export interface EmailStats {
    template: string;
    status: string;
    count: number;
}

// =====================================================
// EMAIL TEMPLATE DAO CLASS
// =====================================================

class EmailTemplateDAO {

    static async logEmail(data: EmailLogEntry): Promise<void> {
        try {
            await pool.query(`
                INSERT INTO email_log (recipient, template, subject, status, message_id, error, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [data.to, data.template, data.subject, data.status, data.messageId, data.error]);
        } catch (error: any) {
            console.warn('[EmailTemplateDAO] Error logging email:', error.message);
        }
    }

    static async getHistory(whereClause: string, params: any[], limit: number, offset: number): Promise<EmailLogEntry[]> {
        const query = `SELECT * FROM email_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getStats(days: number): Promise<EmailStats[]> {
        const result = await pool.query(`
            SELECT template, status, COUNT(*) as count FROM email_log
            WHERE created_at >= NOW() - INTERVAL '${days} days' GROUP BY template, status ORDER BY count DESC
        `);
        return result.rows.map((row: any) => ({
            template: row.template,
            status: row.status,
            count: parseInt(row.count)
        }));
    }
}

export default EmailTemplateDAO;
module.exports = EmailTemplateDAO;
