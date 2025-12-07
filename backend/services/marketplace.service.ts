/**
 * 🛒 MARKETPLACE SERVICE - TypeScript Version
 * Marketplace de recursos educativos
 * Refactorizado: 07 Diciembre 2025
 */

const MarketplaceDAO = require('../data/marketplace.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

export type ItemType = 'notes' | 'guide' | 'template' | 'quiz_pack' | 'tutorial' | 'course';
export type ItemStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export interface MarketplaceItem {
    id: number;
    sellerId: number;
    title: string;
    description: string;
    type: ItemType;
    price: number;
    currency: string;
    status: ItemStatus;
    downloadCount: number;
    rating: number;
    reviewCount: number;
    createdAt: Date;
}

export interface ItemData {
    title: string;
    description: string;
    type: ItemType;
    price: number;
    category?: string;
    tags?: string[];
    previewUrl?: string;
    fileUrl?: string;
}

export interface ItemOptions {
    type?: ItemType;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    limit?: number;
    offset?: number;
}

export interface Purchase {
    id: number;
    buyerId: number;
    itemId: number;
    price: number;
    purchasedAt: Date;
}

// ============================================
// MARKETPLACE SERVICE CLASS
// ============================================

class MarketplaceService {
    private platformCommission: number;
    private itemTypes: ItemType[];

    constructor() {
        this.platformCommission = 0.10; // 10%
        this.itemTypes = ['notes', 'guide', 'template', 'quiz_pack', 'tutorial', 'course'];
        devLogger.log('[MARKETPLACE] Service initialized');
    }

    // Item CRUD
    async createItem(sellerId: number, itemData: ItemData): Promise<MarketplaceItem> {
        if (!this.itemTypes.includes(itemData.type)) {
            throw new Error('Tipo de item no válido');
        }
        return await MarketplaceDAO.createItem(sellerId, itemData);
    }

    async getItems(options: ItemOptions = {}): Promise<{ items: MarketplaceItem[]; total: number }> {
        const items = await MarketplaceDAO.getItems({
            ...options,
            status: 'approved'
        });
        const total = await MarketplaceDAO.countItems(options);
        return { items, total };
    }

    async getItemById(itemId: number, userId: number | null = null): Promise<MarketplaceItem | null> {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item) return null;

        if (userId) {
            item.hasAccess = await this.hasAccess(userId, itemId);
            item.isFavorite = await MarketplaceDAO.isFavorite(userId, itemId);
        }

        return item;
    }

    async updateItem(itemId: number, sellerId: number, updateData: Partial<ItemData>): Promise<MarketplaceItem | null> {
        const item = await MarketplaceDAO.getItemById(itemId);
        if (!item || item.sellerId !== sellerId) {
            return null;
        }
        return await MarketplaceDAO.updateItem(itemId, updateData);
    }

    async submitForReview(itemId: number, sellerId: number): Promise<void> {
        await MarketplaceDAO.updateItemStatus(itemId, sellerId, 'pending_review');
    }

    async reviewItem(itemId: number, reviewerId: number, approved: boolean, rejectionReason: string | null = null): Promise<void> {
        const status = approved ? 'approved' : 'rejected';
        await MarketplaceDAO.reviewItem(itemId, reviewerId, status, rejectionReason);
    }

    // Purchase
    async purchaseItem(buyerId: number, itemId: number): Promise<Purchase> {
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

    async getUserPurchases(userId: number, options: { limit?: number; offset?: number } = {}): Promise<Purchase[]> {
        return await MarketplaceDAO.getUserPurchases(userId, options);
    }

    async hasAccess(userId: number, itemId: number): Promise<boolean> {
        return await MarketplaceDAO.hasAccess(userId, itemId);
    }

    // Reviews
    async createReview(reviewerId: number, itemId: number, rating: number, title: string, content: string): Promise<any> {
        return await MarketplaceDAO.createReview(reviewerId, itemId, rating, title, content);
    }

    async getItemReviews(itemId: number, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
        return await MarketplaceDAO.getItemReviews(itemId, options);
    }

    // Favorites
    async addToFavorites(userId: number, itemId: number): Promise<void> {
        await MarketplaceDAO.addToFavorites(userId, itemId);
    }

    async removeFromFavorites(userId: number, itemId: number): Promise<void> {
        await MarketplaceDAO.removeFromFavorites(userId, itemId);
    }

    async getUserFavorites(userId: number, options: { limit?: number; offset?: number } = {}): Promise<MarketplaceItem[]> {
        return await MarketplaceDAO.getUserFavorites(userId, options);
    }

    // Seller
    async getSellerItems(sellerId: number, options: { status?: ItemStatus; limit?: number } = {}): Promise<MarketplaceItem[]> {
        return await MarketplaceDAO.getSellerItems(sellerId, options);
    }

    async getCreatorEarnings(creatorId: number): Promise<{ total: number; thisMonth: number; pending: number }> {
        return await MarketplaceDAO.getCreatorEarnings(creatorId);
    }

    async getCreatorTransactions(creatorId: number, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
        return await MarketplaceDAO.getCreatorTransactions(creatorId, options);
    }

    async getSellerStats(sellerId: number): Promise<any> {
        return await MarketplaceDAO.getSellerStats(sellerId);
    }

    // Categories
    async getCategories(parentId: number | null = null): Promise<any[]> {
        return await MarketplaceDAO.getCategories(parentId);
    }

    // Promo & Reports
    async applyPromoCode(code: string, itemId: number, userId: number): Promise<{ discountPercent: number; finalPrice: number }> {
        const promo = await MarketplaceDAO.getPromoCode(code);
        if (!promo || !promo.isValid) {
            throw new Error('Código promocional inválido');
        }

        const item = await MarketplaceDAO.getItemById(itemId);
        const finalPrice = Math.round(item.price * (1 - promo.discountPercent / 100));

        return { discountPercent: promo.discountPercent, finalPrice };
    }

    async reportItem(itemId: number, reporterId: number, reason: string, description: string): Promise<void> {
        await MarketplaceDAO.createReport(itemId, reporterId, reason, description);
    }
}

// ============================================
// EXPORTS
// ============================================

const marketplaceService = new MarketplaceService();

export { MarketplaceService };
export default marketplaceService;

module.exports = marketplaceService;
module.exports.MarketplaceService = MarketplaceService;
