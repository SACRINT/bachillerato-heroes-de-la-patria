/**
 * 📚 DIGITAL LIBRARY SERVICE - TypeScript Version
 * Gestión de biblioteca digital
 * Refactorizado: 07 Diciembre 2025
 */

const DigitalLibraryDAO = require('../data/digital-library.dao');
const devLogger = require('../utils/devLogger');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// DIGITAL LIBRARY SERVICE CLASS
// ============================================

class DigitalLibraryService {
    private resourceTypes: ResourceType[];
    private formats: ResourceFormat[];

    constructor() {
        this.resourceTypes = ['book', 'article', 'video', 'audio', 'document', 'interactive'];
        this.formats = ['pdf', 'epub', 'mp4', 'mp3', 'html', 'docx'];
        devLogger.log('[DIGITAL-LIBRARY] Service initialized');
    }

    // Resources
    async getResources(options: ResourceOptions = {}): Promise<{ resources: Resource[]; total: number }> {
        const resources = await DigitalLibraryDAO.getResources(options);
        const total = await DigitalLibraryDAO.countResources(options);
        return { resources, total };
    }

    async getResourceById(resourceId: number, userId: number | null = null): Promise<Resource | null> {
        const resource = await DigitalLibraryDAO.getResourceById(resourceId);
        if (resource && userId) {
            resource.userProgress = await this.getOrCreateProgress(userId, resourceId);
            resource.isFavorite = await DigitalLibraryDAO.isFavorite(userId, resourceId);
        }
        return resource;
    }

    async getFeaturedResources(limit: number = 10, userId: number | null = null): Promise<Resource[]> {
        return await DigitalLibraryDAO.getFeaturedResources(limit, userId);
    }

    async getPopularResources(limit: number = 10, userId: number | null = null): Promise<Resource[]> {
        return await DigitalLibraryDAO.getPopularResources(limit, userId);
    }

    async getRecentResources(limit: number = 10, userId: number | null = null): Promise<Resource[]> {
        return await DigitalLibraryDAO.getRecentResources(limit, userId);
    }

    async searchResources(searchTerm: string, options: ResourceOptions = {}): Promise<Resource[]> {
        return await DigitalLibraryDAO.searchResources(searchTerm, options);
    }

    async getRelatedResources(resourceId: number, limit: number = 5): Promise<Resource[]> {
        return await DigitalLibraryDAO.getRelatedResources(resourceId, limit);
    }

    // Categories
    async getCategories(): Promise<any[]> {
        return await DigitalLibraryDAO.getCategories();
    }

    async getCategoryBySlug(slug: string): Promise<any> {
        return await DigitalLibraryDAO.getCategoryBySlug(slug);
    }

    // Progress
    async getOrCreateProgress(userId: number, resourceId: number): Promise<ResourceProgress> {
        let progress = await DigitalLibraryDAO.getProgress(userId, resourceId);
        if (!progress) {
            progress = await DigitalLibraryDAO.createProgress(userId, resourceId);
        }
        return progress;
    }

    async updateProgress(userId: number, resourceId: number, progressData: Partial<ResourceProgress>): Promise<ResourceProgress> {
        const current = await this.getOrCreateProgress(userId, resourceId);
        const newProgress = { ...current, ...progressData, lastAccessedAt: new Date() };

        // Check completion
        if (newProgress.progress >= 100 && !current.completed) {
            newProgress.completed = true;
            await this.grantCompletionRewards(userId, resourceId);
        }

        return await DigitalLibraryDAO.updateProgress(userId, resourceId, newProgress);
    }

    private async grantCompletionRewards(userId: number, resourceId: number): Promise<void> {
        const resource = await DigitalLibraryDAO.getResourceById(resourceId);
        const xpReward = resource?.type === 'book' ? 50 : 25;
        await DigitalLibraryDAO.grantXP(userId, xpReward, 'resource_completed');
    }

    async getUserReadingHistory(userId: number, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
        return await DigitalLibraryDAO.getUserReadingHistory(userId, options);
    }

    async getUserStats(userId: number): Promise<any> {
        return await DigitalLibraryDAO.getUserStats(userId);
    }

    // Favorites
    async addToFavorites(userId: number, resourceId: number, folderName: string | null = null): Promise<void> {
        await DigitalLibraryDAO.addToFavorites(userId, resourceId, folderName);
    }

    async removeFromFavorites(userId: number, resourceId: number): Promise<void> {
        await DigitalLibraryDAO.removeFromFavorites(userId, resourceId);
    }

    async getUserFavorites(userId: number, options: { limit?: number; offset?: number } = {}): Promise<Resource[]> {
        return await DigitalLibraryDAO.getUserFavorites(userId, options);
    }

    // Reviews
    async addReview(userId: number, resourceId: number, rating: number, reviewText: string | null = null): Promise<any> {
        return await DigitalLibraryDAO.addReview(userId, resourceId, rating, reviewText);
    }

    async getResourceReviews(resourceId: number, options: { limit?: number; offset?: number } = {}): Promise<any[]> {
        return await DigitalLibraryDAO.getResourceReviews(resourceId, options);
    }

    async deleteReview(userId: number, resourceId: number): Promise<void> {
        await DigitalLibraryDAO.deleteReview(userId, resourceId);
    }

    // Collections
    async createCollection(userId: number, name: string, description: string | null = null, isPublic: boolean = false): Promise<Collection> {
        return await DigitalLibraryDAO.createCollection(userId, name, description, isPublic);
    }

    async getUserCollections(userId: number): Promise<Collection[]> {
        return await DigitalLibraryDAO.getUserCollections(userId);
    }

    async addToCollection(collectionId: number, resourceId: number, notes: string | null = null): Promise<void> {
        await DigitalLibraryDAO.addToCollection(collectionId, resourceId, notes);
    }

    async getCollectionItems(collectionId: number): Promise<Resource[]> {
        return await DigitalLibraryDAO.getCollectionItems(collectionId);
    }

    async removeFromCollection(collectionId: number, resourceId: number): Promise<void> {
        await DigitalLibraryDAO.removeFromCollection(collectionId, resourceId);
    }

    // Downloads
    async recordDownload(userId: number, resourceId: number, downloadType: string = 'full', ipAddress: string | null = null): Promise<void> {
        await DigitalLibraryDAO.recordDownload(userId, resourceId, downloadType, ipAddress);
        await DigitalLibraryDAO.incrementDownloadCount(resourceId);
    }

    async getUserDownloads(userId: number, limit: number = 50): Promise<any[]> {
        return await DigitalLibraryDAO.getUserDownloads(userId, limit);
    }

    // Admin
    async createResource(resourceData: Partial<Resource>, createdBy: number): Promise<Resource> {
        return await DigitalLibraryDAO.createResource(resourceData, createdBy);
    }

    async updateResource(resourceId: number, resourceData: Partial<Resource>): Promise<Resource | null> {
        return await DigitalLibraryDAO.updateResource(resourceId, resourceData);
    }

    async deleteResource(resourceId: number): Promise<boolean> {
        return await DigitalLibraryDAO.deleteResource(resourceId);
    }
}

// ============================================
// EXPORTS
// ============================================

const digitalLibraryService = new DigitalLibraryService();

export { DigitalLibraryService };
export default digitalLibraryService;

module.exports = digitalLibraryService;
module.exports.DigitalLibraryService = DigitalLibraryService;
