"use strict";
/**
 * 🗑️ ERASURE DAO - TypeScript
 * Data Access Object para derecho al olvido GDPR
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// ERASURE DAO CLASS
// =====================================================
class ErasureDAO {
    static async getActivePayments(userId) {
        const result = await database_1.pool.query('SELECT COUNT(*) FROM pagos_pendientes WHERE usuario_id = $1 AND estado = \'pendiente\'', [userId]);
        return parseInt(result.rows[0].count);
    }
    static async getRecentGrades(userId) {
        const result = await database_1.pool.query('SELECT COUNT(*) FROM calificaciones WHERE estudiante_id = $1 AND created_at > NOW() - INTERVAL \'7 years\'', [userId]);
        return parseInt(result.rows[0].count);
    }
    static async getActiveLegalCases(userId) {
        const result = await database_1.pool.query('SELECT COUNT(*) FROM legal_cases WHERE user_id = $1 AND status = \'active\'', [userId]);
        return parseInt(result.rows[0].count);
    }
    static async getPublicContent(userId) {
        const result = await database_1.pool.query('SELECT COUNT(*) FROM forum_posts WHERE user_id = $1 AND is_public = true', [userId]);
        return parseInt(result.rows[0].count);
    }
    static async pseudonymizeUser(client, userId, pseudonym) {
        await client.query(`UPDATE usuarios SET email = $1, nombre = 'ELIMINADO', apellido_paterno = 'USUARIO', apellido_materno = '', telefono = NULL, direccion = NULL, foto_perfil = NULL, status = 'eliminado_gdpr', deleted_at = NOW() WHERE id = $2`, [`${pseudonym}@deleted.local`, userId]);
    }
    static async deleteNonEssentialData(client, userId) {
        await client.query('DELETE FROM sesiones WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM notificaciones WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM user_consents WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM activity_logs WHERE user_id = $1', [userId]);
    }
    static async anonymizePublicContent(client, userId, pseudonym) {
        await client.query('UPDATE forum_posts SET author_name = $1 WHERE user_id = $2', [`Usuario ${pseudonym}`, userId]);
        await client.query('UPDATE forum_comments SET author_name = $1 WHERE user_id = $2', [`Usuario ${pseudonym}`, userId]);
    }
    static async logErasureAction(client, userId, requestedBy, reason, validation) {
        await client.query(`INSERT INTO gdpr_erasure_log (user_id, requested_by, reason, validation_result, executed_at) VALUES ($1, $2, $3, $4, NOW())`, [userId, requestedBy, reason, JSON.stringify(validation)]);
    }
    static async getErasureLog(userId) {
        const result = await database_1.pool.query('SELECT * FROM gdpr_erasure_log WHERE user_id = $1 AND executed_at > NOW() - INTERVAL \'30 days\'', [userId]);
        return result.rows[0] || null;
    }
    static async restoreUser(userId, originalData) {
        await database_1.pool.query('UPDATE usuarios SET email = $1, nombre = $2, apellido_paterno = $3, status = \'activo\', deleted_at = NULL WHERE id = $4', [originalData.email, originalData.nombre, originalData.apellido_paterno, userId]);
    }
    static getConnection() { return database_1.pool.connect(); }
    /**
     * Crear solicitud de eliminación DSAR
     */
    static async createDsarErasureRequest(requestId, userId, email, metadata) {
        await database_1.pool.query(`INSERT INTO dsar_requests (
                id, user_id, request_type, email, status, metadata, created_at, due_date
            ) VALUES (
                $1, $2, 'erasure', $3, 'verified', $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
            )`, [requestId, userId, email, JSON.stringify(metadata)]);
    }
    /**
     * Registrar restauración en audit_logs
     */
    static async logErasureRestoration(adminId, userId, reason) {
        await database_1.pool.query(`INSERT INTO audit_logs (
                user_id, action, resource, resource_id, changes, ip_address, user_agent, hash, previous_hash
            ) VALUES (
                $1, 'RESTORE_ERASED_USER', 'usuarios', $2, $3::jsonb, '0.0.0.0', 'System', '', ''
            )`, [adminId, userId, JSON.stringify({ reason, restoredBy: adminId })]);
    }
    /**
     * Obtener solicitudes de eliminación pendientes
     */
    static async getPendingErasureRequests() {
        const result = await database_1.pool.query(`SELECT
                dr.id, dr.user_id, dr.email, dr.status, dr.created_at, dr.due_date, dr.metadata,
                u.nombre, u.apellido_paterno, u.email AS user_email, u.role, u.status AS user_status
            FROM dsar_requests dr
            LEFT JOIN usuarios u ON dr.user_id = u.uuid
            WHERE dr.request_type = 'erasure'
                AND dr.status IN ('verified', 'processing')
            ORDER BY dr.created_at ASC`);
        return result.rows;
    }
}
exports.default = ErasureDAO;
module.exports = ErasureDAO;
//# sourceMappingURL=erasure.dao.js.map