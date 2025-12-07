/**
 * 🔐 TWO FACTOR DAO - TypeScript
 * Data Access Object para 2FA
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface TwoFactorData {
    secret: string;
    enabled: boolean;
}

export interface BackupCodesData {
    backup_codes: string[];
}

// =====================================================
// TWO FACTOR DAO CLASS
// =====================================================

class TwoFactorDAO {

    static async save(userId: number, secret: string, backupCodes: string[]): Promise<void> {
        await pool.query(
            `INSERT INTO user_2fa (user_id, secret, backup_codes, enabled, created_at) 
             VALUES ($1, $2, $3, false, NOW()) 
             ON CONFLICT (user_id) DO UPDATE SET secret = $2, backup_codes = $3, enabled = false`,
            [userId, secret, JSON.stringify(backupCodes)]
        );
    }

    static async getUserEmail(userId: number): Promise<string> {
        const result = await pool.query('SELECT email FROM usuarios WHERE id = $1', [userId]);
        return result.rows[0]?.email || 'user@bge.edu.mx';
    }

    static async getSecretAndStatus(userId: number): Promise<TwoFactorData | undefined> {
        const result = await pool.query('SELECT secret, enabled FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0];
    }

    static async enable(userId: number): Promise<void> {
        await pool.query('UPDATE user_2fa SET enabled = true WHERE user_id = $1', [userId]);
    }

    static async disable(userId: number): Promise<void> {
        await pool.query('UPDATE user_2fa SET enabled = false WHERE user_id = $1', [userId]);
    }

    static async getBackupCodes(userId: number): Promise<BackupCodesData | undefined> {
        const result = await pool.query('SELECT backup_codes FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0];
    }

    static async updateBackupCodes(userId: number, backupCodes: string[]): Promise<void> {
        await pool.query('UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2', [JSON.stringify(backupCodes), userId]);
    }

    static async isEnabled(userId: number): Promise<boolean> {
        const result = await pool.query('SELECT enabled FROM user_2fa WHERE user_id = $1', [userId]);
        return result.rows[0]?.enabled || false;
    }
}

export default TwoFactorDAO;
module.exports = TwoFactorDAO;
