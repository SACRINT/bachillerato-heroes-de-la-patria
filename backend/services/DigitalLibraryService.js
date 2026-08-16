/**
 * 📚 DIGITAL LIBRARY SERVICE
 * Servicio de gestión de biblioteca digital
 * 
 * Refactorizado: 04 Diciembre 2025
 * - Migrado a usar DigitalLibraryDAO
 * - Sin SQL directo en el servicio
 */

const DigitalLibraryDAO = require('../data/digital-library.dao.js');

class DigitalLibraryService {
    constructor() {
        this.resourceTypes = ['book', 'article', 'video', 'audio', 'document', 'interactive'];
        this.formats = ['pdf', 'epub', 'mp4', 'mp3', 'html', 'docx'];
    }

    // =====================================
    // RECURSOS
    // =====================================

    async getResources(options = {}) {
        const { categoryId, subject, resourceType, gradeLevel, search, featured, sortBy = 'created_at', sortOrder = 'DESC', limit = 20, offset = 0, userId } = options;

        let query = `SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon, c.color as category_color`;
        if (userId) query += `, p.progress_percent, p.is_completed, p.last_accessed_at as user_last_access, CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorite`;

        query += ` FROM library_resources r LEFT JOIN library_categories c ON r.category_id = c.id`;
        if (userId) query += ` LEFT JOIN library_user_progress p ON r.id = p.resource_id AND p.user_id = $1 LEFT JOIN library_favorites f ON r.id = f.resource_id AND f.user_id = $1`;

        query += ` WHERE r.is_active = true`;

        const params = userId ? [userId] : [];
        let paramIndex = userId ? 2 : 1;

        if (categoryId) { query += ` AND r.category_id = $${paramIndex++}`; params.push(categoryId); }
        if (subject) { query += ` AND r.subject = $${paramIndex++}`; params.push(subject); }
        if (resourceType) { query += ` AND r.resource_type = $${paramIndex++}`; params.push(resourceType); }
        if (gradeLevel) { query += ` AND r.grade_level = $${paramIndex++}`; params.push(gradeLevel); }
        if (search) { query += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex} OR r.author ILIKE $${paramIndex})`; params.push(`%${search}%`); paramIndex++; }
        if (featured === true) { query += ` AND r.is_featured = true`; }

        const validSortFields = ['created_at', 'view_count', 'avg_rating', 'title', 'download_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY r.${sortField} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'} LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return DigitalLibraryDAO.getResources(query, params);
    }

    async getResourceById(resourceId, userId = null) {
        const resource = await DigitalLibraryDAO.getResourceById(resourceId, userId);
        if (!resource) return null;
        await DigitalLibraryDAO.incrementViewCount(resourceId);
        return resource;
    }

    async getFeaturedResources(limit = 10, userId = null) {
        return this.getResources({ featured: true, sortBy: 'avg_rating', limit, userId });
    }

    async getPopularResources(limit = 10, userId = null) {
        return this.getResources({ sortBy: 'view_count', limit, userId });
    }

    async getRecentResources(limit = 10, userId = null) {
        return this.getResources({ sortBy: 'created_at', limit, userId });
    }

    async searchResources(searchTerm, options = {}) {
        return this.getResources({ ...options, search: searchTerm });
    }

    async getRelatedResources(resourceId, limit = 5) {
        return DigitalLibraryDAO.getRelatedResources(resourceId, limit);
    }

    // =====================================
    // CATEGORÍAS
    // =====================================

    async getCategories() {
        return DigitalLibraryDAO.getCategories();
    }

    async getCategoryBySlug(slug) {
        return DigitalLibraryDAO.getCategoryBySlug(slug);
    }

    // =====================================
    // PROGRESO DE USUARIO
    // =====================================

    async getOrCreateProgress(userId, resourceId) {
        const existing = await DigitalLibraryDAO.getProgress(userId, resourceId);
        if (existing) return existing;
        return DigitalLibraryDAO.createProgress(userId, resourceId);
    }

    async updateProgress(userId, resourceId, progressData) {
        const { progressPercent, currentPage, currentPosition, timeSpent, notes, bookmarks, highlights } = progressData;
        await this.getOrCreateProgress(userId, resourceId);

        let updateFields = ['last_accessed_at = NOW()', 'updated_at = NOW()'];
        const params = [];
        let paramIndex = 1;

        if (progressPercent !== undefined) { updateFields.push(`progress_percent = $${paramIndex++}`); params.push(Math.min(100, Math.max(0, progressPercent))); }
        if (currentPage !== undefined) { updateFields.push(`current_page = $${paramIndex++}`); params.push(currentPage); }
        if (currentPosition !== undefined) { updateFields.push(`current_position = $${paramIndex++}`); params.push(currentPosition); }
        if (timeSpent !== undefined) { updateFields.push(`total_time_spent = total_time_spent + $${paramIndex++}`); params.push(timeSpent); }
        if (notes !== undefined) { updateFields.push(`notes = $${paramIndex++}`); params.push(notes); }
        if (bookmarks !== undefined) { updateFields.push(`bookmarks = $${paramIndex++}`); params.push(JSON.stringify(bookmarks)); }
        if (highlights !== undefined) { updateFields.push(`highlights = $${paramIndex++}`); params.push(JSON.stringify(highlights)); }

        if (progressPercent >= 100) {
            updateFields.push('is_completed = true', 'completed_at = COALESCE(completed_at, NOW())', 'completion_count = completion_count + 1');
        }

        params.push(userId, resourceId);
        const query = `UPDATE library_user_progress SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex++} AND resource_id = $${paramIndex} RETURNING *`;

        const progress = await DigitalLibraryDAO.updateProgress(query, params);
        if (progressPercent >= 100 && progress.completion_count === 1) {
            await this.grantCompletionRewards(userId, resourceId);
        }
        return progress;
    }

    async grantCompletionRewards(userId, resourceId) {
        const resource = await DigitalLibraryDAO.getResourceRewards(resourceId);
        if (!resource) return;
        const { xp_reward, coins_reward } = resource;
        await DigitalLibraryDAO.updateProgressRewards(userId, resourceId, xp_reward, coins_reward);
        return { xp: xp_reward, coins: coins_reward };
    }

    async getUserReadingHistory(userId, options = {}) {
        const { limit = 20, offset = 0, completedOnly = false } = options;
        return DigitalLibraryDAO.getUserReadingHistory(userId, completedOnly, limit, offset);
    }

    async getUserStats(userId) {
        return DigitalLibraryDAO.getUserStats(userId);
    }

    // =====================================
    // FAVORITOS
    // =====================================

    async addToFavorites(userId, resourceId, folderName = null) {
        const result = await DigitalLibraryDAO.addToFavorites(userId, resourceId, folderName);
        await DigitalLibraryDAO.incrementLikeCount(resourceId);
        return result;
    }

    async removeFromFavorites(userId, resourceId) {
        await DigitalLibraryDAO.removeFromFavorites(userId, resourceId);
        await DigitalLibraryDAO.decrementLikeCount(resourceId);
        return true;
    }

    async getUserFavorites(userId, options = {}) {
        const { folderName, limit = 50, offset = 0 } = options;
        return DigitalLibraryDAO.getUserFavorites(userId, folderName, limit, offset);
    }

    // =====================================
    // RESEÑAS
    // =====================================

    async addReview(userId, resourceId, rating, reviewText = null) {
        return DigitalLibraryDAO.addReview(userId, resourceId, rating, reviewText);
    }

    async getResourceReviews(resourceId, options = {}) {
        const { limit = 20, offset = 0 } = options;
        return DigitalLibraryDAO.getResourceReviews(resourceId, limit, offset);
    }

    async deleteReview(userId, resourceId) {
        await DigitalLibraryDAO.deleteReview(userId, resourceId);
        return true;
    }

    // =====================================
    // COLECCIONES
    // =====================================

    async createCollection(userId, name, description = null, isPublic = false) {
        return DigitalLibraryDAO.createCollection(userId, name, description, isPublic);
    }

    async getUserCollections(userId) {
        return DigitalLibraryDAO.getUserCollections(userId);
    }

    async addToCollection(collectionId, resourceId, notes = null) {
        return DigitalLibraryDAO.addToCollection(collectionId, resourceId, notes);
    }

    async getCollectionItems(collectionId) {
        return DigitalLibraryDAO.getCollectionItems(collectionId);
    }

    async removeFromCollection(collectionId, resourceId) {
        await DigitalLibraryDAO.removeFromCollection(collectionId, resourceId);
        return true;
    }

    // =====================================
    // DESCARGAS
    // =====================================

    async recordDownload(userId, resourceId, downloadType = 'full', ipAddress = null, userAgent = null) {
        const result = await DigitalLibraryDAO.recordDownload(userId, resourceId, downloadType, ipAddress, userAgent);
        await DigitalLibraryDAO.incrementDownloadCount(resourceId);
        return result;
    }

    async getUserDownloads(userId, limit = 50) {
        return DigitalLibraryDAO.getUserDownloads(userId, limit);
    }

    // =====================================
    // ADMIN
    // =====================================

    async createResource(resourceData, createdBy) {
        const { title } = resourceData;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
        return DigitalLibraryDAO.createResource({ ...resourceData, slug, createdBy });
    }

    async updateResource(resourceId, resourceData) {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        const allowedFields = ['title', 'description', 'summary', 'category_id', 'subject', 'grade_level', 'resource_type', 'format', 'file_url', 'thumbnail_url',
            'preview_url', 'file_size', 'duration', 'page_count', 'author', 'publisher', 'publication_date', 'isbn', 'language', 'external_url', 'embed_code',
            'xp_reward', 'coins_reward', 'is_featured', 'is_premium', 'required_level', 'is_active'];

        for (const [key, value] of Object.entries(resourceData)) {
            const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (allowedFields.includes(dbKey) && value !== undefined) {
                fields.push(`${dbKey} = $${paramIndex++}`);
                params.push(key === 'tags' ? JSON.stringify(value) : value);
            }
        }

        if (fields.length === 0) return null;
        return DigitalLibraryDAO.updateResource(resourceId, fields, params);
    }

    async deleteResource(resourceId) {
        return DigitalLibraryDAO.deleteResource(resourceId);
    }
}

module.exports = new DigitalLibraryService();
