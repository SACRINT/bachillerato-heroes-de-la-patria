/**
 * 🛒 STORE DAO - TypeScript
 * Data Access Object para tienda virtual con IACoins
 * 
 * Migración TypeScript: 06 Diciembre 2025
 */

import { pool } from '../config/database';
import { PoolClient } from 'pg';

// =====================================================
// INTERFACES
// =====================================================

export interface StoreItem {
    id: number;
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    is_available: boolean;
    stock?: number;
    max_per_user?: number;
    metadata?: Record<string, any>;
    created_at: Date;
}

export interface UserPurchasedItem {
    purchase_id: number;
    purchased_at: Date;
    item_id: number;
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    metadata?: Record<string, any>;
}

export interface StoreItemCreateData {
    name: string;
    description: string;
    category: string;
    price_iacoins: number;
    icon?: string;
    stock?: number;
    max_per_user?: number;
    metadata?: Record<string, any>;
}

export interface StoreFilters {
    category?: string;
    is_available?: boolean | string;
}

// =====================================================
// STORE DAO CLASS
// =====================================================

class StoreDAO {

    static async getItems(filters: StoreFilters = {}): Promise<StoreItem[]> {
        const { category, is_available = true } = filters;

        let query = `
            SELECT
                id, name, description, category, price_iacoins,
                icon, is_available, stock, max_per_user, metadata, created_at
            FROM store_items
            WHERE 1=1
        `;
        const params: string[] = [];

        if (category) {
            query += ` AND category = $${params.length + 1}`;
            params.push(category);
        }

        if (is_available === true || is_available === 'true') {
            query += ` AND is_available = true AND (stock IS NULL OR stock > 0)`;
        }

        query += ` ORDER BY category, price_iacoins`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getItemById(itemId: number): Promise<StoreItem | null> {
        const result = await pool.query(
            `SELECT * FROM store_items WHERE id = $1`,
            [itemId]
        );
        return result.rows[0] || null;
    }

    static async getUserPurchaseCount(userId: number, itemId: number): Promise<number> {
        const result = await pool.query(
            `SELECT COUNT(*) as times_purchased FROM user_items WHERE user_id = $1 AND item_id = $2`,
            [userId, itemId]
        );
        return parseInt(result.rows[0].times_purchased);
    }

    static async getUserItems(userId: number): Promise<UserPurchasedItem[]> {
        const result = await pool.query(
            `SELECT
                ui.id as purchase_id,
                ui.purchased_at,
                si.id as item_id,
                si.name,
                si.description,
                si.category,
                si.price_iacoins,
                si.icon,
                si.metadata
            FROM user_items ui
            JOIN store_items si ON ui.item_id = si.id
            WHERE ui.user_id = $1
            ORDER BY ui.purchased_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async createItem(itemData: StoreItemCreateData): Promise<StoreItem> {
        const { name, description, category, price_iacoins, icon, stock, max_per_user, metadata } = itemData;
        const result = await pool.query(
            `INSERT INTO store_items
            (name, description, category, price_iacoins, icon, stock, max_per_user, metadata, is_available)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *`,
            [name, description, category, price_iacoins, icon, stock, max_per_user, JSON.stringify(metadata || {})]
        );
        return result.rows[0];
    }

    static async getConnection(): Promise<PoolClient> {
        return pool.connect();
    }
}

export default StoreDAO;
module.exports = StoreDAO;
