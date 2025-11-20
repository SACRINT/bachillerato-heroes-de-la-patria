/**
 * Servicio de Marketplace de Recursos Educativos
 * BGE Héroes de la Patria
 * FASE 3 - Semana 23-24
 *
 * Sistema de compra-venta de recursos educativos con IACoins
 */

const pool = require('../data/database-access').pool;

class MarketplaceService {
    constructor() {
        // Comisión de la plataforma (10%)
        this.platformCommission = 0.10;

        // Tipos de items permitidos
        this.itemTypes = ['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course'];

        // Estados de items
        this.itemStatuses = ['draft', 'pending_review', 'published', 'rejected', 'archived'];
    }

    // ========================================
    // GESTIÓN DE ITEMS
    // ========================================

    /**
     * Crear nuevo item en el marketplace
     */
    async createItem(sellerId, itemData) {
        const {
            title, description, shortDescription, itemType, categoryId,
            priceCoins, subject, topics, gradeLevel, contentUrl,
            previewUrl, fileType, fileSizeBytes, tags, metadata
        } = itemData;

        // Generar slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Date.now().toString(36);

        const result = await pool.query(`
            INSERT INTO marketplace_items (
                seller_id, category_id, title, slug, description,
                short_description, item_type, content_url, preview_url,
                file_type, file_size_bytes, price_coins, is_free,
                subject, topics, grade_level, tags, metadata, status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, 'draft'
            )
            RETURNING *
        `, [
            sellerId, categoryId, title, slug, description,
            shortDescription, itemType, contentUrl, previewUrl,
            fileType, fileSizeBytes, priceCoins || 0, priceCoins === 0,
            subject, JSON.stringify(topics || []), gradeLevel,
            JSON.stringify(tags || []), JSON.stringify(metadata || {})
        ]);

        // Asegurar que el creador tenga registro de ganancias
        await pool.query(`
            INSERT INTO creator_earnings (creator_id)
            VALUES ($1)
            ON CONFLICT (creator_id) DO NOTHING
        `, [sellerId]);

        return result.rows[0];
    }

    /**
     * Obtener items con filtros
     */
    async getItems(options = {}) {
        const {
            categoryId, itemType, subject, sellerId, status = 'published',
            minPrice, maxPrice, isFree, isFeatured, search,
            sortBy = 'newest', page = 1, limit = 20
        } = options;
        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (status) {
            params.push(status);
            whereClause += ` AND i.status = $${params.length}`;
        }

        if (categoryId) {
            params.push(categoryId);
            whereClause += ` AND i.category_id = $${params.length}`;
        }

        if (itemType) {
            params.push(itemType);
            whereClause += ` AND i.item_type = $${params.length}`;
        }

        if (subject) {
            params.push(subject);
            whereClause += ` AND i.subject = $${params.length}`;
        }

        if (sellerId) {
            params.push(sellerId);
            whereClause += ` AND i.seller_id = $${params.length}`;
        }

        if (minPrice !== undefined) {
            params.push(minPrice);
            whereClause += ` AND i.price_coins >= $${params.length}`;
        }

        if (maxPrice !== undefined) {
            params.push(maxPrice);
            whereClause += ` AND i.price_coins <= $${params.length}`;
        }

        if (isFree !== undefined) {
            whereClause += ` AND i.is_free = ${isFree}`;
        }

        if (isFeatured) {
            whereClause += ` AND i.is_featured = true`;
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`;
        }

        // Ordenamiento
        let orderClause = 'ORDER BY ';
        switch (sortBy) {
            case 'popular':
                orderClause += 'i.purchase_count DESC';
                break;
            case 'rating':
                orderClause += 'i.rating_avg DESC';
                break;
            case 'price_low':
                orderClause += 'i.price_coins ASC';
                break;
            case 'price_high':
                orderClause += 'i.price_coins DESC';
                break;
            default:
                orderClause += 'i.created_at DESC';
        }

        params.push(limit, offset);

        const result = await pool.query(`
            SELECT i.*,
                u.nombre as seller_name,
                u.apellido_paterno as seller_lastname,
                c.name as category_name
            FROM marketplace_items i
            JOIN usuarios u ON i.seller_id = u.id
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            ${whereClause}
            ${orderClause}
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        return result.rows;
    }

    /**
     * Obtener item por ID
     */
    async getItemById(itemId, userId = null) {
        const result = await pool.query(`
            SELECT i.*,
                u.nombre as seller_name,
                u.apellido_paterno as seller_lastname,
                c.name as category_name
            FROM marketplace_items i
            JOIN usuarios u ON i.seller_id = u.id
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            WHERE i.id = $1
        `, [itemId]);

        if (result.rows.length === 0) return null;

        const item = result.rows[0];

        // Incrementar vistas
        await pool.query(`
            UPDATE marketplace_items
            SET view_count = view_count + 1
            WHERE id = $1
        `, [itemId]);

        // Verificar si el usuario ya compró el item
        if (userId) {
            const purchaseResult = await pool.query(`
                SELECT * FROM marketplace_purchases
                WHERE buyer_id = $1 AND item_id = $2
            `, [userId, itemId]);
            item.userPurchased = purchaseResult.rows.length > 0;

            // Verificar si está en favoritos
            const favoriteResult = await pool.query(`
                SELECT id FROM marketplace_favorites
                WHERE user_id = $1 AND item_id = $2
            `, [userId, itemId]);
            item.userFavorited = favoriteResult.rows.length > 0;
        }

        return item;
    }

    /**
     * Actualizar item
     */
    async updateItem(itemId, sellerId, updateData) {
        const {
            title, description, shortDescription, categoryId,
            priceCoins, subject, topics, tags, contentUrl, previewUrl
        } = updateData;

        // Verificar propiedad
        const item = await pool.query(`
            SELECT seller_id FROM marketplace_items WHERE id = $1
        `, [itemId]);

        if (item.rows.length === 0) {
            throw new Error('Item no encontrado');
        }

        if (item.rows[0].seller_id !== sellerId) {
            throw new Error('No autorizado');
        }

        const result = await pool.query(`
            UPDATE marketplace_items
            SET
                title = COALESCE($2, title),
                description = COALESCE($3, description),
                short_description = COALESCE($4, short_description),
                category_id = COALESCE($5, category_id),
                price_coins = COALESCE($6, price_coins),
                subject = COALESCE($7, subject),
                topics = COALESCE($8, topics),
                tags = COALESCE($9, tags),
                content_url = COALESCE($10, content_url),
                preview_url = COALESCE($11, preview_url),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [
            itemId, title, description, shortDescription, categoryId,
            priceCoins, subject, JSON.stringify(topics),
            JSON.stringify(tags), contentUrl, previewUrl
        ]);

        return result.rows[0];
    }

    /**
     * Enviar item a revisión
     */
    async submitForReview(itemId, sellerId) {
        const result = await pool.query(`
            UPDATE marketplace_items
            SET status = 'pending_review', updated_at = NOW()
            WHERE id = $1 AND seller_id = $2
            RETURNING *
        `, [itemId, sellerId]);

        return result.rows[0];
    }

    /**
     * Aprobar/rechazar item (admin)
     */
    async reviewItem(itemId, reviewerId, approved, rejectionReason = null) {
        const newStatus = approved ? 'published' : 'rejected';

        const result = await pool.query(`
            UPDATE marketplace_items
            SET
                status = $2,
                reviewed_by = $3,
                reviewed_at = NOW(),
                rejection_reason = $4,
                published_at = CASE WHEN $2 = 'published' THEN NOW() ELSE NULL END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [itemId, newStatus, reviewerId, rejectionReason]);

        return result.rows[0];
    }

    // ========================================
    // COMPRAS
    // ========================================

    /**
     * Comprar item
     */
    async purchaseItem(buyerId, itemId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Obtener item
            const itemResult = await client.query(`
                SELECT * FROM marketplace_items
                WHERE id = $1 AND status = 'published'
            `, [itemId]);

            if (itemResult.rows.length === 0) {
                throw new Error('Item no disponible');
            }

            const item = itemResult.rows[0];

            // Verificar que no sea el vendedor
            if (item.seller_id === buyerId) {
                throw new Error('No puedes comprar tu propio item');
            }

            // Verificar compra previa
            const existingPurchase = await client.query(`
                SELECT id FROM marketplace_purchases
                WHERE buyer_id = $1 AND item_id = $2
            `, [buyerId, itemId]);

            if (existingPurchase.rows.length > 0) {
                throw new Error('Ya has comprado este item');
            }

            // Verificar balance si no es gratis
            if (!item.is_free && item.price_coins > 0) {
                const balanceResult = await client.query(`
                    SELECT balance FROM iacoins_wallets WHERE user_id = $1
                `, [buyerId]);

                const balance = balanceResult.rows[0]?.balance || 0;
                if (balance < item.price_coins) {
                    throw new Error(`IACoins insuficientes. Necesitas: ${item.price_coins}`);
                }

                // Descontar al comprador
                await client.query(`
                    UPDATE iacoins_wallets
                    SET balance = balance - $2, total_spent = total_spent + $2
                    WHERE user_id = $1
                `, [buyerId, item.price_coins]);

                // Registrar transacción del comprador
                const buyerTx = await client.query(`
                    INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description)
                    VALUES ($1, 'spent', $2, $3)
                    RETURNING id
                `, [buyerId, item.price_coins, `Compra: ${item.title}`]);

                // Calcular ganancias del vendedor
                const commission = Math.floor(item.price_coins * this.platformCommission);
                const sellerEarnings = item.price_coins - commission;

                // Acreditar al vendedor
                await client.query(`
                    UPDATE iacoins_wallets
                    SET balance = balance + $2, total_earned = total_earned + $2
                    WHERE user_id = $1
                `, [item.seller_id, sellerEarnings]);

                // Registrar transacción del vendedor
                await client.query(`
                    INSERT INTO iacoins_transactions (user_id, transaction_type, amount, description)
                    VALUES ($1, 'earned', $2, $3)
                `, [item.seller_id, sellerEarnings, `Venta: ${item.title}`]);

                // Actualizar ganancias del creador
                await client.query(`
                    UPDATE creator_earnings
                    SET
                        total_earnings = total_earnings + $2,
                        available_balance = available_balance + $2,
                        updated_at = NOW()
                    WHERE creator_id = $1
                `, [item.seller_id, sellerEarnings]);

                // Registrar transacción de ganancias
                await client.query(`
                    INSERT INTO creator_transactions (
                        creator_id, transaction_type, gross_amount,
                        commission_amount, net_amount, description
                    ) VALUES ($1, 'sale', $2, $3, $4, $5)
                `, [
                    item.seller_id, item.price_coins, commission,
                    sellerEarnings, `Venta de: ${item.title}`
                ]);
            }

            // Crear registro de compra
            const purchase = await client.query(`
                INSERT INTO marketplace_purchases (
                    buyer_id, item_id, seller_id, price_paid
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [buyerId, itemId, item.seller_id, item.price_coins]);

            // Actualizar estadísticas del item
            await client.query(`
                UPDATE marketplace_items
                SET purchase_count = purchase_count + 1
                WHERE id = $1
            `, [itemId]);

            await client.query('COMMIT');
            return purchase.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Obtener compras del usuario
     */
    async getUserPurchases(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT p.*, i.title, i.item_type, i.preview_url, i.content_url
            FROM marketplace_purchases p
            JOIN marketplace_items i ON p.item_id = i.id
            WHERE p.buyer_id = $1
            ORDER BY p.purchased_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        return result.rows;
    }

    /**
     * Verificar si usuario tiene acceso a item
     */
    async hasAccess(userId, itemId) {
        const result = await pool.query(`
            SELECT id FROM marketplace_purchases
            WHERE buyer_id = $1 AND item_id = $2
        `, [userId, itemId]);

        return result.rows.length > 0;
    }

    // ========================================
    // REVIEWS
    // ========================================

    /**
     * Crear review
     */
    async createReview(reviewerId, itemId, rating, title, content) {
        // Verificar compra
        const purchase = await pool.query(`
            SELECT id FROM marketplace_purchases
            WHERE buyer_id = $1 AND item_id = $2
        `, [reviewerId, itemId]);

        const isVerified = purchase.rows.length > 0;

        const result = await pool.query(`
            INSERT INTO marketplace_reviews (
                item_id, reviewer_id, rating, title, content, is_verified_purchase
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (item_id, reviewer_id) DO UPDATE SET
                rating = $3,
                title = $4,
                content = $5,
                updated_at = NOW()
            RETURNING *
        `, [itemId, reviewerId, rating, title, content, isVerified]);

        return result.rows[0];
    }

    /**
     * Obtener reviews de un item
     */
    async getItemReviews(itemId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT r.*, u.nombre as reviewer_name, u.apellido_paterno
            FROM marketplace_reviews r
            JOIN usuarios u ON r.reviewer_id = u.id
            WHERE r.item_id = $1 AND NOT r.is_hidden
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `, [itemId, limit, offset]);

        return result.rows;
    }

    // ========================================
    // FAVORITOS
    // ========================================

    /**
     * Agregar a favoritos
     */
    async addToFavorites(userId, itemId) {
        const result = await pool.query(`
            INSERT INTO marketplace_favorites (user_id, item_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, item_id) DO NOTHING
            RETURNING *
        `, [userId, itemId]);

        return result.rows[0];
    }

    /**
     * Quitar de favoritos
     */
    async removeFromFavorites(userId, itemId) {
        await pool.query(`
            DELETE FROM marketplace_favorites
            WHERE user_id = $1 AND item_id = $2
        `, [userId, itemId]);
    }

    /**
     * Obtener favoritos del usuario
     */
    async getUserFavorites(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT i.*, f.created_at as favorited_at
            FROM marketplace_favorites f
            JOIN marketplace_items i ON f.item_id = i.id
            WHERE f.user_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        return result.rows;
    }

    // ========================================
    // VENDEDOR/CREADOR
    // ========================================

    /**
     * Obtener items del vendedor
     */
    async getSellerItems(sellerId, options = {}) {
        const { status, page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;
        const params = [sellerId];
        let whereClause = 'WHERE i.seller_id = $1';

        if (status) {
            params.push(status);
            whereClause += ` AND i.status = $${params.length}`;
        }

        params.push(limit, offset);

        const result = await pool.query(`
            SELECT i.*, c.name as category_name
            FROM marketplace_items i
            LEFT JOIN marketplace_categories c ON i.category_id = c.id
            ${whereClause}
            ORDER BY i.created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        return result.rows;
    }

    /**
     * Obtener ganancias del creador
     */
    async getCreatorEarnings(creatorId) {
        const result = await pool.query(`
            SELECT * FROM creator_earnings WHERE creator_id = $1
        `, [creatorId]);

        if (result.rows.length === 0) {
            return {
                total_sales: 0,
                total_earnings: 0,
                available_balance: 0,
                items_sold: 0
            };
        }

        return result.rows[0];
    }

    /**
     * Obtener historial de transacciones del creador
     */
    async getCreatorTransactions(creatorId, options = {}) {
        const { page = 1, limit = 20 } = options;
        const offset = (page - 1) * limit;

        const result = await pool.query(`
            SELECT * FROM creator_transactions
            WHERE creator_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [creatorId, limit, offset]);

        return result.rows;
    }

    /**
     * Obtener estadísticas del vendedor
     */
    async getSellerStats(sellerId) {
        const result = await pool.query(`
            SELECT
                COUNT(*) as total_items,
                COUNT(*) FILTER (WHERE status = 'published') as published_items,
                SUM(purchase_count) as total_sales,
                SUM(view_count) as total_views,
                AVG(rating_avg) FILTER (WHERE rating_count > 0) as avg_rating
            FROM marketplace_items
            WHERE seller_id = $1
        `, [sellerId]);

        return result.rows[0];
    }

    // ========================================
    // CATEGORÍAS
    // ========================================

    /**
     * Obtener categorías
     */
    async getCategories(parentId = null) {
        let query = `
            SELECT c.*,
                (SELECT COUNT(*) FROM marketplace_items WHERE category_id = c.id AND status = 'published') as item_count
            FROM marketplace_categories c
        `;

        if (parentId === null) {
            query += ` WHERE c.parent_id IS NULL`;
        } else {
            query += ` WHERE c.parent_id = $1`;
        }

        query += ` ORDER BY c.sort_order, c.name`;

        const result = await pool.query(query, parentId ? [parentId] : []);
        return result.rows;
    }

    // ========================================
    // PROMOCIONES
    // ========================================

    /**
     * Aplicar código promocional
     */
    async applyPromoCode(code, itemId, userId) {
        const result = await pool.query(`
            SELECT * FROM marketplace_promotions
            WHERE code = $1
                AND is_active = true
                AND (starts_at IS NULL OR starts_at <= NOW())
                AND (expires_at IS NULL OR expires_at > NOW())
                AND (max_uses IS NULL OR uses_count < max_uses)
        `, [code]);

        if (result.rows.length === 0) {
            throw new Error('Código promocional inválido o expirado');
        }

        const promo = result.rows[0];

        // Verificar uso por usuario
        // (En producción, verificar en tabla de usos por usuario)

        return promo;
    }

    // ========================================
    // REPORTES
    // ========================================

    /**
     * Reportar item
     */
    async reportItem(itemId, reporterId, reason, description) {
        const result = await pool.query(`
            INSERT INTO marketplace_reports (item_id, reporter_id, reason, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [itemId, reporterId, reason, description]);

        return result.rows[0];
    }
}

module.exports = new MarketplaceService();
