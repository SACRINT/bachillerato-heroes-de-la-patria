/**
 * 🛒 MARKETPLACE SERVICE - TypeScript Version
 * Marketplace de recursos educativos
 * Refactorizado: 07 Diciembre 2025
 */
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
declare class MarketplaceService {
    private platformCommission;
    private itemTypes;
    constructor();
    createItem(sellerId: number, itemData: ItemData): Promise<MarketplaceItem>;
    getItems(options?: ItemOptions): Promise<{
        items: MarketplaceItem[];
        total: number;
    }>;
    getItemById(itemId: number, userId?: number | null): Promise<MarketplaceItem | null>;
    updateItem(itemId: number, sellerId: number, updateData: Partial<ItemData>): Promise<MarketplaceItem | null>;
    submitForReview(itemId: number, sellerId: number): Promise<void>;
    reviewItem(itemId: number, reviewerId: number, approved: boolean, rejectionReason?: string | null): Promise<void>;
    purchaseItem(buyerId: number, itemId: number): Promise<Purchase>;
    getUserPurchases(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Purchase[]>;
    hasAccess(userId: number, itemId: number): Promise<boolean>;
    createReview(reviewerId: number, itemId: number, rating: number, title: string, content: string): Promise<any>;
    getItemReviews(itemId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    addToFavorites(userId: number, itemId: number): Promise<void>;
    removeFromFavorites(userId: number, itemId: number): Promise<void>;
    getUserFavorites(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<MarketplaceItem[]>;
    getSellerItems(sellerId: number, options?: {
        status?: ItemStatus;
        limit?: number;
    }): Promise<MarketplaceItem[]>;
    getCreatorEarnings(creatorId: number): Promise<{
        total: number;
        thisMonth: number;
        pending: number;
    }>;
    getCreatorTransactions(creatorId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    getSellerStats(sellerId: number): Promise<any>;
    getCategories(parentId?: number | null): Promise<any[]>;
    applyPromoCode(code: string, itemId: number, userId: number): Promise<{
        discountPercent: number;
        finalPrice: number;
    }>;
    reportItem(itemId: number, reporterId: number, reason: string, description: string): Promise<void>;
}
declare const marketplaceService: MarketplaceService;
export { MarketplaceService };
export default marketplaceService;
//# sourceMappingURL=marketplace.service.d.ts.map