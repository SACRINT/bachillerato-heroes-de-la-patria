"use strict";
/**
 * 🔐 TWO FACTOR DAO - TypeScript
 * Data Access Object para 2FA
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require('../config/database.js');
// =====================================================
// TWO FACTOR DAO CLASS
// =====================================================
class TwoFactorDAO {
    static async save(userId, secret, backupCodes) {
        await database_1.pool.query(`INSERT INTO user_2fa (user_id, secret, backup_codes, enabled, created_at) 
             VALUES ($1, $2, $3, false, NOW()) 
             ON CONFLICT (user_id) DO UPDATE SET secret = $2, backup_codes = $3, enabled = false`, [userId, secret, JSON.stringify(backupCodes)]);
    }
    static async getUserEmail(userId) {
        const result = await database_1.pool.query('SELECT email FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0]?.email || 'user@bge.edu.mx';
    }
    static async getSecretAndStatus(userId) {
        const result = await database_1.pool.query('SELECT secret, enabled FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0];
    }
    static async enable(userId) {
        await database_1.pool.query('UPDATE user_2fa SET enabled = true WHERE user_id = $1', [userId]);
    }
    static async disable(userId) {
        await database_1.pool.query('UPDATE user_2fa SET enabled = false WHERE user_id = $1', [userId]);
    }
    static async getBackupCodes(userId) {
        const result = await database_1.pool.query('SELECT backup_codes FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0];
    }
    static async updateBackupCodes(userId, backupCodes) {
        await database_1.pool.query('UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2', [JSON.stringify(backupCodes), userId]);
    }
    static async isEnabled(userId) {
        const result = await database_1.pool.query('SELECT enabled FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0]?.enabled || false;
    }
}
exports.default = TwoFactorDAO;
module.exports = TwoFactorDAO;
//# sourceMappingURL=two-factor.dao.js.map