/**
 * 🛒 MARKETPLACE DAO - TypeScript
 * Data Access Object para marketplace de recursos educativos
 * Abstrae todas las queries SQL de MarketplaceService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
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
    topics?: any;
    grade_level?: string;
    tags?: any;
    metadata?: any;
    status: string;
    view_count: number;
    purchase_count: number;
    rating_avg?: number;
    rating_count?: number;
    created_at: Date;
    updated_at: Date;
    published_at?: Date;
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
declare class MarketplaceDAO {
    static createItem(data: CreateItemInput): Promise<MarketplaceItem>;
    static ensureCreatorEarnings(sellerId: number): Promise<void>;
    static getItems(whereClause: string, params: any[], orderClause: string, limit: number, offset: number): Promise<MarketplaceItem[]>;
    static getItemById(itemId: number): Promise<MarketplaceItem | null>;
    static incrementViewCount(itemId: number): Promise<void>;
    static checkPurchase(userId: number, itemId: number): Promise<boolean>;
    static checkFavorite(userId: number, itemId: number): Promise<boolean>;
    static getItemSeller(itemId: number): Promise<number | undefined>;
    static updateItem(itemId: number, data: Partial<CreateItemInput>): Promise<MarketplaceItem>;
    static submitForReview(itemId: number, sellerId: number): Promise<MarketplaceItem>;
    static reviewItem(itemId: number, reviewerId: number, approved: boolean, rejectionReason: string | null): Promise<MarketplaceItem>;
    static getPublishedItem(client: any, itemId: number): Promise<MarketplaceItem>;
    static getExistingPurchase(client: any, buyerId: number, itemId: number): Promise<any>;
    static getWalletBalance(client: any, userId: number): Promise<number>;
    static deductBuyerBalance(client: any, buyerId: number, amount: number): Promise<void>;
    static createBuyerTransaction(client: any, buyerId: number, amount: number, description: string): Promise<number>;
    static creditSellerBalance(client: any, sellerId: number, amount: number): Promise<void>;
    static createSellerTransaction(client: any, sellerId: number, amount: number, description: string): Promise<void>;
    static updateCreatorEarnings(client: any, sellerId: number, amount: number): Promise<void>;
    static createCreatorTransaction(client: any, sellerId: number, grossAmount: number, commission: number, netAmount: number, description: string): Promise<void>;
    static createPurchase(client: any, buyerId: number, itemId: number, sellerId: number, pricePaid: number): Promise<any>;
    static incrementPurchaseCount(client: any, itemId: number): Promise<void>;
    static getUserPurchases(userId: number, limit: number, offset: number): Promise<any[]>;
    static hasAccess(userId: number, itemId: number): Promise<boolean>;
    static createReview(itemId: number, reviewerId: number, rating: number, title: string, content: string, isVerified: boolean): Promise<MarketplaceReview>;
    static getItemReviews(itemId: number, limit: number, offset: number): Promise<MarketplaceReview[]>;
    static addToFavorites(userId: number, itemId: number): Promise<any>;
    static removeFromFavorites(userId: number, itemId: number): Promise<void>;
    static getUserFavorites(userId: number, limit: number, offset: number): Promise<MarketplaceItem[]>;
    static getSellerItems(sellerId: number, status: string | null, limit: number, offset: number): Promise<MarketplaceItem[]>;
    static getCreatorEarnings(creatorId: number): Promise<CreatorEarnings>;
    static getCreatorTransactions(creatorId: number, limit: number, offset: number): Promise<CreatorTransaction[]>;
    static getSellerStats(sellerId: number): Promise<any>;
    static getCategories(parentId: number | null): Promise<MarketplaceCategory[]>;
    static getPromoCode(code: string): Promise<MarketplacePromotion | undefined>;
    static reportItem(itemId: number, reporterId: number, reason: string, description: string): Promise<MarketplaceReport>;
    static getConnection(): Promise<any>;
}
export default MarketplaceDAO;
//# sourceMappingURL=marketplace.dao.d.ts.map