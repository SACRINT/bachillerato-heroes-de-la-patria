"use strict";
/**
 * 🛒 MARKETPLACE SERVICE - TypeScript Version
 * Marketplace de recursos educativos
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceService = void 0;
const MarketplaceDAO = require('../data/marketplace.dao');
const devLogger = require('../utils/devLogger');
// ============================================
// MARKETPLACE SERVICE CLASS
// ============================================
class MarketplaceService {
    constructor() {
        this.platformCommission = 0.10; // 10%
        this.itemTypes = ['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course'];
        devLogger.log('[MARKETPLACE] Service initialized');
    }
    // Item CRUD
    async createItem(sellerId, itemData) {
        if (!this.itemTypes.includes(itemData.type)) {
            throw new Error('Tipo de item no válido');
        }
        return await MarketplaceDAO.createItem(sellerId, itemData);
    }
    async getItems(options = {}) {
        const items = await MarketplaceDAO.getItems({
            ...options,
            status: 'approved'
        });
        const total = await MarketplaceDAO.countItems(options);
        return { items, total };
    }
    async getItemById(itemId, userId = null) {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item)
            return null;
        if (userId) {
            item.hasAccess = await this.hasAccess(userId, itemId);
            item.isFavorite = await MarketplaceDAO.isFavorite(userId, itemId);
        }
        return item;
    }
    async updateItem(itemId, sellerId, updateData) {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item || item.sellerId !== sellerId) {
            return null;
        }
        return await MarketplaceDAO.updateItem(itemId, updateData);
    }
    async submitForReview(itemId, sellerId) {
        await MarketplaceDAO.updateItemStatus(itemId, sellerId, 'pending_review');
    }
    async reviewItem(itemId, reviewerId, approved, rejectionReason = null) {
        const status = approved ? 'approved' : 'rejected';
        await MarketplaceDAO.reviewItem(itemId, reviewerId, status, rejectionReason);
    }
    // Purchase
    async purchaseItem(buyerId, itemId) {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item || item.status !== 'approved') {
            throw new Error('Item no disponible');
        }
        if (item.sellerId === buyerId) {
            throw new Error('No puedes comprar tu propio item');
        }
        const existingPurchase = await MarketplaceDAO.getUserPurchase(buyerId, itemId);
        if (existingPurchase) {
            throw new Error('Ya tienes este item');
        }
        // Check buyer balance
        const buyerProfile = await MarketplaceDAO.getUserProfile(buyerId);
        if (buyerProfile.coins < item.price) {
            throw new Error('Saldo insuficiente');
        }
        // Process transaction
        const sellerAmount = Math.round(item.price * (1 - this.platformCommission));
        await MarketplaceDAO.deductCoins(buyerId, item.price);
        await MarketplaceDAO.addCoins(item.sellerId, sellerAmount);
        const purchase = await MarketplaceDAO.createPurchase(buyerId, itemId, item.price);
        await MarketplaceDAO.incrementDownloadCount(itemId);
        devLogger.log(`[MARKETPLACE] User ${buyerId} purchased item ${itemId}`);
        return purchase;
    }
    async getUserPurchases(userId, options = {}) {
        return await MarketplaceDAO.getUserPurchases(userId, options);
    }
    async hasAccess(userId, itemId) {
        return await MarketplaceDAO.hasAccess(userId, itemId);
    }
    // Reviews
    async createReview(reviewerId, itemId, rating, title, content) {
        return await MarketplaceDAO.createReview(reviewerId, itemId, rating, title, content);
    }
    async getItemReviews(itemId, options = {}) {
        return await MarketplaceDAO.getItemReviews(itemId, options);
    }
    // Favorites
    async addToFavorites(userId, itemId) {
        await MarketplaceDAO.addToFavorites(userId, itemId);
    }
    async removeFromFavorites(userId, itemId) {
        await MarketplaceDAO.removeFromFavorites(userId, itemId);
    }
    async getUserFavorites(userId, options = {}) {
        return await MarketplaceDAO.getUserFavorites(userId, options);
    }
    // Seller
    async getSellerItems(sellerId, options = {}) {
        return await MarketplaceDAO.getSellerItems(sellerId, options);
    }
    async getCreatorEarnings(creatorId) {
        return await MarketplaceDAO.getCreatorEarnings(creatorId);
    }
    async getCreatorTransactions(creatorId, options = {}) {
        return await MarketplaceDAO.getCreatorTransactions(creatorId, options);
    }
    async getSellerStats(sellerId) {
        return await MarketplaceDAO.getSellerStats(sellerId);
    }
    // Categories
    async getCategories(parentId = null) {
        return await MarketplaceDAO.getCategories(parentId);
    }
    // Promo & Reports
    async applyPromoCode(code, itemId, userId) {
        const promo = await MarketplaceDAO.getPromoCode(code);
        if (!promo || !promo.isValid) {
            throw new Error('Código promocional inválido');
        }
        const item = await MarketplaceDAO.getItemById(itemId);
        const finalPrice = Math.round(item.price * (1 - promo.discountPercent / 100));
        return { discountPercent: promo.discountPercent, finalPrice };
    }
    async reportItem(itemId, reporterId, reason, description) {
        await MarketplaceDAO.createReport(itemId, reporterId, reason, description);
    }
}
exports.MarketplaceService = MarketplaceService;
// ============================================
// EXPORTS
// ============================================
const marketplaceService = new MarketplaceService();
exports.default = marketplaceService;
module.exports = marketplaceService;
module.exports.MarketplaceService = MarketplaceService;
//# sourceMappingURL=marketplace.service.js.map