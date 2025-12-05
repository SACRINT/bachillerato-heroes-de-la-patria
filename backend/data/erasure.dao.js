/**
 * 🗑️ ERASURE DAO
 * Data Access Object para derecho al olvido GDPR
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { pool } = require('../config/database');

class ErasureDAO {

    static async getActivePayments(userId) {
        const result = await pool.query('SELECT COUNT(*) FROM pagos_pendientes WHERE usuario_id = $1 AND estado = \'pendiente\'', [userId]);
        return parseInt(result.rows[0].count);
    }

    static async getRecentGrades(userId) {
        const result = await pool.query('SELECT COUNT(*) FROM calificaciones WHERE estudiante_id = $1 AND created_at > NOW() - INTERVAL \'7 years\'', [userId]);
        return parseInt(result.rows[0].count);
    }

    static async getActiveLegalCases(userId) {
        const result = await pool.query('SELECT COUNT(*) FROM legal_cases WHERE user_id = $1 AND status = \'active\'', [userId]);
        return parseInt(result.rows[0].count);
    }

    static async getPublicContent(userId) {
        const result = await pool.query('SELECT COUNT(*) FROM forum_posts WHERE user_id = $1 AND is_public = true', [userId]);
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
        const result = await pool.query('SELECT * FROM gdpr_erasure_log WHERE user_id = $1 AND executed_at > NOW() - INTERVAL \'30 days\'', [userId]);
        return result.rows[0];
    }

    static async restoreUser(userId, originalData) {
        await pool.query('UPDATE usuarios SET email = $1, nombre = $2, apellido_paterno = $3, status = \'activo\', deleted_at = NULL WHERE id = $4', [originalData.email, originalData.nombre, originalData.apellido_paterno, userId]);
    }

    static getConnection() { return pool.connect(); }
}

module.exports = ErasureDAO;
