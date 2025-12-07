/**
 * 💰 WALLET DAO - TypeScript
 * Data Access Object para sistema de IACoins
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';
import { PoolClient } from 'pg';

// =====================================================
// INTERFACES
// =====================================================

export interface WalletRow {
    user_id: number;
    balance: number;
    total_earned: number;
    total_spent: number;
    total_purchased: number;
    created_at: Date;
    updated_at: Date;
}

export interface WalletTransaction {
    id: number;
    user_id: number;
    transaction_type: 'earn' | 'spend' | 'purchase';
    amount: number;
    balance_after: number;
    description: string;
    metadata?: Record<string, any>;
    created_at: Date;
}

export interface WalletHistoryResult {
    transactions: WalletTransaction[];
    total: number;
}

export interface WalletHistoryOptions {
    type?: 'earn' | 'spend' | 'purchase';
    limit?: number;
    offset?: number;
}

// =====================================================
// WALLET DAO CLASS
// =====================================================

class WalletDAO {

    static async getByUserId(userId: number): Promise<WalletRow | null> {
        const result = await pool.query(
            `SELECT user_id, balance, total_earned, total_spent, total_purchased, created_at, updated_at
             FROM wallet WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    static async create(userId: number, initialBalance: number = 0): Promise<WalletRow> {
        const result = await pool.query(
            `INSERT INTO wallet (user_id, balance, total_earned, total_spent, total_purchased)
             VALUES ($1, $2, $2, 0, 0)
             RETURNING *`,
            [userId, initialBalance]
        );
        return result.rows[0];
    }

    static async getHistory(userId: number, options: WalletHistoryOptions = {}): Promise<WalletHistoryResult> {
        const { type, limit = 50, offset = 0 } = options;

        let query = `
            SELECT id, user_id, transaction_type, amount, balance_after, description, metadata, created_at
            FROM wallet_history
            WHERE user_id = $1
        `;
        const params: (number | string)[] = [userId];

        if (type && ['earn', 'spend', 'purchase'].includes(type)) {
            query += ` AND transaction_type = $${params.length + 1}`;
            params.push(type);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const countResult = await pool.query(
            `SELECT COUNT(*) as total FROM wallet_history WHERE user_id = $1`,
            [userId]
        );

        return {
            transactions: result.rows,
            total: parseInt(countResult.rows[0].total)
        };
    }

    static async getConnection(): Promise<PoolClient> {
        return pool.connect();
    }
}

export default WalletDAO;
module.exports = WalletDAO;
