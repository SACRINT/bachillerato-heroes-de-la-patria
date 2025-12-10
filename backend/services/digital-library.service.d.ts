/**
 * 📚 DIGITAL LIBRARY SERVICE - TypeScript Version
 * Gestión de biblioteca digital
 * Refactorizado: 07 Diciembre 2025
 */
export type ResourceType = 'book' | 'article' | 'video' | 'audio' | 'document' | 'interactive';
export type ResourceFormat = 'pdf' | 'epub' | 'mp4' | 'mp3' | 'html' | 'docx';
export interface Resource {
    id: number;
    title: string;
    description: string;
    type: ResourceType;
    format: ResourceFormat;
    author?: string;
    categoryId: number;
    fileUrl: string;
    thumbnailUrl?: string;
    duration?: number;
    pages?: number;
    downloadCount: number;
    rating: number;
    isFeatured: boolean;
    createdAt: Date;
}
export interface ResourceProgress {
    userId: number;
    resourceId: number;
    progress: number;
    currentPage?: number;
    currentTime?: number;
    completed: boolean;
    lastAccessedAt: Date;
}
export interface Collection {
    id: number;
    userId: number;
    name: string;
    description?: string;
    isPublic: boolean;
    itemCount: number;
}
export interface ResourceOptions {
    type?: ResourceType;
    categoryId?: number;
    search?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
}
declare class DigitalLibraryService {
    private resourceTypes;
    private formats;
    constructor();
    getResources(options?: ResourceOptions): Promise<{
        resources: Resource[];
        total: number;
    }>;
    getResourceById(resourceId: number, userId?: number | null): Promise<Resource | null>;
    getFeaturedResources(limit?: number, userId?: number | null): Promise<Resource[]>;
    getPopularResources(limit?: number, userId?: number | null): Promise<Resource[]>;
    getRecentResources(limit?: number, userId?: number | null): Promise<Resource[]>;
    searchResources(searchTerm: string, options?: ResourceOptions): Promise<Resource[]>;
    getRelatedResources(resourceId: number, limit?: number): Promise<Resource[]>;
    getCategories(): Promise<any[]>;
    getCategoryBySlug(slug: string): Promise<any>;
    getOrCreateProgress(userId: number, resourceId: number): Promise<ResourceProgress>;
    updateProgress(userId: number, resourceId: number, progressData: Partial<ResourceProgress>): Promise<ResourceProgress>;
    private grantCompletionRewards;
    getUserReadingHistory(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    getUserStats(userId: number): Promise<any>;
    addToFavorites(userId: number, resourceId: number, folderName?: string | null): Promise<void>;
    removeFromFavorites(userId: number, resourceId: number): Promise<void>;
    getUserFavorites(userId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<Resource[]>;
    addReview(userId: number, resourceId: number, rating: number, reviewText?: string | null): Promise<any>;
    getResourceReviews(resourceId: number, options?: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    deleteReview(userId: number, resourceId: number): Promise<void>;
    createCollection(userId: number, name: string, description?: string | null, isPublic?: boolean): Promise<Collection>;
    getUserCollections(userId: number): Promise<Collection[]>;
    addToCollection(collectionId: number, resourceId: number, notes?: string | null): Promise<void>;
    getCollectionItems(collectionId: number): Promise<Resource[]>;
    removeFromCollection(collectionId: number, resourceId: number): Promise<void>;
    recordDownload(userId: number, resourceId: number, downloadType?: string, ipAddress?: string | null): Promise<void>;
    getUserDownloads(userId: number, limit?: number): Promise<any[]>;
    createResource(resourceData: Partial<Resource>, createdBy: number): Promise<Resource>;
    updateResource(resourceId: number, resourceData: Partial<Resource>): Promise<Resource | null>;
    deleteResource(resourceId: number): Promise<boolean>;
}
declare const digitalLibraryService: DigitalLibraryService;
export { DigitalLibraryService };
export default digitalLibraryService;
//# sourceMappingURL=digital-library.service.d.ts.map