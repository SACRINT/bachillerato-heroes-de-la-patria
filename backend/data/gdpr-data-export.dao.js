"use strict";
/**
 * 🔒 GDPR DATA EXPORT DAO - TypeScript
 * Data Access Object para GDPR/FERPA compliance
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// GDPR DATA EXPORT DAO CLASS
// =====================================================
class GDPRDataExportDAO {
    // ==========================================
    // SOLICITUDES GDPR
    // ==========================================
    static async createRequest(requestId, userId, type, status, reason, requestedBy) {
        const result = await database_1.pool.query(`
            INSERT INTO gdpr_requests (id, user_id, type, status, reason, requested_by, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days') RETURNING *
        `, [requestId, userId, type, status, reason, requestedBy]);
        return result.rows[0];
    }
    static async getRequest(requestId) {
        const result = await database_1.pool.query('SELECT * FROM gdpr_requests WHERE id = $1', [requestId]);
        return result.rows[0] || null;
    }
    static async updateRequestStatus(requestId, status, metadata = {}, isCompleted = false) {
        await database_1.pool.query(`UPDATE gdpr_requests SET status = $2, metadata = metadata || $3, updated_at = NOW()
            ${isCompleted ? ', completed_at = NOW()' : ''} WHERE id = $1`, [requestId, status, JSON.stringify(metadata)]);
    }
    static async listUserRequests(userId) {
        const result = await database_1.pool.query('SELECT * FROM gdpr_requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return result.rows;
    }
    // ==========================================
    // RECOLECCIÓN DE DATOS
    // ==========================================
    static async getUserData(userId) {
        const result = await database_1.pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0];
    }
    static async getTableData(tableName, identifier, targetId) {
        // Warning: Direct string interpolation for tableName/identifier. These must be safe values.
        // Assuming they come from trusted internal logic.
        const result = await database_1.pool.query(`SELECT * FROM ${tableName} WHERE ${identifier} = $1`, [targetId]);
        return result.rows;
    }
    static async getStudentData(userId) {
        const result = await database_1.pool.query('SELECT * FROM estudiantes WHERE id = $1', [userId]);
        return result.rows[0];
    }
    // ==========================================
    // CONSENTIMIENTOS
    // ==========================================
    static async getConsentReport(tenantId = null) {
        let query = `SELECT u.id, u.email, c.type as consent_type, c.given_at, c.revoked_at, c.ip_address
            FROM usuarios u LEFT JOIN user_consents c ON u.id = c.user_id`;
        const params = [];
        if (tenantId) {
            params.push(tenantId);
            query += ' WHERE u.tenant_id = $1';
        }
        query += ' ORDER BY c.given_at DESC';
        const result = await database_1.pool.query(query, params);
        return result.rows;
    }
    static async giveConsent(userId, type, ipAddress) {
        const result = await database_1.pool.query(`
            INSERT INTO user_consents (user_id, type, given_at, ip_address) VALUES ($1, $2, NOW(), $3)
            ON CONFLICT (user_id, type) DO UPDATE SET given_at = NOW(), revoked_at = NULL, ip_address = $3 RETURNING *
        `, [userId, type, ipAddress]);
        return result.rows[0];
    }
    static async revokeConsent(userId, type) {
        const result = await database_1.pool.query('UPDATE user_consents SET revoked_at = NOW() WHERE user_id = $1 AND type = $2 RETURNING *', [userId, type]);
        return result.rows[0];
    }
    // ==========================================
    // SUPRESIÓN DE DATOS
    // ==========================================
    static async anonymizeTable(tableName, columns, identifier, targetId) {
        // Warning: Direct string interpolation again.
        const setClauses = columns.filter(c => c !== identifier).map(c => `${c} = '[ELIMINADO]'`).join(', ');
        const result = await database_1.pool.query(`UPDATE ${tableName} SET ${setClauses} WHERE ${identifier} = $1 RETURNING id`, [targetId]);
        return result.rows.length;
    }
    static async deleteFromTable(tableName, identifier, targetId) {
        const result = await database_1.pool.query(`DELETE FROM ${tableName} WHERE ${identifier} = $1 RETURNING id`, [targetId]);
        return result.rows.length;
    }
}
exports.default = GDPRDataExportDAO;
module.exports = GDPRDataExportDAO;
//# sourceMappingURL=gdpr-data-export.dao.js.map