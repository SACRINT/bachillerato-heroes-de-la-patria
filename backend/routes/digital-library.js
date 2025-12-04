/**
 * 📚 BIBLIOTECA DIGITAL - API REST
 * Sistema de gestión de documentos digitales con versionado, permisos y búsqueda avanzada
 * Fase 3 - BGE 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN DE MULTER PARA SUBIDA DE ARCHIVOS
// ============================================

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/library');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `doc-${uniqueSuffix}-${sanitizedName}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
        }
    }
});

// ============================================
// MIDDLEWARE DE PERMISOS
// ============================================

/**
 * Verifica si el usuario tiene permiso para realizar una acción sobre un documento
 */
async function checkDocumentPermission(req, res, next) {
    const client = await pool.connect();
    try {
        const documentId = req.params.id || req.params.documentId;
        const userId = req.user.id;
        const userRole = req.user.role;
        const action = req.method === 'GET' ? 'can_view' :
                      req.method === 'POST' ? 'can_comment' :
                      req.method === 'PUT' || req.method === 'DELETE' ? 'can_edit' : 'can_view';

        // Verificar permisos
        const permissionCheck = await client.query(`
            SELECT dp.${action}, d.author_id, d.author_role
            FROM library_documents d
            LEFT JOIN library_document_permissions dp ON d.id = dp.document_id AND dp.role = $2
            WHERE d.id = $1
        `, [documentId, userRole]);

        if (permissionCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const doc = permissionCheck.rows[0];
        const isAuthor = doc.author_id === userId && doc.author_role === userRole;
        const hasPermission = doc[action] === true;

        if (!isAuthor && !hasPermission && userRole !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
        }

        req.isDocumentAuthor = isAuthor;
        next();
    } catch (error) {
        debugLog.error('digital-library', 'Error verificando permisos', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al verificar permisos' });
    } finally {
        client.release();
    }
}

// ============================================
// CATEGORÍAS
// ============================================

/**
 * GET /api/digital-library/categories
 * Listar todas las categorías con estadísticas
 */
router.get('/categories', async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT * FROM v_library_category_stats
            ORDER BY parent_id NULLS FIRST, name ASC
        `);

        res.json({
            success: true,
            categories: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        // Fallback: Categorías default si la vista no existe
        debugLog.warn('digital-library', 'Vista v_library_category_stats no existe, usando fallback', error.message);

        const defaultCategories = [
            { id: 1, name: 'Manuales', slug: 'manuales', description: 'Manuales y guías', document_count: 0 },
            { id: 2, name: 'Guías Académicas', slug: 'guias-academicas', description: 'Guías educativas', document_count: 0 },
            { id: 3, name: 'Recursos Didácticos', slug: 'recursos-didacticos', description: 'Materiales de apoyo', document_count: 0 },
            { id: 4, name: 'Documentos Administrativos', slug: 'administrativos', description: 'Documentos oficiales', document_count: 0 },
            { id: 5, name: 'Normatividad', slug: 'normatividad', description: 'Reglamentos y normas', document_count: 0 }
        ];

        res.json({
            success: true,
            categories: defaultCategories,
            total: defaultCategories.length,
            note: 'Usando categorías por defecto'
        });
    } finally {
        client.release();
    }
});

/**
 * POST /api/digital-library/categories
 * Crear nueva categoría
 */
router.post('/categories', authenticateToken, async (req, res) => {
    // Solo admins pueden crear categorías
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden crear categorías' });
    }

    const client = await pool.connect();
    try {
        const { name, slug, description, icon, parent_id } = req.body;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Nombre y slug son requeridos' });
        }

        const result = await client.query(`
            INSERT INTO library_categories (name, slug, description, icon, parent_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [name, slug, description, icon, parent_id]);

        res.status(201).json({
            success: true,
            category: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al crear categoría', sanitizeError(error, 'digital-library'));
        if (error.code === '23505') { // Unique violation
            res.status(409).json({ error: 'Ya existe una categoría con ese slug' });
        } else {
            res.status(500).json({ error: 'Error al crear categoría' });
        }
    } finally {
        client.release();
    }
});

/**
 * PUT /api/digital-library/categories/:id
 * Actualizar categoría
 */
router.put('/categories/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden actualizar categorías' });
    }

    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, slug, description, icon, parent_id } = req.body;

        const result = await client.query(`
            UPDATE library_categories
            SET name = COALESCE($1, name),
                slug = COALESCE($2, slug),
                description = COALESCE($3, description),
                icon = COALESCE($4, icon),
                parent_id = COALESCE($5, parent_id)
            WHERE id = $6
            RETURNING *
        `, [name, slug, description, icon, parent_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            success: true,
            category: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al actualizar categoría', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al actualizar categoría' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/digital-library/categories/:id
 * Eliminar categoría (solo si no tiene documentos)
 */
router.delete('/categories/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden eliminar categorías' });
    }

    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Verificar que no tenga documentos
        const docCount = await client.query(
            'SELECT COUNT(*) as count FROM library_documents WHERE category_id = $1',
            [id]
        );

        if (parseInt(docCount.rows[0].count) > 0) {
            return res.status(409).json({
                error: 'No se puede eliminar una categoría que contiene documentos'
            });
        }

        const result = await client.query(
            'DELETE FROM library_categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al eliminar categoría', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al eliminar categoría' });
    } finally {
        client.release();
    }
});

// ============================================
// DOCUMENTOS
// ============================================

/**
 * GET /api/digital-library/documents
 * Listar documentos con filtros y paginación
 */
router.get('/documents', async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            category_id,
            document_type,
            is_featured,
            is_published,
            page = 1,
            limit = 20,
            sort_by = 'created_at',
            sort_order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        // Usar rol del usuario autenticado, o 'estudiante' como default
        const userRole = req.user ? req.user.role : 'estudiante';

        let query = `
            SELECT * FROM v_library_documents_full
            WHERE EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = v_library_documents_full.id
                AND role = $1
                AND can_view = TRUE
            )
        `;
        const params = [userRole];
        let paramCount = 1;

        if (category_id) {
            paramCount++;
            query += ` AND category_id = $${paramCount}`;
            params.push(category_id);
        }

        if (document_type) {
            paramCount++;
            query += ` AND document_type = $${paramCount}`;
            params.push(document_type);
        }

        if (is_featured !== undefined) {
            paramCount++;
            query += ` AND is_featured = $${paramCount}`;
            params.push(is_featured === 'true');
        }

        if (is_published !== undefined) {
            paramCount++;
            query += ` AND is_published = $${paramCount}`;
            params.push(is_published === 'true');
        }

        const allowedSortFields = ['created_at', 'title', 'total_downloads', 'total_views', 'avg_rating'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${sortField} ${sortDirection}`;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await client.query(query, params);

        // Contar total
        let countQuery = `
            SELECT COUNT(*) as total FROM library_documents d
            WHERE EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = d.id
                AND role = $1
                AND can_view = TRUE
            )
        `;
        const countParams = [userRole];
        let countParamCount = 1;

        if (category_id) {
            countParamCount++;
            countQuery += ` AND category_id = $${countParamCount}`;
            countParams.push(category_id);
        }
        if (document_type) {
            countParamCount++;
            countQuery += ` AND document_type = $${countParamCount}`;
            countParams.push(document_type);
        }
        if (is_featured !== undefined) {
            countParamCount++;
            countQuery += ` AND is_featured = $${countParamCount}`;
            countParams.push(is_featured === 'true');
        }
        if (is_published !== undefined) {
            countParamCount++;
            countQuery += ` AND is_published = $${countParamCount}`;
            countParams.push(is_published === 'true');
        }

        const countResult = await client.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            documents: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        // Fallback: Documentos vacíos si la vista no existe
        debugLog.warn('digital-library', 'Vista v_library_documents_full no existe, usando fallback', error.message);

        res.json({
            success: true,
            documents: [],
            pagination: {
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20,
                total: 0,
                totalPages: 0
            },
            note: 'Base de datos aún no contiene documentos'
        });
    } finally {
        client.release();
    }
});

/**
 * GET /api/digital-library/documents/:id
 * Obtener documento específico con detalles completos
 */
router.get('/documents/:id', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await client.query(`
            SELECT * FROM v_library_documents_full WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const document = result.rows[0];

        // Incrementar contador de vistas
        await client.query(
            'UPDATE library_documents SET total_views = total_views + 1 WHERE id = $1',
            [id]
        );

        // Verificar si el usuario tiene el documento en favoritos
        const favoriteCheck = await client.query(`
            SELECT id FROM library_favorites
            WHERE document_id = $1 AND user_id = $2 AND user_role = $3
        `, [id, userId, userRole]);

        document.is_favorite = favoriteCheck.rows.length > 0;

        // Obtener rating del usuario
        const userRating = await client.query(`
            SELECT rating FROM library_document_ratings
            WHERE document_id = $1 AND user_id = $2 AND user_role = $3
        `, [id, userId, userRole]);

        document.user_rating = userRating.rows.length > 0 ? userRating.rows[0].rating : null;

        res.json({
            success: true,
            document: document
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener documento', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener documento' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/digital-library/documents
 * Crear nuevo documento
 */
router.post('/documents', authenticateToken, upload.single('file'), async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Se requiere un archivo' });
        }

        const {
            title,
            slug,
            description,
            category_id,
            document_type,
            is_published,
            is_featured,
            tags
        } = req.body;

        if (!title || !slug || !category_id || !document_type) {
            return res.status(400).json({
                error: 'Título, slug, categoría y tipo de documento son requeridos'
            });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        // Calcular hash del archivo
        const fileBuffer = await fs.readFile(req.file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        await client.query('BEGIN');

        // Crear documento
        const docResult = await client.query(`
            INSERT INTO library_documents (
                title, slug, description, category_id,
                author_id, author_role, author_name,
                document_type, is_published, is_featured
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            title, slug, description, category_id,
            userId, userRole, userName,
            document_type,
            is_published === 'true',
            is_featured === 'true'
        ]);

        const document = docResult.rows[0];

        // Crear primera versión
        const versionResult = await client.query(`
            INSERT INTO library_document_versions (
                document_id, version_number, version_notes,
                file_name, file_path, file_size, file_hash,
                mime_type, is_current
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
            RETURNING *
        `, [
            document.id,
            '1.0',
            'Versión inicial',
            req.file.originalname,
            req.file.path,
            req.file.size,
            fileHash,
            req.file.mimetype
        ]);

        const version = versionResult.rows[0];

        // Actualizar documento con versión actual
        await client.query(`
            UPDATE library_documents
            SET current_version_id = $1, current_version_number = $2
            WHERE id = $3
        `, [version.id, version.version_number, document.id]);

        // Configurar permisos por defecto
        const defaultPermissions = [
            { role: 'admin', can_view: true, can_download: true, can_comment: true, can_edit: true },
            { role: 'teacher', can_view: true, can_download: true, can_comment: true, can_edit: false },
            { role: 'student', can_view: true, can_download: true, can_comment: false, can_edit: false },
            { role: 'parent', can_view: true, can_download: true, can_comment: false, can_edit: false },
            { role: 'public', can_view: false, can_download: false, can_comment: false, can_edit: false }
        ];

        for (const perm of defaultPermissions) {
            await client.query(`
                INSERT INTO library_document_permissions (
                    document_id, role, can_view, can_download, can_comment, can_edit
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [document.id, perm.role, perm.can_view, perm.can_download, perm.can_comment, perm.can_edit]);
        }

        // Procesar tags si se proporcionaron
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : JSON.parse(tags);
            for (const tagName of tagArray) {
                // Buscar o crear tag
                const tagResult = await client.query(`
                    INSERT INTO library_tags (name, slug)
                    VALUES ($1, $2)
                    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                `, [tagName, tagName.toLowerCase().replace(/\s+/g, '-')]);

                // Asociar tag con documento
                await client.query(`
                    INSERT INTO library_document_tags (document_id, tag_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [document.id, tagResult.rows[0].id]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            document: {
                ...document,
                current_version: version
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('digital-library', 'Error al crear documento', sanitizeError(error, 'digital-library'));

        // Eliminar archivo subido si hubo error
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        if (error.code === '23505') {
            res.status(409).json({ error: 'Ya existe un documento con ese slug' });
        } else {
            res.status(500).json({ error: 'Error al crear documento' });
        }
    } finally {
        client.release();
    }
});

/**
 * PUT /api/digital-library/documents/:id
 * Actualizar documento
 */
router.put('/documents/:id', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const {
            title,
            slug,
            description,
            category_id,
            document_type,
            is_published,
            is_featured
        } = req.body;

        const result = await client.query(`
            UPDATE library_documents
            SET title = COALESCE($1, title),
                slug = COALESCE($2, slug),
                description = COALESCE($3, description),
                category_id = COALESCE($4, category_id),
                document_type = COALESCE($5, document_type),
                is_published = COALESCE($6, is_published),
                is_featured = COALESCE($7, is_featured)
            WHERE id = $8
            RETURNING *
        `, [title, slug, description, category_id, document_type, is_published, is_featured, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({
            success: true,
            document: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al actualizar documento', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al actualizar documento' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/digital-library/documents/:id
 * Eliminar documento (soft delete)
 */
router.delete('/documents/:id', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(`
            UPDATE library_documents
            SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({
            success: true,
            message: 'Documento eliminado exitosamente'
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al eliminar documento', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al eliminar documento' });
    } finally {
        client.release();
    }
});

// ============================================
// VERSIONES DE DOCUMENTOS
// ============================================

/**
 * GET /api/digital-library/documents/:id/versions
 * Listar versiones de un documento
 */
router.get('/documents/:id/versions', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        const result = await client.query(`
            SELECT * FROM library_document_versions
            WHERE document_id = $1
            ORDER BY created_at DESC
        `, [id]);

        res.json({
            success: true,
            versions: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener versiones', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener versiones' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/digital-library/documents/:id/versions
 * Subir nueva versión de documento
 */
router.post('/documents/:id/versions', authenticateToken, checkDocumentPermission, upload.single('file'), async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Se requiere un archivo' });
        }

        const { id } = req.params;
        const { version_number, version_notes } = req.body;

        if (!version_number) {
            return res.status(400).json({ error: 'Se requiere número de versión' });
        }

        // Calcular hash del archivo
        const fileBuffer = await fs.readFile(req.file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        await client.query('BEGIN');

        // Marcar versiones anteriores como no actuales
        await client.query(`
            UPDATE library_document_versions
            SET is_current = FALSE
            WHERE document_id = $1
        `, [id]);

        // Crear nueva versión
        const result = await client.query(`
            INSERT INTO library_document_versions (
                document_id, version_number, version_notes,
                file_name, file_path, file_size, file_hash,
                mime_type, is_current
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
            RETURNING *
        `, [
            id,
            version_number,
            version_notes,
            req.file.originalname,
            req.file.path,
            req.file.size,
            fileHash,
            req.file.mimetype
        ]);

        const version = result.rows[0];

        // Actualizar documento
        await client.query(`
            UPDATE library_documents
            SET current_version_id = $1,
                current_version_number = $2,
                total_versions = total_versions + 1
            WHERE id = $3
        `, [version.id, version_number, id]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            version: version
        });
    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('digital-library', 'Error al crear versión', sanitizeError(error, 'digital-library'));

        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }

        if (error.code === '23505') {
            res.status(409).json({ error: 'Ya existe una versión con ese número' });
        } else {
            res.status(500).json({ error: 'Error al crear versión' });
        }
    } finally {
        client.release();
    }
});

/**
 * GET /api/digital-library/documents/:id/download
 * Descargar documento (versión actual o específica)
 */
router.get('/documents/:id/download', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { version_id } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Obtener versión a descargar
        let versionQuery = `
            SELECT v.*, d.title
            FROM library_document_versions v
            JOIN library_documents d ON v.document_id = d.id
            WHERE v.document_id = $1
        `;
        const params = [id];

        if (version_id) {
            versionQuery += ' AND v.id = $2';
            params.push(version_id);
        } else {
            versionQuery += ' AND v.is_current = TRUE';
        }

        const versionResult = await client.query(versionQuery, params);

        if (versionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Versión no encontrada' });
        }

        const version = versionResult.rows[0];

        // Verificar que el archivo existe
        try {
            await fs.access(version.file_path);
        } catch {
            return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
        }

        // Registrar descarga
        await client.query(`
            INSERT INTO library_download_history (
                document_id, version_id, user_id, user_role, user_name
            ) VALUES ($1, $2, $3, $4, $5)
        `, [id, version.id, userId, userRole, req.user.name || req.user.email]);

        // Incrementar contador
        await client.query(
            'UPDATE library_documents SET total_downloads = total_downloads + 1 WHERE id = $1',
            [id]
        );

        // Enviar archivo
        res.download(version.file_path, version.file_name, (err) => {
            if (err) {
                debugLog.error('digital-library', 'Error al enviar archivo:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al descargar archivo' });
                }
            }
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al descargar documento', sanitizeError(error, 'digital-library'));
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error al descargar documento' });
        }
    } finally {
        client.release();
    }
});

// ============================================
// FAVORITOS
// ============================================

/**
 * POST /api/digital-library/documents/:id/favorite
 * Agregar documento a favoritos
 */
router.post('/documents/:id/favorite', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        await client.query(`
            INSERT INTO library_favorites (document_id, user_id, user_role, user_name)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (document_id, user_id, user_role) DO NOTHING
        `, [id, userId, userRole, userName]);

        res.json({
            success: true,
            message: 'Documento agregado a favoritos'
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al agregar favorito', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al agregar favorito' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/digital-library/documents/:id/favorite
 * Quitar documento de favoritos
 */
router.delete('/documents/:id/favorite', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        await client.query(`
            DELETE FROM library_favorites
            WHERE document_id = $1 AND user_id = $2 AND user_role = $3
        `, [id, userId, userRole]);

        res.json({
            success: true,
            message: 'Documento eliminado de favoritos'
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al eliminar favorito', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al eliminar favorito' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/digital-library/favorites
 * Listar favoritos del usuario
 */
router.get('/favorites', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await client.query(`
            SELECT d.*, f.created_at as favorited_at
            FROM library_favorites f
            JOIN v_library_documents_full d ON f.document_id = d.id
            WHERE f.user_id = $1 AND f.user_role = $2
            ORDER BY f.created_at DESC
            LIMIT $3 OFFSET $4
        `, [userId, userRole, limit, offset]);

        const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM library_favorites
            WHERE user_id = $1 AND user_role = $2
        `, [userId, userRole]);

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            favorites: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener favoritos', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener favoritos' });
    } finally {
        client.release();
    }
});

// ============================================
// CALIFICACIONES (RATINGS)
// ============================================

/**
 * POST /api/digital-library/documents/:id/rating
 * Calificar documento
 */
router.post('/documents/:id/rating', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'La calificación debe estar entre 1 y 5' });
        }

        const result = await client.query(`
            INSERT INTO library_document_ratings (
                document_id, user_id, user_role, user_name, rating, comment
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (document_id, user_id, user_role)
            DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
            RETURNING *
        `, [id, userId, userRole, userName, rating, comment]);

        res.json({
            success: true,
            rating: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al calificar documento', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al calificar documento' });
    } finally {
        client.release();
    }
});

// ============================================
// COMENTARIOS
// ============================================

/**
 * GET /api/digital-library/documents/:id/comments
 * Listar comentarios de un documento
 */
router.get('/documents/:id/comments', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await client.query(`
            SELECT * FROM library_document_comments
            WHERE document_id = $1 AND parent_comment_id IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [id, limit, offset]);

        // Obtener respuestas para cada comentario
        for (let comment of result.rows) {
            const replies = await client.query(`
                SELECT * FROM library_document_comments
                WHERE parent_comment_id = $1
                ORDER BY created_at ASC
            `, [comment.id]);
            comment.replies = replies.rows;
        }

        const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM library_document_comments
            WHERE document_id = $1 AND parent_comment_id IS NULL
        `, [id]);

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            comments: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener comentarios', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener comentarios' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/digital-library/documents/:id/comments
 * Crear comentario
 */
router.post('/documents/:id/comments', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { content, parent_comment_id } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        const userName = req.user.name || req.user.email;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'El contenido del comentario es requerido' });
        }

        const result = await client.query(`
            INSERT INTO library_document_comments (
                document_id, user_id, user_role, user_name, content, parent_comment_id
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [id, userId, userRole, userName, content.trim(), parent_comment_id]);

        res.status(201).json({
            success: true,
            comment: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al crear comentario', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al crear comentario' });
    } finally {
        client.release();
    }
});

/**
 * PUT /api/digital-library/comments/:id
 * Actualizar comentario
 */
router.put('/comments/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'El contenido del comentario es requerido' });
        }

        const result = await client.query(`
            UPDATE library_document_comments
            SET content = $1, is_edited = TRUE
            WHERE id = $2 AND user_id = $3 AND user_role = $4
            RETURNING *
        `, [content.trim(), id, userId, userRole]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comentario no encontrado o no autorizado' });
        }

        res.json({
            success: true,
            comment: result.rows[0]
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al actualizar comentario', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al actualizar comentario' });
    } finally {
        client.release();
    }
});

/**
 * DELETE /api/digital-library/comments/:id
 * Eliminar comentario
 */
router.delete('/comments/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const result = await client.query(`
            DELETE FROM library_document_comments
            WHERE id = $1 AND (user_id = $2 AND user_role = $3 OR $4 = 'admin')
            RETURNING *
        `, [id, userId, userRole, userRole]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comentario no encontrado o no autorizado' });
        }

        res.json({
            success: true,
            message: 'Comentario eliminado exitosamente'
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al eliminar comentario', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al eliminar comentario' });
    } finally {
        client.release();
    }
});

// ============================================
// BÚSQUEDA
// ============================================

/**
 * GET /api/digital-library/search
 * Búsqueda full-text de documentos
 */
router.get('/search', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { q, page = 1, limit = 20 } = req.query;
        const userRole = req.user.role;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
        }

        const offset = (page - 1) * limit;

        const result = await client.query(`
            SELECT d.*,
                   ts_rank(to_tsvector('spanish', d.title || ' ' || COALESCE(d.description, '')),
                           plainto_tsquery('spanish', $1)) as rank
            FROM library_documents d
            WHERE to_tsvector('spanish', d.title || ' ' || COALESCE(d.description, ''))
                  @@ plainto_tsquery('spanish', $1)
            AND EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = d.id AND role = $2 AND can_view = TRUE
            )
            AND d.is_deleted = FALSE
            ORDER BY rank DESC, d.created_at DESC
            LIMIT $3 OFFSET $4
        `, [q.trim(), userRole, limit, offset]);

        const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM library_documents d
            WHERE to_tsvector('spanish', d.title || ' ' || COALESCE(d.description, ''))
                  @@ plainto_tsquery('spanish', $1)
            AND EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = d.id AND role = $2 AND can_view = TRUE
            )
            AND d.is_deleted = FALSE
        `, [q.trim(), userRole]);

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            query: q,
            documents: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error en búsqueda', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error en búsqueda' });
    } finally {
        client.release();
    }
});

// ============================================
// TAGS
// ============================================

/**
 * GET /api/digital-library/tags
 * Listar tags populares
 */
router.get('/tags', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { limit = 50 } = req.query;

        const result = await client.query(`
            SELECT * FROM library_tags
            ORDER BY usage_count DESC, name ASC
            LIMIT $1
        `, [limit]);

        res.json({
            success: true,
            tags: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener tags', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener tags' });
    } finally {
        client.release();
    }
});

/**
 * POST /api/digital-library/documents/:id/tags
 * Asignar tags a documento
 */
router.post('/documents/:id/tags', authenticateToken, checkDocumentPermission, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de tags' });
        }

        await client.query('BEGIN');

        const addedTags = [];

        for (const tagName of tags) {
            // Buscar o crear tag
            const tagResult = await client.query(`
                INSERT INTO library_tags (name, slug)
                VALUES ($1, $2)
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
            `, [tagName, tagName.toLowerCase().replace(/\s+/g, '-')]);

            // Asociar tag con documento
            await client.query(`
                INSERT INTO library_document_tags (document_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `, [id, tagResult.rows[0].id]);

            addedTags.push(tagResult.rows[0]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: `${addedTags.length} tags agregados exitosamente`,
            tags: addedTags
        });
    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('digital-library', 'Error al asignar tags', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al asignar tags' });
    } finally {
        client.release();
    }
});

// ============================================
// DOCUMENTOS DESTACADOS Y RECIENTES
// ============================================

/**
 * GET /api/digital-library/recent
 * Documentos recientes
 */
router.get('/recent', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { limit = 10 } = req.query;
        const userRole = req.user.role;

        const result = await client.query(`
            SELECT * FROM v_library_documents_full
            WHERE EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = v_library_documents_full.id
                AND role = $1
                AND can_view = TRUE
            )
            AND is_published = TRUE
            ORDER BY created_at DESC
            LIMIT $2
        `, [userRole, limit]);

        res.json({
            success: true,
            documents: result.rows
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener documentos recientes', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener documentos recientes' });
    } finally {
        client.release();
    }
});

/**
 * GET /api/digital-library/popular
 * Documentos populares
 */
router.get('/popular', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { limit = 10 } = req.query;
        const userRole = req.user.role;

        const result = await client.query(`
            SELECT * FROM v_library_documents_full
            WHERE EXISTS (
                SELECT 1 FROM library_document_permissions
                WHERE document_id = v_library_documents_full.id
                AND role = $1
                AND can_view = TRUE
            )
            AND is_published = TRUE
            ORDER BY total_downloads DESC, total_views DESC
            LIMIT $2
        `, [userRole, limit]);

        res.json({
            success: true,
            documents: result.rows
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener documentos populares', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener documentos populares' });
    } finally {
        client.release();
    }
});

// ============================================
// HISTORIAL DE DESCARGAS
// ============================================

/**
 * GET /api/digital-library/history
 * Historial de descargas del usuario
 */
router.get('/history', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await client.query(`
            SELECT h.*, d.title, d.slug, d.document_type,
                   v.version_number, v.file_name
            FROM library_download_history h
            JOIN library_documents d ON h.document_id = d.id
            JOIN library_document_versions v ON h.version_id = v.id
            WHERE h.user_id = $1 AND h.user_role = $2
            ORDER BY h.downloaded_at DESC
            LIMIT $3 OFFSET $4
        `, [userId, userRole, limit, offset]);

        const countResult = await client.query(`
            SELECT COUNT(*) as total
            FROM library_download_history
            WHERE user_id = $1 AND user_role = $2
        `, [userId, userRole]);

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            history: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        debugLog.error('digital-library', 'Error al obtener historial', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al obtener historial' });
    } finally {
        client.release();
    }
});

// ============================================
// PERMISOS
// ============================================

/**
 * POST /api/digital-library/documents/:id/permissions
 * Configurar permisos de un documento
 */
router.post('/documents/:id/permissions', authenticateToken, async (req, res) => {
    // Solo admins o autores pueden modificar permisos
    if (req.user.role !== 'admin' && !req.isDocumentAuthor) {
        return res.status(403).json({ error: 'No tienes permisos para modificar permisos' });
    }

    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'Se requiere un array de permisos' });
        }

        await client.query('BEGIN');

        for (const perm of permissions) {
            await client.query(`
                INSERT INTO library_document_permissions (
                    document_id, role, can_view, can_download, can_comment, can_edit
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (document_id, role)
                DO UPDATE SET
                    can_view = EXCLUDED.can_view,
                    can_download = EXCLUDED.can_download,
                    can_comment = EXCLUDED.can_comment,
                    can_edit = EXCLUDED.can_edit
            `, [
                id,
                perm.role,
                perm.can_view || false,
                perm.can_download || false,
                perm.can_comment || false,
                perm.can_edit || false
            ]);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Permisos actualizados exitosamente'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        debugLog.error('digital-library', 'Error al actualizar permisos', sanitizeError(error, 'digital-library'));
        res.status(500).json({ error: 'Error al actualizar permisos' });
    } finally {
        client.release();
    }
});

module.exports = router;
