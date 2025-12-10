declare const _exports: DigitalLibraryService;
export = _exports;
declare class DigitalLibraryService {
    resourceTypes: string[];
    formats: string[];
    getResources(options?: {}): Promise<any>;
    getResourceById(resourceId: any, userId?: any): Promise<any>;
    getFeaturedResources(limit?: number, userId?: any): Promise<any>;
    getPopularResources(limit?: number, userId?: any): Promise<any>;
    getRecentResources(limit?: number, userId?: any): Promise<any>;
    searchResources(searchTerm: any, options?: {}): Promise<any>;
    getRelatedResources(resourceId: any, limit?: number): Promise<any>;
    getCategories(): Promise<any>;
    getCategoryBySlug(slug: any): Promise<any>;
    getOrCreateProgress(userId: any, resourceId: any): Promise<any>;
    updateProgress(userId: any, resourceId: any, progressData: any): Promise<any>;
    grantCompletionRewards(userId: any, resourceId: any): Promise<{
        xp: any;
        coins: any;
    }>;
    getUserReadingHistory(userId: any, options?: {}): Promise<any>;
    getUserStats(userId: any): Promise<any>;
    addToFavorites(userId: any, resourceId: any, folderName?: any): Promise<any>;
    removeFromFavorites(userId: any, resourceId: any): Promise<boolean>;
    getUserFavorites(userId: any, options?: {}): Promise<any>;
    addReview(userId: any, resourceId: any, rating: any, reviewText?: any): Promise<any>;
    getResourceReviews(resourceId: any, options?: {}): Promise<any>;
    deleteReview(userId: any, resourceId: any): Promise<boolean>;
    createCollection(userId: any, name: any, description?: any, isPublic?: boolean): Promise<any>;
    getUserCollections(userId: any): Promise<any>;
    addToCollection(collectionId: any, resourceId: any, notes?: any): Promise<any>;
    getCollectionItems(collectionId: any): Promise<any>;
    removeFromCollection(collectionId: any, resourceId: any): Promise<boolean>;
    recordDownload(userId: any, resourceId: any, downloadType?: string, ipAddress?: any, userAgent?: any): Promise<any>;
    getUserDownloads(userId: any, limit?: number): Promise<any>;
    createResource(resourceData: any, createdBy: any): Promise<any>;
    updateResource(resourceId: any, resourceData: any): Promise<any>;
    deleteResource(resourceId: any): Promise<any>;
}
//# sourceMappingURL=DigitalLibraryService.d.ts.map