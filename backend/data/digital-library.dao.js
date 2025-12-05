/**
 * 📚 DIGITAL LIBRARY DAO
 * Data Access Object para biblioteca digital
 * Abstrae todas las queries SQL de DigitalLibraryService
 * 
 * Refactorizado: 04 Diciembre 2025
 */

const { executeQuery } = require('../config/database');

class DigitalLibraryDAO {

    // ==========================================
    // RECURSOS
    // ==========================================

    static async getResources(query, params) {
        return executeQuery(query, params);
    }

    static async getResourceById(resourceId, userId) {
        let query = `SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon`;
        const params = [resourceId];

        if (userId) {
            query += `, p.progress_percent, p.current_page, p.current_position, p.is_completed, p.notes as user_notes, p.bookmarks, p.highlights,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorite, ur.rating as user_rating, ur.review_text as user_review`;
        }

        query += ` FROM library_resources r LEFT JOIN library_categories c ON r.category_id = c.id`;

        if (userId) {
            query += ` LEFT JOIN library_user_progress p ON r.id = p.resource_id AND p.user_id = $2
                LEFT JOIN library_favorites f ON r.id = f.resource_id AND f.user_id = $2
                LEFT JOIN library_reviews ur ON r.id = ur.resource_id AND ur.user_id = $2`;
            params.push(userId);
        }

        query += ` WHERE r.id = $1`;
        const results = await executeQuery(query, params);
        return results[0];
    }

    static async getRelatedResources(resourceId, limit) {
        const query = `SELECT r.*, rr.relation_type, rr.relevance_score FROM library_related_resources rr
            JOIN library_resources r ON rr.related_resource_id = r.id WHERE rr.resource_id = $1 AND r.is_active = true
            ORDER BY rr.relevance_score DESC LIMIT $2`;
        return executeQuery(query, [resourceId, limit]);
    }

    static async incrementViewCount(resourceId) {
        await executeQuery(`UPDATE library_resources SET view_count = view_count + 1 WHERE id = $1`, [resourceId]);
    }

    // ==========================================
    // CATEGORÍAS
    // ==========================================

    static async getCategories() {
        const query = `SELECT c.*, COUNT(r.id) as resource_count FROM library_categories c
            LEFT JOIN library_resources r ON c.id = r.category_id AND r.is_active = true
            WHERE c.is_active = true GROUP BY c.id ORDER BY c.sort_order ASC`;
        return executeQuery(query, []);
    }

    static async getCategoryBySlug(slug) {
        const results = await executeQuery(`SELECT * FROM library_categories WHERE slug = $1 AND is_active = true`, [slug]);
        return results[0];
    }

    // ==========================================
    // PROGRESO DE USUARIO
    // ==========================================

    static async getProgress(userId, resourceId) {
        const results = await executeQuery(`SELECT * FROM library_user_progress WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
        return results[0];
    }

    static async createProgress(userId, resourceId) {
        const results = await executeQuery(`INSERT INTO library_user_progress (user_id, resource_id) VALUES ($1, $2) RETURNING *`, [userId, resourceId]);
        return results[0];
    }

    static async updateProgress(query, params) {
        const results = await executeQuery(query, params);
        return results[0];
    }

    static async getResourceRewards(resourceId) {
        const results = await executeQuery(`SELECT xp_reward, coins_reward FROM library_resources WHERE id = $1`, [resourceId]);
        return results[0];
    }

    static async updateProgressRewards(userId, resourceId, xp, coins) {
        await executeQuery(`UPDATE library_user_progress SET xp_earned = xp_earned + $1, coins_earned = coins_earned + $2 WHERE user_id = $3 AND resource_id = $4`, [xp, coins, userId, resourceId]);
    }

    static async getUserReadingHistory(userId, completedOnly, limit, offset) {
        let query = `SELECT p.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author, c.name as category_name
            FROM library_user_progress p JOIN library_resources r ON p.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id WHERE p.user_id = $1`;
        if (completedOnly) query += ` AND p.is_completed = true`;
        query += ` ORDER BY p.last_accessed_at DESC LIMIT $2 OFFSET $3`;
        return executeQuery(query, [userId, limit, offset]);
    }

    static async getUserStats(userId) {
        const results = await executeQuery(`SELECT COUNT(*) as total_resources, COUNT(*) FILTER (WHERE is_completed = true) as completed,
            COALESCE(SUM(total_time_spent), 0) as total_time, COALESCE(SUM(xp_earned), 0) as total_xp,
            COALESCE(SUM(coins_earned), 0) as total_coins, COALESCE(AVG(progress_percent), 0) as avg_progress
            FROM library_user_progress WHERE user_id = $1`, [userId]);
        return results[0];
    }

    // ==========================================
    // FAVORITOS
    // ==========================================

    static async addToFavorites(userId, resourceId, folderName) {
        const results = await executeQuery(`INSERT INTO library_favorites (user_id, resource_id, folder_name) VALUES ($1, $2, $3)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET folder_name = $3 RETURNING *`, [userId, resourceId, folderName]);
        return results[0];
    }

    static async incrementLikeCount(resourceId) {
        await executeQuery(`UPDATE library_resources SET like_count = like_count + 1 WHERE id = $1`, [resourceId]);
    }

    static async removeFromFavorites(userId, resourceId) {
        await executeQuery(`DELETE FROM library_favorites WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
    }

    static async decrementLikeCount(resourceId) {
        await executeQuery(`UPDATE library_resources SET like_count = GREATEST(0, like_count - 1) WHERE id = $1`, [resourceId]);
    }

    static async getUserFavorites(userId, folderName, limit, offset) {
        let query = `SELECT f.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author, r.avg_rating, c.name as category_name
            FROM library_favorites f JOIN library_resources r ON f.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id WHERE f.user_id = $1`;
        const params = [userId];
        if (folderName) { params.push(folderName); query += ` AND f.folder_name = $${params.length}`; }
        params.push(limit, offset);
        query += ` ORDER BY f.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
        return executeQuery(query, params);
    }

    // ==========================================
    // RESEÑAS
    // ==========================================

    static async addReview(userId, resourceId, rating, reviewText) {
        const results = await executeQuery(`INSERT INTO library_reviews (user_id, resource_id, rating, review_text) VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET rating = $3, review_text = $4, updated_at = NOW() RETURNING *`, [userId, resourceId, rating, reviewText]);
        return results[0];
    }

    static async getResourceReviews(resourceId, limit, offset) {
        return executeQuery(`SELECT r.*, u.nombre, u.apellido_paterno FROM library_reviews r JOIN usuarios u ON r.user_id = u.id
            WHERE r.resource_id = $1 AND r.is_approved = true ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`, [resourceId, limit, offset]);
    }

    static async deleteReview(userId, resourceId) {
        await executeQuery(`DELETE FROM library_reviews WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
    }

    // ==========================================
    // COLECCIONES
    // ==========================================

    static async createCollection(userId, name, description, isPublic) {
        const results = await executeQuery(`INSERT INTO library_collections (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *`, [userId, name, description, isPublic]);
        return results[0];
    }

    static async getUserCollections(userId) {
        return executeQuery(`SELECT * FROM library_collections WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    }

    static async addToCollection(collectionId, resourceId, notes) {
        const results = await executeQuery(`INSERT INTO library_collection_items (collection_id, resource_id, notes) VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, resource_id) DO UPDATE SET notes = $3 RETURNING *`, [collectionId, resourceId, notes]);
        return results[0];
    }

    static async getCollectionItems(collectionId) {
        return executeQuery(`SELECT ci.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author
            FROM library_collection_items ci JOIN library_resources r ON ci.resource_id = r.id
            WHERE ci.collection_id = $1 ORDER BY ci.sort_order ASC`, [collectionId]);
    }

    static async removeFromCollection(collectionId, resourceId) {
        await executeQuery(`DELETE FROM library_collection_items WHERE collection_id = $1 AND resource_id = $2`, [collectionId, resourceId]);
    }

    // ==========================================
    // DESCARGAS
    // ==========================================

    static async recordDownload(userId, resourceId, downloadType, ipAddress, userAgent) {
        const results = await executeQuery(`INSERT INTO library_downloads (user_id, resource_id, download_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, resourceId, downloadType, ipAddress, userAgent]);
        return results[0];
    }

    static async incrementDownloadCount(resourceId) {
        await executeQuery(`UPDATE library_resources SET download_count = download_count + 1 WHERE id = $1`, [resourceId]);
    }

    static async getUserDownloads(userId, limit) {
        return executeQuery(`SELECT d.*, r.title, r.slug, r.file_url FROM library_downloads d
            JOIN library_resources r ON d.resource_id = r.id WHERE d.user_id = $1 ORDER BY d.created_at DESC LIMIT $2`, [userId, limit]);
    }

    // ==========================================
    // ADMIN
    // ==========================================

    static async createResource(data) {
        const { title, slug, description, summary, categoryId, subject, gradeLevel, resourceType, format, fileUrl, thumbnailUrl, previewUrl,
            fileSize, duration, pageCount, author, publisher, publicationDate, isbn, language, externalUrl, embedCode, xpReward, coinsReward,
            tags, isFeatured, isPremium, requiredLevel, createdBy } = data;

        const results = await executeQuery(`INSERT INTO library_resources (
            title, slug, description, summary, category_id, subject, grade_level, resource_type, format, file_url, thumbnail_url, preview_url,
            file_size, duration, page_count, author, publisher, publication_date, isbn, language, external_url, embed_code, xp_reward, coins_reward,
            tags, is_featured, is_premium, required_level, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) RETURNING *`,
            [title, slug, description, summary, categoryId, subject, gradeLevel, resourceType, format, fileUrl, thumbnailUrl, previewUrl,
                fileSize, duration, pageCount, author, publisher, publicationDate, isbn, language || 'es', externalUrl, embedCode, xpReward || 10, coinsReward || 5,
                tags ? JSON.stringify(tags) : null, isFeatured || false, isPremium || false, requiredLevel || 1, createdBy]);
        return results[0];
    }

    static async updateResource(resourceId, fields, params) {
        const query = `UPDATE library_resources SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length + 1} RETURNING *`;
        params.push(resourceId);
        const results = await executeQuery(query, params);
        return results[0];
    }

    static async deleteResource(resourceId) {
        const results = await executeQuery(`UPDATE library_resources SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`, [resourceId]);
        return results[0];
    }
}

module.exports = DigitalLibraryDAO;
