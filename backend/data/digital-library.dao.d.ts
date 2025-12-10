/**
 * 📚 DIGITAL LIBRARY DAO - TypeScript
 * Data Access Object para biblioteca digital
 * Abstrae todas las queries SQL de DigitalLibraryService
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface Resource {
    id: number;
    title: string;
    slug: string;
    description: string;
    summary?: string;
    category_id: number;
    subject?: string;
    grade_level?: string;
    resource_type: string;
    format: string;
    file_url?: string;
    thumbnail_url?: string;
    preview_url?: string;
    file_size?: string;
    duration?: string;
    page_count?: number;
    author?: string;
    publisher?: string;
    publication_date?: Date;
    isbn?: string;
    language: string;
    external_url?: string;
    embed_code?: string;
    xp_reward: number;
    coins_reward: number;
    tags?: any;
    is_featured: boolean;
    is_premium: boolean;
    required_level: number;
    created_by: number;
    view_count: number;
    download_count: number;
    like_count: number;
    avg_rating?: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface ResourceDetail extends Resource {
    category_name?: string;
    category_slug?: string;
    category_icon?: string;
    progress_percent?: number;
    current_page?: number;
    current_position?: number;
    is_completed?: boolean;
    user_notes?: string;
    bookmarks?: any;
    highlights?: any;
    is_favorite?: boolean;
    user_rating?: number;
    user_review?: string;
}
export interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
    resource_count?: number;
}
export interface UserProgress {
    id: number;
    user_id: number;
    resource_id: number;
    progress_percent: number;
    current_page?: number;
    current_position?: number;
    is_completed: boolean;
    completed_at?: Date;
    last_accessed_at: Date;
    notes?: string;
    bookmarks?: any;
    highlights?: any;
    xp_earned: number;
    coins_earned: number;
    title?: string;
    slug?: string;
    thumbnail_url?: string;
    resource_type?: string;
    author?: string;
    category_name?: string;
}
export interface UserStats {
    total_resources: number;
    completed: number;
    total_time: number;
    total_xp: number;
    total_coins: number;
    avg_progress: number;
}
export interface Favorite {
    user_id: number;
    resource_id: number;
    folder_name: string;
    created_at: Date;
    title?: string;
    slug?: string;
    thumbnail_url?: string;
    resource_type?: string;
    author?: string;
    avg_rating?: number;
    category_name?: string;
}
export interface Review {
    id: number;
    user_id: number;
    resource_id: number;
    rating: number;
    review_text: string;
    is_approved: boolean;
    created_at: Date;
    updated_at: Date;
    nombre?: string;
    apellido_paterno?: string;
}
export interface Collection {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    is_public: boolean;
    created_at: Date;
}
export interface CollectionItem {
    collection_id: number;
    resource_id: number;
    notes?: string;
    sort_order: number;
    added_at: Date;
    title?: string;
    slug?: string;
    thumbnail_url?: string;
    resource_type?: string;
    author?: string;
}
export interface Download {
    id: number;
    user_id: number;
    resource_id: number;
    download_type: string;
    ip_address: string;
    user_agent: string;
    created_at: Date;
    title?: string;
    slug?: string;
    file_url?: string;
}
export interface CreateResourceInput {
    title: string;
    slug: string;
    description: string;
    summary?: string;
    categoryId: number;
    subject?: string;
    gradeLevel?: string;
    resourceType: string;
    format: string;
    fileUrl?: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    fileSize?: string;
    duration?: string;
    pageCount?: number;
    author?: string;
    publisher?: string;
    publicationDate?: Date;
    isbn?: string;
    language?: string;
    externalUrl?: string;
    embedCode?: string;
    xpReward?: number;
    coinsReward?: number;
    tags?: string[];
    isFeatured?: boolean;
    isPremium?: boolean;
    requiredLevel?: number;
    createdBy: number;
}
declare class DigitalLibraryDAO {
    static getResources(query: string, params: any[]): Promise<Resource[]>;
    static getResourceById(resourceId: number | string, userId?: number): Promise<ResourceDetail | null>;
    static getRelatedResources(resourceId: number | string, limit: number): Promise<any[]>;
    static incrementViewCount(resourceId: number | string): Promise<void>;
    static getCategories(): Promise<Category[]>;
    static getCategoryBySlug(slug: string): Promise<Category | null>;
    static getProgress(userId: number, resourceId: number | string): Promise<UserProgress | null>;
    static createProgress(userId: number, resourceId: number | string): Promise<UserProgress>;
    static updateProgress(query: string, params: any[]): Promise<UserProgress>;
    static getResourceRewards(resourceId: number | string): Promise<{
        xp_reward: number;
        coins_reward: number;
    } | null>;
    static updateProgressRewards(userId: number, resourceId: number | string, xp: number, coins: number): Promise<void>;
    static getUserReadingHistory(userId: number, completedOnly: boolean, limit: number, offset: number): Promise<UserProgress[]>;
    static getUserStats(userId: number): Promise<UserStats>;
    static addToFavorites(userId: number, resourceId: number | string, folderName: string): Promise<Favorite>;
    static incrementLikeCount(resourceId: number | string): Promise<void>;
    static removeFromFavorites(userId: number, resourceId: number | string): Promise<void>;
    static decrementLikeCount(resourceId: number | string): Promise<void>;
    static getUserFavorites(userId: number, folderName: string, limit: number, offset: number): Promise<Favorite[]>;
    static addReview(userId: number, resourceId: number | string, rating: number, reviewText: string): Promise<Review>;
    static getResourceReviews(resourceId: number | string, limit: number, offset: number): Promise<Review[]>;
    static deleteReview(userId: number, resourceId: number | string): Promise<void>;
    static createCollection(userId: number, name: string, description: string, isPublic: boolean): Promise<Collection>;
    static getUserCollections(userId: number): Promise<Collection[]>;
    static addToCollection(collectionId: number | string, resourceId: number | string, notes: string): Promise<CollectionItem>;
    static getCollectionItems(collectionId: number | string): Promise<CollectionItem[]>;
    static removeFromCollection(collectionId: number | string, resourceId: number | string): Promise<void>;
    static recordDownload(userId: number, resourceId: number | string, downloadType: string, ipAddress: string, userAgent: string): Promise<Download>;
    static incrementDownloadCount(resourceId: number | string): Promise<void>;
    static getUserDownloads(userId: number, limit: number): Promise<Download[]>;
    static createResource(data: CreateResourceInput): Promise<Resource>;
    static updateResource(resourceId: number | string, fields: string[], params: any[]): Promise<Resource>;
    static deleteResource(resourceId: number | string): Promise<Resource>;
}
export default DigitalLibraryDAO;
//# sourceMappingURL=digital-library.dao.d.ts.map