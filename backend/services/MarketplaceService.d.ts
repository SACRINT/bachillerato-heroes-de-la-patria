declare const _exports: MarketplaceService;
export = _exports;
declare class MarketplaceService {
    platformCommission: number;
    itemTypes: string[];
    itemStatuses: string[];
    createItem(sellerId: any, itemData: any): Promise<any>;
    getItems(options?: {}): Promise<any>;
    getItemById(itemId: any, userId?: any): Promise<any>;
    updateItem(itemId: any, sellerId: any, updateData: any): Promise<any>;
    submitForReview(itemId: any, sellerId: any): Promise<any>;
    reviewItem(itemId: any, reviewerId: any, approved: any, rejectionReason?: any): Promise<any>;
    purchaseItem(buyerId: any, itemId: any): Promise<any>;
    getUserPurchases(userId: any, options?: {}): Promise<any>;
    hasAccess(userId: any, itemId: any): Promise<any>;
    createReview(reviewerId: any, itemId: any, rating: any, title: any, content: any): Promise<any>;
    getItemReviews(itemId: any, options?: {}): Promise<any>;
    addToFavorites(userId: any, itemId: any): Promise<any>;
    removeFromFavorites(userId: any, itemId: any): Promise<any>;
    getUserFavorites(userId: any, options?: {}): Promise<any>;
    getSellerItems(sellerId: any, options?: {}): Promise<any>;
    getCreatorEarnings(creatorId: any): Promise<any>;
    getCreatorTransactions(creatorId: any, options?: {}): Promise<any>;
    getSellerStats(sellerId: any): Promise<any>;
    getCategories(parentId?: any): Promise<any>;
    applyPromoCode(code: any, itemId: any, userId: any): Promise<any>;
    reportItem(itemId: any, reporterId: any, reason: any, description: any): Promise<any>;
}
//# sourceMappingURL=MarketplaceService.d.ts.map