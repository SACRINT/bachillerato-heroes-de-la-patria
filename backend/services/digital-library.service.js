"use strict";
/**
 * 📚 DIGITAL LIBRARY SERVICE - TypeScript Version
 * Gestión de biblioteca digital
 * Refactorizado: 07 Diciembre 2025
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalLibraryService = void 0;
const DigitalLibraryDAO = require('../data/digital-library.dao.js');
const devLogger = require('../utils/devLogger.js');
// ============================================
// DIGITAL LIBRARY SERVICE CLASS
// ============================================
class DigitalLibraryService {
    constructor() {
        this.resourceTypes = ['book', 'article', 'video', 'audio', 'document', 'interactive'];
        this.formats = ['pdf', 'epub', 'mp4', 'mp3', 'html', 'docx'];
        devLogger.log('[DIGITAL-LIBRARY] Service initialized');
    }
    // Resources
    async getResources(options = {}) {
        const resources = await DigitalLibraryDAO.getResources(options);
        const total = await DigitalLibraryDAO.countResources(options);
        return { resources, total };
    }
    async getResourceById(resourceId, userId = null) {
        const resource = await DigitalLibraryDAO.getResourceById(resourceId);
        if (resource && userId) {
            resource.userProgress = await this.getOrCreateProgress(userId, resourceId);
            resource.isFavorite = await DigitalLibraryDAO.isFavorite(userId, resourceId);
        }
        return resource;
    }
    async getFeaturedResources(limit = 10, userId = null) {
        return await DigitalLibraryDAO.getFeaturedResources(limit, userId);
    }
    async getPopularResources(limit = 10, userId = null) {
        return await DigitalLibraryDAO.getPopularResources(limit, userId);
    }
    async getRecentResources(limit = 10, userId = null) {
        return await DigitalLibraryDAO.getRecentResources(limit, userId);
    }
    async searchResources(searchTerm, options = {}) {
        return await DigitalLibraryDAO.searchResources(searchTerm, options);
    }
    async getRelatedResources(resourceId, limit = 5) {
        return await DigitalLibraryDAO.getRelatedResources(resourceId, limit);
    }
    // Categories
    async getCategories() {
        return await DigitalLibraryDAO.getCategories();
    }
    async getCategoryBySlug(slug) {
        return await DigitalLibraryDAO.getCategoryBySlug(slug);
    }
    // Progress
    async getOrCreateProgress(userId, resourceId) {
        let progress = await DigitalLibraryDAO.getProgress(userId, resourceId);
        if (!progress) {
            progress = await DigitalLibraryDAO.createProgress(userId, resourceId);
        }
        return progress;
    }
    async updateProgress(userId, resourceId, progressData) {
        const current = await this.getOrCreateProgress(userId, resourceId);
        const newProgress = { ...current, ...progressData, lastAccessedAt: new Date() };
        // Check completion
        if (newProgress.progress >= 100 && !current.completed) {
            newProgress.completed = true;
            await this.grantCompletionRewards(userId, resourceId);
        }
        return await DigitalLibraryDAO.updateProgress(userId, resourceId, newProgress);
    }
    async grantCompletionRewards(userId, resourceId) {
        const resource = await DigitalLibraryDAO.getResourceById(resourceId);
        const xpReward = resource?.type === 'book' ? 50 : 25;
        await DigitalLibraryDAO.grantXP(userId, xpReward, 'resource_completed');
    }
    async getUserReadingHistory(userId, options = {}) {
        return await DigitalLibraryDAO.getUserReadingHistory(userId, options);
    }
    async getUserStats(userId) {
        return await DigitalLibraryDAO.getUserStats(userId);
    }
    // Favorites
    async addToFavorites(userId, resourceId, folderName = null) {
        await DigitalLibraryDAO.addToFavorites(userId, resourceId, folderName);
    }
    async removeFromFavorites(userId, resourceId) {
        await DigitalLibraryDAO.removeFromFavorites(userId, resourceId);
    }
    async getUserFavorites(userId, options = {}) {
        return await DigitalLibraryDAO.getUserFavorites(userId, options);
    }
    // Reviews
    async addReview(userId, resourceId, rating, reviewText = null) {
        return await DigitalLibraryDAO.addReview(userId, resourceId, rating, reviewText);
    }
    async getResourceReviews(resourceId, options = {}) {
        return await DigitalLibraryDAO.getResourceReviews(resourceId, options);
    }
    async deleteReview(userId, resourceId) {
        await DigitalLibraryDAO.deleteReview(userId, resourceId);
    }
    // Collections
    async createCollection(userId, name, description = null, isPublic = false) {
        return await DigitalLibraryDAO.createCollection(userId, name, description, isPublic);
    }
    async getUserCollections(userId) {
        return await DigitalLibraryDAO.getUserCollections(userId);
    }
    async addToCollection(collectionId, resourceId, notes = null) {
        await DigitalLibraryDAO.addToCollection(collectionId, resourceId, notes);
    }
    async getCollectionItems(collectionId) {
        return await DigitalLibraryDAO.getCollectionItems(collectionId);
    }
    async removeFromCollection(collectionId, resourceId) {
        await DigitalLibraryDAO.removeFromCollection(collectionId, resourceId);
    }
    // Downloads
    async recordDownload(userId, resourceId, downloadType = 'full', ipAddress = null) {
        await DigitalLibraryDAO.recordDownload(userId, resourceId, downloadType, ipAddress);
        await DigitalLibraryDAO.incrementDownloadCount(resourceId);
    }
    async getUserDownloads(userId, limit = 50) {
        return await DigitalLibraryDAO.getUserDownloads(userId, limit);
    }
    // Admin
    async createResource(resourceData, createdBy) {
        return await DigitalLibraryDAO.createResource(resourceData, createdBy);
    }
    async updateResource(resourceId, resourceData) {
        return await DigitalLibraryDAO.updateResource(resourceId, resourceData);
    }
    async deleteResource(resourceId) {
        return await DigitalLibraryDAO.deleteResource(resourceId);
    }
}
exports.DigitalLibraryService = DigitalLibraryService;
// ============================================
// EXPORTS
// ============================================
const digitalLibraryService = new DigitalLibraryService();
exports.default = digitalLibraryService;
module.exports = digitalLibraryService;
module.exports.DigitalLibraryService = DigitalLibraryService;
//# sourceMappingURL=digital-library.service.js.map