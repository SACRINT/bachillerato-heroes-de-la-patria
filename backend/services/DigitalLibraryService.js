/**
 * 📚 DIGITAL LIBRARY SERVICE
 * Servicio de gestión de biblioteca digital
 * FASE 2 - Semana 13-14
 */

const { executeQuery } = require('../data/database-access');

class DigitalLibraryService {
    constructor() {
        // Tipos de recursos soportados
        this.resourceTypes = ['book', 'article', 'video', 'audio', 'document', 'interactive'];

        // Formatos soportados
        this.formats = ['pdf', 'epub', 'mp4', 'mp3', 'html', 'docx'];
    }

    // =====================================
    // RECURSOS
    // =====================================

    /**
     * Obtiene recursos con filtros
     */
    async getResources(options = {}) {
        const {
            categoryId,
            subject,
            resourceType,
            gradeLevel,
            search,
            featured,
            sortBy = 'created_at',
            sortOrder = 'DESC',
            limit = 20,
            offset = 0,
            userId // Para incluir progreso del usuario
        } = options;

        let query = `
            SELECT
                r.*,
                c.name as category_name,
                c.slug as category_slug,
                c.icon as category_icon,
                c.color as category_color
        `;

        // Si hay userId, incluir progreso y favoritos
        if (userId) {
            query += `,
                p.progress_percent,
                p.is_completed,
                p.last_accessed_at as user_last_access,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorite
            `;
        }

        query += `
            FROM library_resources r
            LEFT JOIN library_categories c ON r.category_id = c.id
        `;

        if (userId) {
            query += `
                LEFT JOIN library_user_progress p ON r.id = p.resource_id AND p.user_id = $1
                LEFT JOIN library_favorites f ON r.id = f.resource_id AND f.user_id = $1
            `;
        }

        query += ` WHERE r.is_active = true`;

        const params = userId ? [userId] : [];
        let paramIndex = userId ? 2 : 1;

        if (categoryId) {
            query += ` AND r.category_id = $${paramIndex++}`;
            params.push(categoryId);
        }

        if (subject) {
            query += ` AND r.subject = $${paramIndex++}`;
            params.push(subject);
        }

        if (resourceType) {
            query += ` AND r.resource_type = $${paramIndex++}`;
            params.push(resourceType);
        }

        if (gradeLevel) {
            query += ` AND r.grade_level = $${paramIndex++}`;
            params.push(gradeLevel);
        }

        if (search) {
            query += ` AND (
                r.title ILIKE $${paramIndex} OR
                r.description ILIKE $${paramIndex} OR
                r.author ILIKE $${paramIndex} OR
                r.summary ILIKE $${paramIndex}
            )`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (featured === true) {
            query += ` AND r.is_featured = true`;
        }

        // Ordenamiento seguro
        const validSortFields = ['created_at', 'view_count', 'avg_rating', 'title', 'download_count'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY r.${sortField} ${order}`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtiene un recurso por ID
     */
    async getResourceById(resourceId, userId = null) {
        let query = `
            SELECT
                r.*,
                c.name as category_name,
                c.slug as category_slug,
                c.icon as category_icon
        `;

        const params = [resourceId];

        if (userId) {
            query += `,
                p.progress_percent,
                p.current_page,
                p.current_position,
                p.is_completed,
                p.notes as user_notes,
                p.bookmarks,
                p.highlights,
                CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_favorite,
                ur.rating as user_rating,
                ur.review_text as user_review
            `;
        }

        query += `
            FROM library_resources r
            LEFT JOIN library_categories c ON r.category_id = c.id
        `;

        if (userId) {
            query += `
                LEFT JOIN library_user_progress p ON r.id = p.resource_id AND p.user_id = $2
                LEFT JOIN library_favorites f ON r.id = f.resource_id AND f.user_id = $2
                LEFT JOIN library_reviews ur ON r.id = ur.resource_id AND ur.user_id = $2
            `;
            params.push(userId);
        }

        query += ` WHERE r.id = $1`;

        const results = await executeQuery(query, params);

        if (results.length === 0) return null;

        // Incrementar contador de vistas
        await this.incrementViewCount(resourceId);

        return results[0];
    }

    /**
     * Obtiene recursos destacados
     */
    async getFeaturedResources(limit = 10, userId = null) {
        return this.getResources({
            featured: true,
            sortBy: 'avg_rating',
            limit,
            userId
        });
    }

    /**
     * Obtiene recursos populares
     */
    async getPopularResources(limit = 10, userId = null) {
        return this.getResources({
            sortBy: 'view_count',
            limit,
            userId
        });
    }

    /**
     * Obtiene recursos recientes
     */
    async getRecentResources(limit = 10, userId = null) {
        return this.getResources({
            sortBy: 'created_at',
            limit,
            userId
        });
    }

    /**
     * Busca recursos
     */
    async searchResources(searchTerm, options = {}) {
        return this.getResources({
            ...options,
            search: searchTerm
        });
    }

    /**
     * Obtiene recursos relacionados
     */
    async getRelatedResources(resourceId, limit = 5) {
        const query = `
            SELECT
                r.*,
                rr.relation_type,
                rr.relevance_score
            FROM library_related_resources rr
            JOIN library_resources r ON rr.related_resource_id = r.id
            WHERE rr.resource_id = $1 AND r.is_active = true
            ORDER BY rr.relevance_score DESC
            LIMIT $2
        `;

        return executeQuery(query, [resourceId, limit]);
    }

    /**
     * Incrementa contador de vistas
     */
    async incrementViewCount(resourceId) {
        const query = `
            UPDATE library_resources
            SET view_count = view_count + 1
            WHERE id = $1
        `;
        await executeQuery(query, [resourceId]);
    }

    // =====================================
    // CATEGORÍAS
    // =====================================

    /**
     * Obtiene todas las categorías
     */
    async getCategories() {
        const query = `
            SELECT
                c.*,
                COUNT(r.id) as resource_count
            FROM library_categories c
            LEFT JOIN library_resources r ON c.id = r.category_id AND r.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id
            ORDER BY c.sort_order ASC
        `;

        return executeQuery(query, []);
    }

    /**
     * Obtiene categoría por slug
     */
    async getCategoryBySlug(slug) {
        const query = `
            SELECT * FROM library_categories
            WHERE slug = $1 AND is_active = true
        `;

        const results = await executeQuery(query, [slug]);
        return results[0] || null;
    }

    // =====================================
    // PROGRESO DE USUARIO
    // =====================================

    /**
     * Obtiene o crea progreso de usuario
     */
    async getOrCreateProgress(userId, resourceId) {
        // Verificar si existe
        const checkQuery = `
            SELECT * FROM library_user_progress
            WHERE user_id = $1 AND resource_id = $2
        `;

        const existing = await executeQuery(checkQuery, [userId, resourceId]);

        if (existing.length > 0) {
            return existing[0];
        }

        // Crear nuevo progreso
        const createQuery = `
            INSERT INTO library_user_progress (user_id, resource_id)
            VALUES ($1, $2)
            RETURNING *
        `;

        const results = await executeQuery(createQuery, [userId, resourceId]);
        return results[0];
    }

    /**
     * Actualiza progreso de lectura
     */
    async updateProgress(userId, resourceId, progressData) {
        const {
            progressPercent,
            currentPage,
            currentPosition,
            timeSpent,
            notes,
            bookmarks,
            highlights
        } = progressData;

        // Asegurar que existe el progreso
        await this.getOrCreateProgress(userId, resourceId);

        let updateFields = ['last_accessed_at = NOW()', 'updated_at = NOW()'];
        const params = [];
        let paramIndex = 1;

        if (progressPercent !== undefined) {
            updateFields.push(`progress_percent = $${paramIndex++}`);
            params.push(Math.min(100, Math.max(0, progressPercent)));
        }

        if (currentPage !== undefined) {
            updateFields.push(`current_page = $${paramIndex++}`);
            params.push(currentPage);
        }

        if (currentPosition !== undefined) {
            updateFields.push(`current_position = $${paramIndex++}`);
            params.push(currentPosition);
        }

        if (timeSpent !== undefined) {
            updateFields.push(`total_time_spent = total_time_spent + $${paramIndex++}`);
            params.push(timeSpent);
        }

        if (notes !== undefined) {
            updateFields.push(`notes = $${paramIndex++}`);
            params.push(notes);
        }

        if (bookmarks !== undefined) {
            updateFields.push(`bookmarks = $${paramIndex++}`);
            params.push(JSON.stringify(bookmarks));
        }

        if (highlights !== undefined) {
            updateFields.push(`highlights = $${paramIndex++}`);
            params.push(JSON.stringify(highlights));
        }

        // Verificar si completó
        if (progressPercent >= 100) {
            updateFields.push('is_completed = true');
            updateFields.push('completed_at = COALESCE(completed_at, NOW())');
            updateFields.push('completion_count = completion_count + 1');
        }

        params.push(userId, resourceId);

        const query = `
            UPDATE library_user_progress
            SET ${updateFields.join(', ')}
            WHERE user_id = $${paramIndex++} AND resource_id = $${paramIndex}
            RETURNING *
        `;

        const results = await executeQuery(query, params);
        const progress = results[0];

        // Si completó, otorgar recompensas
        if (progressPercent >= 100 && progress.completion_count === 1) {
            await this.grantCompletionRewards(userId, resourceId);
        }

        return progress;
    }

    /**
     * Otorga recompensas por completar recurso
     */
    async grantCompletionRewards(userId, resourceId) {
        // Obtener recompensas del recurso
        const resourceQuery = `
            SELECT xp_reward, coins_reward FROM library_resources WHERE id = $1
        `;
        const resourceResult = await executeQuery(resourceQuery, [resourceId]);

        if (resourceResult.length === 0) return;

        const { xp_reward, coins_reward } = resourceResult[0];

        // Actualizar progreso con recompensas
        const updateQuery = `
            UPDATE library_user_progress
            SET xp_earned = xp_earned + $1, coins_earned = coins_earned + $2
            WHERE user_id = $3 AND resource_id = $4
        `;
        await executeQuery(updateQuery, [xp_reward, coins_reward, userId, resourceId]);

        // Aquí se integraría con IACoinsService y LevelsService
        // await IACoinsService.addCoins(userId, coins_reward, 'library_completion', resourceId);
        // await LevelsService.grantXP(userId, xp_reward, 'library_completion');

        return { xp: xp_reward, coins: coins_reward };
    }

    /**
     * Obtiene historial de lectura del usuario
     */
    async getUserReadingHistory(userId, options = {}) {
        const { limit = 20, offset = 0, completedOnly = false } = options;

        let query = `
            SELECT
                p.*,
                r.title,
                r.slug,
                r.thumbnail_url,
                r.resource_type,
                r.author,
                c.name as category_name
            FROM library_user_progress p
            JOIN library_resources r ON p.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id
            WHERE p.user_id = $1
        `;

        const params = [userId];
        let paramIndex = 2;

        if (completedOnly) {
            query += ` AND p.is_completed = true`;
        }

        query += ` ORDER BY p.last_accessed_at DESC`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    /**
     * Obtiene estadísticas de lectura del usuario
     */
    async getUserStats(userId) {
        const query = `
            SELECT
                COUNT(*) as total_resources,
                COUNT(*) FILTER (WHERE is_completed = true) as completed,
                COALESCE(SUM(total_time_spent), 0) as total_time,
                COALESCE(SUM(xp_earned), 0) as total_xp,
                COALESCE(SUM(coins_earned), 0) as total_coins,
                COALESCE(AVG(progress_percent), 0) as avg_progress
            FROM library_user_progress
            WHERE user_id = $1
        `;

        const results = await executeQuery(query, [userId]);
        return results[0];
    }

    // =====================================
    // FAVORITOS
    // =====================================

    /**
     * Agrega a favoritos
     */
    async addToFavorites(userId, resourceId, folderName = null) {
        const query = `
            INSERT INTO library_favorites (user_id, resource_id, folder_name)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET folder_name = $3
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, resourceId, folderName]);

        // Actualizar like_count
        await executeQuery(
            'UPDATE library_resources SET like_count = like_count + 1 WHERE id = $1',
            [resourceId]
        );

        return results[0];
    }

    /**
     * Elimina de favoritos
     */
    async removeFromFavorites(userId, resourceId) {
        const query = `
            DELETE FROM library_favorites
            WHERE user_id = $1 AND resource_id = $2
        `;

        await executeQuery(query, [userId, resourceId]);

        // Actualizar like_count
        await executeQuery(
            'UPDATE library_resources SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
            [resourceId]
        );

        return true;
    }

    /**
     * Obtiene favoritos del usuario
     */
    async getUserFavorites(userId, options = {}) {
        const { folderName, limit = 50, offset = 0 } = options;

        let query = `
            SELECT
                f.*,
                r.title,
                r.slug,
                r.thumbnail_url,
                r.resource_type,
                r.author,
                r.avg_rating,
                c.name as category_name
            FROM library_favorites f
            JOIN library_resources r ON f.resource_id = r.id
            LEFT JOIN library_categories c ON r.category_id = c.id
            WHERE f.user_id = $1
        `;

        const params = [userId];
        let paramIndex = 2;

        if (folderName) {
            query += ` AND f.folder_name = $${paramIndex++}`;
            params.push(folderName);
        }

        query += ` ORDER BY f.created_at DESC`;
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);

        return executeQuery(query, params);
    }

    // =====================================
    // RESEÑAS Y VALORACIONES
    // =====================================

    /**
     * Agrega o actualiza reseña
     */
    async addReview(userId, resourceId, rating, reviewText = null) {
        const query = `
            INSERT INTO library_reviews (user_id, resource_id, rating, review_text)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, resource_id) DO UPDATE SET
                rating = $3,
                review_text = $4,
                updated_at = NOW()
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, resourceId, rating, reviewText]);
        return results[0];
    }

    /**
     * Obtiene reseñas de un recurso
     */
    async getResourceReviews(resourceId, options = {}) {
        const { limit = 20, offset = 0 } = options;

        const query = `
            SELECT
                r.*,
                u.nombre,
                u.apellido_paterno
            FROM library_reviews r
            JOIN usuarios u ON r.user_id = u.id
            WHERE r.resource_id = $1 AND r.is_approved = true
            ORDER BY r.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        return executeQuery(query, [resourceId, limit, offset]);
    }

    /**
     * Elimina reseña
     */
    async deleteReview(userId, resourceId) {
        const query = `
            DELETE FROM library_reviews
            WHERE user_id = $1 AND resource_id = $2
        `;

        await executeQuery(query, [userId, resourceId]);
        return true;
    }

    // =====================================
    // COLECCIONES
    // =====================================

    /**
     * Crea una colección
     */
    async createCollection(userId, name, description = null, isPublic = false) {
        const query = `
            INSERT INTO library_collections (user_id, name, description, is_public)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, name, description, isPublic]);
        return results[0];
    }

    /**
     * Obtiene colecciones del usuario
     */
    async getUserCollections(userId) {
        const query = `
            SELECT * FROM library_collections
            WHERE user_id = $1
            ORDER BY created_at DESC
        `;

        return executeQuery(query, [userId]);
    }

    /**
     * Agrega recurso a colección
     */
    async addToCollection(collectionId, resourceId, notes = null) {
        const query = `
            INSERT INTO library_collection_items (collection_id, resource_id, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, resource_id) DO UPDATE SET notes = $3
            RETURNING *
        `;

        const results = await executeQuery(query, [collectionId, resourceId, notes]);
        return results[0];
    }

    /**
     * Obtiene recursos de una colección
     */
    async getCollectionItems(collectionId) {
        const query = `
            SELECT
                ci.*,
                r.title,
                r.slug,
                r.thumbnail_url,
                r.resource_type,
                r.author
            FROM library_collection_items ci
            JOIN library_resources r ON ci.resource_id = r.id
            WHERE ci.collection_id = $1
            ORDER BY ci.sort_order ASC
        `;

        return executeQuery(query, [collectionId]);
    }

    /**
     * Elimina recurso de colección
     */
    async removeFromCollection(collectionId, resourceId) {
        const query = `
            DELETE FROM library_collection_items
            WHERE collection_id = $1 AND resource_id = $2
        `;

        await executeQuery(query, [collectionId, resourceId]);
        return true;
    }

    // =====================================
    // DESCARGAS
    // =====================================

    /**
     * Registra una descarga
     */
    async recordDownload(userId, resourceId, downloadType = 'full', ipAddress = null, userAgent = null) {
        const query = `
            INSERT INTO library_downloads (user_id, resource_id, download_type, ip_address, user_agent)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const results = await executeQuery(query, [userId, resourceId, downloadType, ipAddress, userAgent]);

        // Actualizar contador
        await executeQuery(
            'UPDATE library_resources SET download_count = download_count + 1 WHERE id = $1',
            [resourceId]
        );

        return results[0];
    }

    /**
     * Obtiene historial de descargas del usuario
     */
    async getUserDownloads(userId, limit = 50) {
        const query = `
            SELECT
                d.*,
                r.title,
                r.slug,
                r.file_url
            FROM library_downloads d
            JOIN library_resources r ON d.resource_id = r.id
            WHERE d.user_id = $1
            ORDER BY d.created_at DESC
            LIMIT $2
        `;

        return executeQuery(query, [userId, limit]);
    }

    // =====================================
    // ADMIN: GESTIÓN DE RECURSOS
    // =====================================

    /**
     * Crea un nuevo recurso (admin)
     */
    async createResource(resourceData, createdBy) {
        const {
            title, description, summary, categoryId, subject, gradeLevel,
            resourceType, format, fileUrl, thumbnailUrl, previewUrl,
            fileSize, duration, pageCount, author, publisher, publicationDate,
            isbn, language, externalUrl, embedCode, xpReward, coinsReward,
            tags, isFeatured, isPremium, requiredLevel
        } = resourceData;

        // Generar slug
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') +
            '-' + Date.now().toString(36);

        const query = `
            INSERT INTO library_resources (
                title, slug, description, summary, category_id, subject, grade_level,
                resource_type, format, file_url, thumbnail_url, preview_url,
                file_size, duration, page_count, author, publisher, publication_date,
                isbn, language, external_url, embed_code, xp_reward, coins_reward,
                tags, is_featured, is_premium, required_level, created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
            )
            RETURNING *
        `;

        const results = await executeQuery(query, [
            title, slug, description, summary, categoryId, subject, gradeLevel,
            resourceType, format, fileUrl, thumbnailUrl, previewUrl,
            fileSize, duration, pageCount, author, publisher, publicationDate,
            isbn, language || 'es', externalUrl, embedCode, xpReward || 10, coinsReward || 5,
            tags ? JSON.stringify(tags) : null, isFeatured || false, isPremium || false,
            requiredLevel || 1, createdBy
        ]);

        return results[0];
    }

    /**
     * Actualiza un recurso (admin)
     */
    async updateResource(resourceId, resourceData) {
        const allowedFields = [
            'title', 'description', 'summary', 'category_id', 'subject', 'grade_level',
            'resource_type', 'format', 'file_url', 'thumbnail_url', 'preview_url',
            'file_size', 'duration', 'page_count', 'author', 'publisher', 'publication_date',
            'isbn', 'language', 'external_url', 'embed_code', 'xp_reward', 'coins_reward',
            'tags', 'is_featured', 'is_premium', 'required_level', 'is_active'
        ];

        const fields = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(resourceData)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (allowedFields.includes(snakeKey)) {
                fields.push(`${snakeKey} = $${paramIndex++}`);
                values.push(key === 'tags' ? JSON.stringify(value) : value);
            }
        }

        if (fields.length === 0) return null;

        values.push(resourceId);
        const query = `
            UPDATE library_resources
            SET ${fields.join(', ')}, updated_at = NOW()
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const results = await executeQuery(query, values);
        return results[0];
    }

    /**
     * Elimina un recurso (soft delete)
     */
    async deleteResource(resourceId) {
        const query = `
            UPDATE library_resources
            SET is_active = false, updated_at = NOW()
            WHERE id = $1
        `;

        await executeQuery(query, [resourceId]);
        return true;
    }
}

module.exports = new DigitalLibraryService();
