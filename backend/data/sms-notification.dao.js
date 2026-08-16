"use strict";
/**
 * 📱 SMS NOTIFICATION DAO - TypeScript
 * Data Access Object para notificaciones SMS
 * Abstrae todas las queries SQL de SMSNotificationService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// SMS NOTIFICATION DAO CLASS
// =====================================================
class SMSNotificationDAO {
    // ==========================================
    // ALERTAS Y DATOS
    // ==========================================
    static async getStudentParents(studentId) {
        const result = await database_1.pool.query(`
            SELECT e.nombre as student_name, e.apellido_paterno, p.telefono as parent_phone, p.idioma_preferido
            FROM estudiantes e JOIN padres p ON e.id = p.estudiante_id
            WHERE e.id = $1 AND p.telefono IS NOT NULL
        `, [studentId]);
        return result.rows;
    }
    static async getAppointment(appointmentId) {
        const result = await database_1.pool.query(`
            SELECT c.*, u.telefono, u.idioma_preferido
            FROM citas c JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.id = $1 AND u.telefono IS NOT NULL
        `, [appointmentId]);
        return result.rows[0] || null;
    }
    // ==========================================
    // CÓDIGOS DE VERIFICACIÓN
    // ==========================================
    static async saveVerificationCode(phone, code) {
        await database_1.pool.query(`
            INSERT INTO verification_codes (phone, code, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
            ON CONFLICT (phone) DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes'
        `, [phone, code]);
    }
    static async getValidCode(phone, code) {
        const result = await database_1.pool.query(`
            SELECT * FROM verification_codes WHERE phone = $1 AND code = $2 AND expires_at > NOW()
        `, [phone, code]);
        return result.rows[0] || null;
    }
    static async deleteCode(phone) {
        await database_1.pool.query('DELETE FROM verification_codes WHERE phone = $1', [phone]);
    }
    // ==========================================
    // LOG DE SMS
    // ==========================================
    static async logSMS(data) {
        const result = await database_1.pool.query(`
            INSERT INTO sms_log (phone_to, message, template, status, priority, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id
        `, [data.to, data.message, data.template, data.status, data.priority]);
        return result.rows[0].id;
    }
    static async updateSMSStatus(id, status, providerId) {
        await database_1.pool.query(`
            UPDATE sms_log SET status = $2, provider_id = $3, updated_at = NOW() WHERE id = $1
        `, [id, status, providerId]);
    }
    static async getHistory(whereClause, params, limit, offset) {
        const query = `SELECT * FROM sms_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async getHistoryCount(whereClause, params) {
        const query = `SELECT COUNT(*) FROM sms_log WHERE ${whereClause}`;
        const result = await database_1.pool.query(query, params);
        return parseInt(result.rows[0].count, 10);
    }
    static async getStats() {
        const result = await database_1.pool.query(`
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                DATE_TRUNC('day', created_at) as day
            FROM sms_log WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', created_at) ORDER BY day DESC
        `);
        return result.rows.map((row) => ({
            total: parseInt(row.total),
            sent: parseInt(row.sent),
            failed: parseInt(row.failed),
            pending: parseInt(row.pending),
            day: row.day
        }));
    }
}
exports.default = SMSNotificationDAO;
module.exports = SMSNotificationDAO;
//# sourceMappingURL=sms-notification.dao.js.map