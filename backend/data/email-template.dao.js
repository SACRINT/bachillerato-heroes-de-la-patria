/**
 * 📧 EMAIL TEMPLATE DAO
 * Data Access Object para plantillas de email
 * Abstrae todas las queries SQL de EmailTemplateService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class EmailTemplateDAO {

    static async logEmail(data) {
        try {
            await pool.query(`
                INSERT INTO email_log (recipient, template, subject, status, message_id, error, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [data.to, data.template, data.subject, data.status, data.messageId, data.error]);
        } catch (error) {
            console.warn('[EmailTemplateDAO] Error logging email:', error.message);
        }
    }

    static async getHistory(whereClause, params, limit, offset) {
        const query = `SELECT * FROM email_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getStats(days) {
        const result = await pool.query(`
            SELECT template, status, COUNT(*) as count FROM email_log
            WHERE created_at >= NOW() - INTERVAL '${days} days' GROUP BY template, status ORDER BY count DESC
        `);
        return result.rows;
    }
}

module.exports = EmailTemplateDAO;
