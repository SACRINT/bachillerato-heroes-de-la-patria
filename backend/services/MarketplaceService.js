/**
 * 🛒 MARKETPLACE SERVICE
 * Servicio para marketplace de recursos educativos
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar MarketplaceDAO
 * - Sin SQL directo en el servicio
 */

const MarketplaceDAO = require('../data/marketplace.dao');

class MarketplaceService {
    constructor() {
        this.platformCommission = 0.10;
        this.itemTypes = ['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course'];
        this.itemStatuses = ['draft', 'pending_review', 'published', 'rejected', 'archived'];
    }

    // ========================================
    // GESTIÓN DE ITEMS
    // ========================================

    async createItem(sellerId, itemData) {
        const { title } = itemData;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

        const item = await MarketplaceDAO.createItem({ ...itemData, sellerId, slug });
        await MarketplaceDAO.ensureCreatorEarnings(sellerId);
        return item;
    }

    async getItems(options = {}) {
        const {
            categoryId, itemType, subject, sellerId, status = 'published',
            minPrice, maxPrice, isFree, isFeatured, search,
            sortBy = 'newest', page = 1, limit = 20
        } = options;

        const offset = (page - 1) * limit;
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (status) { params.push(status); whereClause += ` AND i.status = $${params.length}`; }
        if (categoryId) { params.push(categoryId); whereClause += ` AND i.category_id = $${params.length}`; }
        if (itemType) { params.push(itemType); whereClause += ` AND i.item_type = $${params.length}`; }
        if (subject) { params.push(subject); whereClause += ` AND i.subject = $${params.length}`; }
        if (sellerId) { params.push(sellerId); whereClause += ` AND i.seller_id = $${params.length}`; }
        if (minPrice !== undefined) { params.push(minPrice); whereClause += ` AND i.price_coins >= $${params.length}`; }
        if (maxPrice !== undefined) { params.push(maxPrice); whereClause += ` AND i.price_coins <= $${params.length}`; }
        if (isFree !== undefined) { whereClause += ` AND i.is_free = ${isFree}`; }
        if (isFeatured) { whereClause += ` AND i.is_featured = true`; }
        if (search) { params.push(`%${search}%`); whereClause += ` AND (i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`; }

        const orderMap = { popular: 'i.purchase_count DESC', rating: 'i.rating_avg DESC', price_low: 'i.price_coins ASC', price_high: 'i.price_coins DESC' };
        const orderClause = `ORDER BY ${orderMap[sortBy] || 'i.created_at DESC'}`;

        return MarketplaceDAO.getItems(whereClause, params, orderClause, limit, offset);
    }

    async getItemById(itemId, userId = null) {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item) return null;

        await MarketplaceDAO.incrementViewCount(itemId);

        if (userId) {
            item.userPurchased = await MarketplaceDAO.checkPurchase(userId, itemId);
            item.userFavorited = await MarketplaceDAO.checkFavorite(userId, itemId);
        }
        return item;
    }

    async updateItem(itemId, sellerId, updateData) {
        const currentSeller = await MarketplaceDAO.getItemSeller(itemId);
        if (!currentSeller) throw new Error('Item no encontrado');
        if (currentSeller !== sellerId) throw new Error('No autorizado');

        return MarketplaceDAO.updateItem(itemId, updateData);
    }

    async submitForReview(itemId, sellerId) {
        return MarketplaceDAO.submitForReview(itemId, sellerId);
    }

    async reviewItem(itemId, reviewerId, approved, rejectionReason = null) {
        return MarketplaceDAO.reviewItem(itemId, reviewerId, approved, rejectionReason);
    }

    // ========================================
    // COMPRAS
    // ========================================

    async purchaseItem(buyerId, itemId) {
        const client = await MarketplaceDAO.getConnection();
        try {
            await client.query('BEGIN');

            const item = await MarketplaceDAO.getPublishedItem(client, itemId);
            if (!item) throw new Error('Item no disponible');
            if (item.seller_id === buyerId) throw new Error('No puedes comprar tu propio item');

            const existingPurchase = await MarketplaceDAO.getExistingPurchase(client, buyerId, itemId);
            if (existingPurchase) throw new Error('Ya has comprado este item');

            if (!item.is_free && item.price_coins > 0) {
                const balance = await MarketplaceDAO.getWalletBalance(client, buyerId);
                if (balance < item.price_coins) throw new Error(`IACoins insuficientes. Necesitas: ${item.price_coins}`);

                await MarketplaceDAO.deductBuyerBalance(client, buyerId, item.price_coins);
                await MarketplaceDAO.createBuyerTransaction(client, buyerId, item.price_coins, `Compra: ${item.title}`);

                const commission = Math.floor(item.price_coins * this.platformCommission);
                const sellerEarnings = item.price_coins - commission;

                await MarketplaceDAO.creditSellerBalance(client, item.seller_id, sellerEarnings);
                await MarketplaceDAO.createSellerTransaction(client, item.seller_id, sellerEarnings, `Venta: ${item.title}`);
                await MarketplaceDAO.updateCreatorEarnings(client, item.seller_id, sellerEarnings);
                await MarketplaceDAO.createCreatorTransaction(client, item.seller_id, item.price_coins, commission, sellerEarnings, `Venta de: ${item.title}`);
            }

            const purchase = await MarketplaceDAO.createPurchase(client, buyerId, itemId, item.seller_id, item.price_coins);
            await MarketplaceDAO.incrementPurchaseCount(client, itemId);

            await client.query('COMMIT');
            return purchase;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async getUserPurchases(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        return MarketplaceDAO.getUserPurchases(userId, limit, (page - 1) * limit);
    }

    async hasAccess(userId, itemId) {
        return MarketplaceDAO.hasAccess(userId, itemId);
    }

    // ========================================
    // REVIEWS
    // ========================================

    async createReview(reviewerId, itemId, rating, title, content) {
        const isVerified = await MarketplaceDAO.checkPurchase(reviewerId, itemId);
        return MarketplaceDAO.createReview(itemId, reviewerId, rating, title, content, isVerified);
    }

    async getItemReviews(itemId, options = {}) {
        const { page = 1, limit = 20 } = options;
        return MarketplaceDAO.getItemReviews(itemId, limit, (page - 1) * limit);
    }

    // ========================================
    // FAVORITOS
    // ========================================

    async addToFavorites(userId, itemId) {
        return MarketplaceDAO.addToFavorites(userId, itemId);
    }

    async removeFromFavorites(userId, itemId) {
        return MarketplaceDAO.removeFromFavorites(userId, itemId);
    }

    async getUserFavorites(userId, options = {}) {
        const { page = 1, limit = 20 } = options;
        return MarketplaceDAO.getUserFavorites(userId, limit, (page - 1) * limit);
    }

    // ========================================
    // VENDEDOR/CREADOR
    // ========================================

    async getSellerItems(sellerId, options = {}) {
        const { status, page = 1, limit = 20 } = options;
        return MarketplaceDAO.getSellerItems(sellerId, status, limit, (page - 1) * limit);
    }

    async getCreatorEarnings(creatorId) {
        const earnings = await MarketplaceDAO.getCreatorEarnings(creatorId);
        return earnings || { total_sales: 0, total_earnings: 0, available_balance: 0, items_sold: 0 };
    }

    async getCreatorTransactions(creatorId, options = {}) {
        const { page = 1, limit = 20 } = options;
        return MarketplaceDAO.getCreatorTransactions(creatorId, limit, (page - 1) * limit);
    }

    async getSellerStats(sellerId) {
        return MarketplaceDAO.getSellerStats(sellerId);
    }

    // ========================================
    // CATEGORÍAS Y PROMOCIONES
    // ========================================

    async getCategories(parentId = null) {
        return MarketplaceDAO.getCategories(parentId);
    }

    async applyPromoCode(code, itemId, userId) {
        const promo = await MarketplaceDAO.getPromoCode(code);
        if (!promo) throw new Error('Código promocional inválido o expirado');
        return promo;
    }

    async reportItem(itemId, reporterId, reason, description) {
        return MarketplaceDAO.reportItem(itemId, reporterId, reason, description);
    }
}

module.exports = new MarketplaceService();
