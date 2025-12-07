/**
 * 🛒 MARKETPLACE DAO - TypeScript
 * Data Access Object para marketplace de recursos educativos
 * Abstrae todas las queries SQL de MarketplaceService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { pool } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

export interface MarketplaceItem {
    id: number;
    seller_id: number;
    category_id: number;
    title: string;
    slug: string;
    description: string;
    short_description: string;
    item_type: string;
    content_url?: string;
    preview_url?: string;
    file_type?: string;
    file_size_bytes?: number;
    price_coins: number;
    is_free: boolean;
    subject?: string;
    topics?: any; // JSON
    grade_level?: string;
    tags?: any; // JSON
    metadata?: any; // JSON
    status: string;
    view_count: number;
    purchase_count: number;
    rating_avg?: number;
    rating_count?: number;
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
    // Joined fields
    seller_name?: string;
    seller_lastname?: string;
    category_name?: string;
}

export interface CreatorEarnings {
    creator_id: number;
    total_earnings: number;
    available_balance: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreatorTransaction {
    id: number;
    creator_id: number;
    transaction_type: string;
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    description: string;
    created_at: Date;
}

export interface MarketplaceReview {
    id: number;
    item_id: number;
    reviewer_id: number;
    rating: number;
    title?: string;
    content?: string;
    is_verified_purchase: boolean;
    is_hidden: boolean;
    created_at: Date;
    updated_at: Date;
    // Joined fields
    reviewer_name?: string;
    apellido_paterno?: string;
}

export interface MarketplaceCategory {
    id: number;
    parent_id?: number;
    name: string;
    slug: string;
    sort_order: number;
    item_count?: number;
}

export interface MarketplacePromotion {
    id: number;
    code: string;
    is_active: boolean;
    starts_at?: Date;
    expires_at?: Date;
    max_uses?: number;
    uses_count: number;
    discount_percent?: number;
    discount_amount?: number;
}

export interface MarketplaceReport {
    id: number;
    item_id: number;
    reporter_id: number;
    reason: string;
    description?: string;
    status: string;
    created_at: Date;
}

export interface CreateItemInput {
    sellerId: number;
    categoryId: number;
    title: string;
    slug: string;
    description: string;
    shortDescription: string;
    itemType: string;
    contentUrl?: string;
    previewUrl?: string;
    fileType?: string;
    fileSizeBytes?: number;
    priceCoins: number;
    subject?: string;
    topics?: string[];
    gradeLevel?: string;
    tags?: string[];
    metadata?: any;
}

// =====================================================
// MARKETPLACE DAO CLASS
// =====================================================

class MarketplaceDAO {

    // ==========================================
    // ITEMS
    // ==========================================

    static async createItem(data: CreateItemInput): Promise<MarketplaceItem> {
        const {
            sellerId, categoryId, title, slug, description, shortDescription,
            itemType, contentUrl, previewUrl, fileType, fileSizeBytes,
            priceCoins, subject, topics, gradeLevel, tags, metadata
        } = data;

        const result = await pool.query(`
            INSERT INTO marketplace_items (
                seller_id, category_id, title, slug, description, short_description,
                item_type, content_url, preview_url, file_type, file_size_bytes,
                price_coins, is_free, subject, topics, grade_level, tags, metadata, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'draft')
            RETURNING *
        `, [
            sellerId, categoryId, title, slug, description, shortDescription,
            itemType, contentUrl, previewUrl, fileType, fileSizeBytes,
            priceCoins || 0, priceCoins === 0, subject, JSON.stringify(topics || []),
            gradeLevel, JSON.stringify(tags || []), JSON.stringify(metadata || {})
        ]);
        return result.rows[0];
    }

    static async ensureCreatorEarnings(sellerId: number): Promise<void> {
        await pool.query(`INSERT INTO creator_earnings (creator_id) VALUES ($1) ON CONFLICT (creator_id) DO NOTHING`, [sellerId]);
    }

    static async getItems(whereClause: string, params: any[], orderClause: string, limit: number, offset: number): Promise<MarketplaceItem[]> {
        params.push(limit, offset);
        const result = await pool.query(`
            SELECT i.*, u.nombre as seller_name, u.apellido_paterno as seller_lastname, c.name as category_name
            FROM marketplace_items i
            JOIN usuarios u ON i.seller_id = u.id
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            ${whereClause} ${orderClause}
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }

    static async getItemById(itemId: number): Promise<MarketplaceItem | null> {
        const result = await pool.query(`
            SELECT i.*, u.nombre as seller_name, u.apellido_paterno as seller_lastname, c.name as category_name
            FROM marketplace_items i
            JOIN usuarios u ON i.seller_id = u.id
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            WHERE i.id = $1
        `, [itemId]);
        return result.rows[0] || null;
    }

    static async incrementViewCount(itemId: number): Promise<void> {
        await pool.query(`UPDATE marketplace_items SET view_count = view_count + 1 WHERE id = $1`, [itemId]);
    }

    static async checkPurchase(userId: number, itemId: number): Promise<boolean> {
        const result = await pool.query(`SELECT * FROM marketplace_purchases WHERE buyer_id = $1 AND item_id = $2`, [userId, itemId]);
        return result.rows.length > 0;
    }

    static async checkFavorite(userId: number, itemId: number): Promise<boolean> {
        const result = await pool.query(`SELECT id FROM marketplace_favorites WHERE user_id = $1 AND item_id = $2`, [userId, itemId]);
        return result.rows.length > 0;
    }

    static async getItemSeller(itemId: number): Promise<number | undefined> {
        const result = await pool.query(`SELECT seller_id FROM marketplace_items WHERE id = $1`, [itemId]);
        return result.rows[0]?.seller_id;
    }

    static async updateItem(itemId: number, data: Partial<CreateItemInput>): Promise<MarketplaceItem> {
        const { title, description, shortDescription, categoryId, priceCoins, subject, topics, tags, contentUrl, previewUrl } = data;
        const result = await pool.query(`
            UPDATE marketplace_items SET
                title = COALESCE($2, title), description = COALESCE($3, description),
                short_description = COALESCE($4, short_description), category_id = COALESCE($5, category_id),
                price_coins = COALESCE($6, price_coins), subject = COALESCE($7, subject),
                topics = COALESCE($8, topics), tags = COALESCE($9, tags),
                content_url = COALESCE($10, content_url), preview_url = COALESCE($11, preview_url), updated_at = NOW()
            WHERE id = $1 RETURNING *
        `, [itemId, title, description, shortDescription, categoryId, priceCoins, subject, JSON.stringify(topics), JSON.stringify(tags), contentUrl, previewUrl]);
        return result.rows[0];
    }

    static async submitForReview(itemId: number, sellerId: number): Promise<MarketplaceItem> {
        const result = await pool.query(`UPDATE marketplace_items SET status = 'pending_review', updated_at = NOW() WHERE id = $1 AND seller_id = $2 RETURNING *`, [itemId, sellerId]);
        return result.rows[0];
    }

    static async reviewItem(itemId: number, reviewerId: number, approved: boolean, rejectionReason: string | null): Promise<MarketplaceItem> {
        const newStatus = approved ? 'published' : 'rejected';
        const result = await pool.query(`
            UPDATE marketplace_items SET status = $2, reviewed_by = $3, reviewed_at = NOW(), rejection_reason = $4,
                published_at = CASE WHEN $2 = 'published' THEN NOW() ELSE NULL END, updated_at = NOW()
            WHERE id = $1 RETURNING *
        `, [itemId, newStatus, reviewerId, rejectionReason]);
        return result.rows[0];
    }

    // ==========================================
    // COMPRAS (con transacciones)
    // ==========================================

    static async getPublishedItem(client: any, itemId: number): Promise<MarketplaceItem> {
        const result = await client.query(`SELECT * FROM marketplace_items WHERE id = $1 AND status = 'published'`, [itemId]);
        return result.rows[0];
    }

    static async getExistingPurchase(client: any, buyerId: number, itemId: number): Promise<any> {
        const result = await client.query(`SELECT id FROM marketplace_purchases WHERE buyer_id = $1 AND item_id = $2`, [buyerId, itemId]);
        return result.rows[0];
    }

    static async getWalletBalance(client: any, userId: number): Promise<number> {
        const result = await client.query(`SELECT balance FROM iacoins_wallets WHERE user_id = $1`, [userId]);
        return parseFloat(result.rows[0]?.balance) || 0;
    }

    static async deductBuyerBalance(client: any, buyerId: number, amount: number): Promise<void> {
        await client.query(`UPDATE iacoins_wallets SET balance = balance - $2, total_spent = total_spent + $2 WHERE user_id = $1`, [buyerId, amount]);
    }

    static async createBuyerTransaction(client: any, buyerId: number, amount: number, description: string): Promise<number> {
        const result = await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'spent', $2, $3) RETURNING id`, [buyerId, amount, description]);
        return result.rows[0].id;
    }

    static async creditSellerBalance(client: any, sellerId: number, amount: number): Promise<void> {
        await client.query(`UPDATE iacoins_wallets SET balance = balance + $2, total_earned = total_earned + $2 WHERE user_id = $1`, [sellerId, amount]);
    }

    static async createSellerTransaction(client: any, sellerId: number, amount: number, description: string): Promise<void> {
        await client.query(`INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description) VALUES ($1, 'earned', $2, $3)`, [sellerId, amount, description]);
    }

    static async updateCreatorEarnings(client: any, sellerId: number, amount: number): Promise<void> {
        await client.query(`UPDATE creator_earnings SET total_earnings = total_earnings + $2, available_balance = available_balance + $2, updated_at = NOW() WHERE creator_id = $1`, [sellerId, amount]);
    }

    static async createCreatorTransaction(client: any, sellerId: number, grossAmount: number, commission: number, netAmount: number, description: string): Promise<void> {
        await client.query(`INSERT INTO creator_transactions (creator_id, transaction_type, gross_amount, commission_amount, net_amount, description) VALUES ($1, 'sale', $2, $3, $4, $5)`, [sellerId, grossAmount, commission, netAmount, description]);
    }

    static async createPurchase(client: any, buyerId: number, itemId: number, sellerId: number, pricePaid: number): Promise<any> {
        const result = await client.query(`INSERT INTO marketplace_purchases (buyer_id, item_id, seller_id, price_paid) VALUES ($1, $2, $3, $4) RETURNING *`, [buyerId, itemId, sellerId, pricePaid]);
        return result.rows[0];
    }

    static async incrementPurchaseCount(client: any, itemId: number): Promise<void> {
        await client.query(`UPDATE marketplace_items SET purchase_count = purchase_count + 1 WHERE id = $1`, [itemId]);
    }

    static async getUserPurchases(userId: number, limit: number, offset: number): Promise<any[]> {
        const result = await pool.query(`
            SELECT p.*, i.title, i.item_type, i.preview_url, i.content_url
            FROM marketplace_purchases p JOIN marketplace_items i ON p.item_id = i.id
            WHERE p.buyer_id = $1 ORDER BY p.purchased_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return result.rows;
    }

    static async hasAccess(userId: number, itemId: number): Promise<boolean> {
        const result = await pool.query(`SELECT id FROM marketplace_purchases WHERE buyer_id = $1 AND item_id = $2`, [userId, itemId]);
        return result.rows.length > 0;
    }

    // ==========================================
    // REVIEWS
    // ==========================================

    static async createReview(itemId: number, reviewerId: number, rating: number, title: string, content: string, isVerified: boolean): Promise<MarketplaceReview> {
        const result = await pool.query(`
            INSERT INTO marketplace_reviews (item_id, reviewer_id, rating, title, content, is_verified_purchase)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (item_id, reviewer_id) DO UPDATE SET rating = $3, title = $4, content = $5, updated_at = NOW()
            RETURNING *
        `, [itemId, reviewerId, rating, title, content, isVerified]);
        return result.rows[0];
    }

    static async getItemReviews(itemId: number, limit: number, offset: number): Promise<MarketplaceReview[]> {
        const result = await pool.query(`
            SELECT r.*, u.nombre as reviewer_name, u.apellido_paterno
            FROM marketplace_reviews r JOIN usuarios u ON r.reviewer_id = u.id
            WHERE r.item_id = $1 AND NOT r.is_hidden ORDER BY r.created_at DESC LIMIT $2 OFFSET $3
        `, [itemId, limit, offset]);
        return result.rows;
    }

    // ==========================================
    // FAVORITOS
    // ==========================================

    static async addToFavorites(userId: number, itemId: number): Promise<any> {
        const result = await pool.query(`INSERT INTO marketplace_favorites (user_id, item_id) VALUES ($1, $2) ON CONFLICT (user_id, item_id) DO NOTHING RETURNING *`, [userId, itemId]);
        return result.rows[0];
    }

    static async removeFromFavorites(userId: number, itemId: number): Promise<void> {
        await pool.query(`DELETE FROM marketplace_favorites WHERE user_id = $1 AND item_id = $2`, [userId, itemId]);
    }

    static async getUserFavorites(userId: number, limit: number, offset: number): Promise<MarketplaceItem[]> {
        const result = await pool.query(`
            SELECT i.*, f.created_at as favorited_at
            FROM marketplace_favorites f JOIN marketplace_items i ON f.item_id = i.id
            WHERE f.user_id = $1 ORDER BY f.created_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return result.rows;
    }

    // ==========================================
    // VENDEDOR/CREADOR
    // ==========================================

    static async getSellerItems(sellerId: number, status: string | null, limit: number, offset: number): Promise<MarketplaceItem[]> {
        const params: any[] = [sellerId];
        let whereClause = 'WHERE i.seller_id = $1';
        if (status) {
            params.push(status);
            whereClause += ` AND i.status = $${params.length}`;
        }
        params.push(limit, offset);

        const result = await pool.query(`
            SELECT i.*, c.name as category_name FROM marketplace_items i
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            ${whereClause} ORDER BY i.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);
        return result.rows;
    }

    static async getCreatorEarnings(creatorId: number): Promise<CreatorEarnings> {
        const result = await pool.query(`SELECT * FROM creator_earnings WHERE creator_id = $1`, [creatorId]);
        return result.rows[0];
    }

    static async getCreatorTransactions(creatorId: number, limit: number, offset: number): Promise<CreatorTransaction[]> {
        const result = await pool.query(`SELECT * FROM creator_transactions WHERE creator_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, [creatorId, limit, offset]);
        return result.rows;
    }

    static async getSellerStats(sellerId: number): Promise<any> {
        const result = await pool.query(`
            SELECT COUNT(*) as total_items, COUNT(*) FILTER (WHERE status = 'published') as published_items,
                   SUM(purchase_count) as total_sales, SUM(view_count) as total_views,
                   AVG(rating_avg) FILTER (WHERE rating_count > 0) as avg_rating
            FROM marketplace_items WHERE seller_id = $1
        `, [sellerId]);
        const row = result.rows[0];
        return {
            total_items: parseInt(row.total_items),
            published_items: parseInt(row.published_items),
            total_sales: parseInt(row.total_sales),
            total_views: parseInt(row.total_views),
            avg_rating: parseFloat(row.avg_rating)
        };
    }

    // ==========================================
    // CATEGORÍAS Y PROMOCIONES
    // ==========================================

    static async getCategories(parentId: number | null): Promise<MarketplaceCategory[]> {
        let query = `SELECT c.*, (SELECT COUNT(*) FROM marketplace_items WHERE category_id = c.id AND status = 'published') as item_count FROM marketplace_categories c`;
        query += parentId === null ? ` WHERE c.parent_id IS NULL` : ` WHERE c.parent_id = $1`;
        query += ` ORDER BY c.sort_order, c.name`;

        const result = await pool.query(query, parentId ? [parentId] : []);
        return result.rows;
    }

    static async getPromoCode(code: string): Promise<MarketplacePromotion | undefined> {
        const result = await pool.query(`
            SELECT * FROM marketplace_promotions
            WHERE code = $1 AND is_active = true
            AND (starts_at IS NULL OR starts_at <= NOW())
            AND (expires_at IS NULL OR expires_at > NOW())
            AND (max_uses IS NULL OR uses_count < max_uses)
        `, [code]);
        return result.rows[0];
    }

    static async reportItem(itemId: number, reporterId: number, reason: string, description: string): Promise<MarketplaceReport> {
        const result = await pool.query(`INSERT INTO marketplace_reports (item_id, reporter_id, reason, description) VALUES ($1, $2, $3, $4) RETURNING *`, [itemId, reporterId, reason, description]);
        return result.rows[0];
    }

    // Helper para transacciones
    static async getConnection(): Promise<any> {
        return pool.connect();
    }
}

export default MarketplaceDAO;
module.exports = MarketplaceDAO;
