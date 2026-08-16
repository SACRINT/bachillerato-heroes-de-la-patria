"use strict";
/**
 * 📧 EMAIL TEMPLATE DAO - TypeScript
 * Data Access Object para plantillas de email
 * Abstrae todas las queries SQL de EmailTemplateService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// EMAIL TEMPLATE DAO CLASS
// =====================================================
class EmailTemplateDAO {
    static async logEmail(data) {
        try {
            await database_1.pool.query(`
                INSERT INTO email_log (recipient, template, subject, status, message_id, error, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, [data.to, data.template, data.subject, data.status, data.messageId, data.error]);
        }
        catch (error) {
            console.warn('[EmailTemplateDAO] Error logging email:', error.message);
        }
    }
    static async getHistory(whereClause, params, limit, offset) {
        const query = `SELECT * FROM email_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async getStats(days) {
        const numDays = parseInt(days) || 30;
        const result = await database_1.pool.query(`
            SELECT template, status, COUNT(*) as count FROM email_log
            WHERE created_at >= NOW() - make_interval(days => $1) GROUP BY template, status ORDER BY count DESC
        `, [numDays]);
        return result.rows.map((row) => ({
            template: row.template,
            status: row.status,
            count: parseInt(row.count)
        }));
    }
}
exports.default = EmailTemplateDAO;
module.exports = EmailTemplateDAO;
//# sourceMappingURL=email-template.dao.js.map