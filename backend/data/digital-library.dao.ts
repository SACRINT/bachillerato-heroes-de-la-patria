/**
 * 📚 DIGITAL LIBRARY DAO - TypeScript
 * Data Access Object para biblioteca digital
 * Abstrae todas las queries SQL de DigitalLibraryService
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import { executeQuery } from '../config/database';

// =====================================================
// INTERFACES
// =====================================================

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

    // Joined fields
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

    // Joined fields
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

    // Joined fields
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

    // Joined fields
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

    // Joined fields
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

// =====================================================
// DIGITAL LIBRARY DAO CLASS
// =====================================================

class DigitalLibraryDAO {

    // ==========================================
    // RECURSOS
    // ==========================================

    static async getResources(query: string, params: any[]): Promise<Resource[]> {
        return executeQuery(query, params);
    }

    static async getResourceById(resourceId: number | string, userId?: number): Promise<ResourceDetail | null> {
        let query = `SELECT r.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon`;
        const params: any[] = [resourceId];

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
        return results[0] || null;
    }

    static async getRelatedResources(resourceId: number | string, limit: number): Promise<any[]> {
        const query = `SELECT r.*, rr.relation_type, rr.relevance_score FROM library_related_resources rr
            JOIN library_resources r ON rr.related_resource_id = r.id WHERE rr.resource_id = $1 AND r.is_active = true
            ORDER BY rr.relevance_score DESC LIMIT $2`;
        return executeQuery(query, [resourceId, limit]);
    }

    static async incrementViewCount(resourceId: number | string): Promise<void> {
        await executeQuery(`UPDATE library_resources SET view_count = view_count + 1 WHERE id = $1`, [resourceId]);
    }

    // ==========================================
    // CATEGORÍAS
    // ==========================================

    static async getCategories(): Promise<Category[]> {
        const query = `SELECT c.*, COUNT(r.id) as resource_count FROM library_categories c
            LEFT JOIN library_resources r ON c.id = r.category_id AND r.is_active = true
            WHERE c.is_active = true GROUP BY c.id ORDER BY c.sort_order ASC`;
        return executeQuery(query, []);
    }

    static async getCategoryBySlug(slug: string): Promise<Category | null> {
        const results = await executeQuery(`SELECT * FROM library_categories WHERE slug = $1 AND is_active = true`, [slug]);
        return results[0] || null;
    }

    // ==========================================
    // PROGRESO DE USUARIO
    // ==========================================

    static async getProgress(userId: number, resourceId: number | string): Promise<UserProgress | null> {
        const results = await executeQuery(`SELECT * FROM library_user_progress WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
        return results[0] || null;
    }

    static async createProgress(userId: number, resourceId: number | string): Promise<UserProgress> {
        const results = await executeQuery(`INSERT INTO library_user_progress (user_id, resource_id) VALUES ($1, $2) RETURNING *`, [userId, resourceId]);
        return results[0];
    }

    static async updateProgress(query: string, params: any[]): Promise<UserProgress> {
        const results = await executeQuery(query, params);
        return results[0];
    }

    static async getResourceRewards(resourceId: number | string): Promise<{ xp_reward: number; coins_reward: number } | null> {
        const results = await executeQuery(`SELECT xp_reward, coins_reward FROM library_resources WHERE id = $1`, [resourceId]);
        return results[0] || null;
    }

    static async updateProgressRewards(userId: number, resourceId: number | string, xp: number, coins: number): Promise<void> {
        await executeQuery(`UPDATE library_user_progress SET xp_earned = xp_earned + $1, coins_earned = coins_earned + $2 WHERE user_id = $3 AND resource_id = $4`, [xp, coins, userId, resourceId]);
    }

    static async getUserReadingHistory(userId: number, completedOnly: boolean, limit: number, offset: number): Promise<UserProgress[]> {
        let query = `SELECT p.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author, c.name as category_name
            FROM library_user_progress p JOIN library_resources r ON p.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id WHERE p.user_id = $1`;
        if (completedOnly) query += ` AND p.is_completed = true`;
        query += ` ORDER BY p.last_accessed_at DESC LIMIT $2 OFFSET $3`;
        return executeQuery(query, [userId, limit, offset]);
    }

    static async getUserStats(userId: number): Promise<UserStats> {
        const results = await executeQuery(`SELECT COUNT(*) as total_resources, COUNT(*) FILTER (WHERE is_completed = true) as completed,
            COALESCE(SUM(total_time_spent), 0) as total_time, COALESCE(SUM(xp_earned), 0) as total_xp,
            COALESCE(SUM(coins_earned), 0) as total_coins, COALESCE(AVG(progress_percent), 0) as avg_progress
            FROM library_user_progress WHERE user_id = $1`, [userId]);
        const row = results[0];
        return {
            total_resources: parseInt(row.total_resources),
            completed: parseInt(row.completed),
            total_time: parseInt(row.total_time),
            total_xp: parseInt(row.total_xp),
            total_coins: parseInt(row.total_coins),
            avg_progress: parseFloat(row.avg_progress)
        };
    }

    // ==========================================
    // FAVORITOS
    // ==========================================

    static async addToFavorites(userId: number, resourceId: number | string, folderName: string): Promise<Favorite> {
        const results = await executeQuery(`INSERT INTO library_favorites (user_id, resource_id, folder_name) VALUES ($1, $2, $3)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET folder_name = $3 RETURNING *`, [userId, resourceId, folderName]);
        return results[0];
    }

    static async incrementLikeCount(resourceId: number | string): Promise<void> {
        await executeQuery(`UPDATE library_resources SET like_count = like_count + 1 WHERE id = $1`, [resourceId]);
    }

    static async removeFromFavorites(userId: number, resourceId: number | string): Promise<void> {
        await executeQuery(`DELETE FROM library_favorites WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
    }

    static async decrementLikeCount(resourceId: number | string): Promise<void> {
        await executeQuery(`UPDATE library_resources SET like_count = GREATEST(0, like_count - 1) WHERE id = $1`, [resourceId]);
    }

    static async getUserFavorites(userId: number, folderName: string, limit: number, offset: number): Promise<Favorite[]> {
        let query = `SELECT f.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author, r.avg_rating, c.name as category_name
            FROM library_favorites f JOIN library_resources r ON f.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id WHERE f.user_id = $1`;
        const params: any[] = [userId];
        if (folderName) { params.push(folderName); query += ` AND f.folder_name = $${params.length}`; }
        params.push(limit, offset);
        query += ` ORDER BY f.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
        return executeQuery(query, params);
    }

    // ==========================================
    // RESEÑAS
    // ==========================================

    static async addReview(userId: number, resourceId: number | string, rating: number, reviewText: string): Promise<Review> {
        const results = await executeQuery(`INSERT INTO library_reviews (user_id, resource_id, rating, review_text) VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET rating = $3, review_text = $4, updated_at = NOW() RETURNING *`, [userId, resourceId, rating, reviewText]);
        return results[0];
    }

    static async getResourceReviews(resourceId: number | string, limit: number, offset: number): Promise<Review[]> {
        return executeQuery(`SELECT r.*, u.nombre, u.apellido_paterno FROM library_reviews r JOIN usuarios u ON r.user_id = u.id
            WHERE r.resource_id = $1 AND r.is_approved = true ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`, [resourceId, limit, offset]);
    }

    static async deleteReview(userId: number, resourceId: number | string): Promise<void> {
        await executeQuery(`DELETE FROM library_reviews WHERE user_id = $1 AND resource_id = $2`, [userId, resourceId]);
    }

    // ==========================================
    // COLECCIONES
    // ==========================================

    static async createCollection(userId: number, name: string, description: string, isPublic: boolean): Promise<Collection> {
        const results = await executeQuery(`INSERT INTO library_collections (user_id, name, description, is_public) VALUES ($1, $2, $3, $4) RETURNING *`, [userId, name, description, isPublic]);
        return results[0];
    }

    static async getUserCollections(userId: number): Promise<Collection[]> {
        return executeQuery(`SELECT * FROM library_collections WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
    }

    static async addToCollection(collectionId: number | string, resourceId: number | string, notes: string): Promise<CollectionItem> {
        const results = await executeQuery(`INSERT INTO library_collection_items (collection_id, resource_id, notes) VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, resource_id) DO UPDATE SET notes = $3 RETURNING *`, [collectionId, resourceId, notes]);
        return results[0];
    }

    static async getCollectionItems(collectionId: number | string): Promise<CollectionItem[]> {
        return executeQuery(`SELECT ci.*, r.title, r.slug, r.thumbnail_url, r.resource_type, r.author
            FROM library_collection_items ci JOIN library_resources r ON ci.resource_id = r.id
            WHERE ci.collection_id = $1 ORDER BY ci.sort_order ASC`, [collectionId]);
    }

    static async removeFromCollection(collectionId: number | string, resourceId: number | string): Promise<void> {
        await executeQuery(`DELETE FROM library_collection_items WHERE collection_id = $1 AND resource_id = $2`, [collectionId, resourceId]);
    }

    // ==========================================
    // DESCARGAS
    // ==========================================

    static async recordDownload(userId: number, resourceId: number | string, downloadType: string, ipAddress: string, userAgent: string): Promise<Download> {
        const results = await executeQuery(`INSERT INTO library_downloads (user_id, resource_id, download_type, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, resourceId, downloadType, ipAddress, userAgent]);
        return results[0];
    }

    static async incrementDownloadCount(resourceId: number | string): Promise<void> {
        await executeQuery(`UPDATE library_resources SET download_count = download_count + 1 WHERE id = $1`, [resourceId]);
    }

    static async getUserDownloads(userId: number, limit: number): Promise<Download[]> {
        return executeQuery(`SELECT d.*, r.title, r.slug, r.file_url FROM library_downloads d
            JOIN library_resources r ON d.resource_id = r.id WHERE d.user_id = $1 ORDER BY d.created_at DESC LIMIT $2`, [userId, limit]);
    }

    // ==========================================
    // ADMIN
    // ==========================================

    static async createResource(data: CreateResourceInput): Promise<Resource> {
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

    static async updateResource(resourceId: number | string, fields: string[], params: any[]): Promise<Resource> {
        const query = `UPDATE library_resources SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length + 1} RETURNING *`;
        params.push(resourceId);
        const results = await executeQuery(query, params);
        return results[0];
    }

    static async deleteResource(resourceId: number | string): Promise<Resource> {
        const results = await executeQuery(`UPDATE library_resources SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *`, [resourceId]);
        return results[0];
    }
}

export default DigitalLibraryDAO;
module.exports = DigitalLibraryDAO;
