/**
 * 🎯 FASE 2A - CMS ROUTES
 * Sistema de gestión de contenido para BGE
 * Funciones CRUD para avisos, noticias, eventos y comunicados
 */

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

// Importar servicios
const cmsService = require('../services/cmsService');
const uploadService = require('../services/uploadService');

// ============================================
// MIDDLEWARE DE CMS
// ============================================

// Verificar permisos de administrador para operaciones de escritura
const requireAdmin = requireRole(['admin', 'director', 'coordinador']);

// ============================================
// RUTAS DE CONTENIDO - CRUD COMPLETO
// ============================================

/**
 * @swagger
 * /api/cms/content:
 *   get:
 *     summary: Obtener lista de contenido
 *     tags: [CMS]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [aviso, noticia, evento, comunicado]
 *         description: Filtrar por tipo de contenido
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrador, publicado, archivado]
 *         description: Filtrar por estado
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [baja, media, alta, urgente]
 *         description: Filtrar por prioridad
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset para paginación
 *     responses:
 *       200:
 *         description: Lista de contenido obtenida exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.get('/content', async (req, res) => {
    try {
        const {
            type,
            status = 'publicado',
            priority,
            limit = 10,
            offset = 0,
            search
        } = req.query;

        const filters = {
            type,
            status,
            priority,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const result = await cmsService.getContent(filters);

        res.json({
            success: true,
            data: result.content,
            total: result.total,
            pagination: {
                limit: filters.limit,
                offset: filters.offset,
                total: result.total,
                pages: Math.ceil(result.total / filters.limit)
            }
        });
    } catch (error) {
        console.error('Error obteniendo contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/{id}:
 *   get:
 *     summary: Obtener contenido específico por ID
 *     tags: [CMS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del contenido
 *     responses:
 *       200:
 *         description: Contenido obtenido exitosamente
 *       404:
 *         description: Contenido no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/content/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const content = await cmsService.getContentById(id);

        if (!content) {
            return res.status(404).json({
                success: false,
                error: 'Contenido no encontrado'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Error obteniendo contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content:
 *   post:
 *     summary: Crear nuevo contenido
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [aviso, noticia, evento, comunicado]
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               image_url:
 *                 type: string
 *                 maxLength: 500
 *               priority:
 *                 type: string
 *                 enum: [baja, media, alta, urgente]
 *                 default: media
 *               status:
 *                 type: string
 *                 enum: [borrador, publicado, archivado]
 *                 default: borrador
 *               publish_date:
 *                 type: string
 *                 format: date-time
 *               expire_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Contenido creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 */
router.post('/content', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const {
            type,
            title,
            content,
            image_url,
            priority = 'media',
            status = 'borrador',
            publish_date,
            expire_date,
            metadata
        } = req.body;

        // Validaciones
        if (!type || !title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos faltantes',
                required: ['type', 'title', 'content']
            });
        }

        const validTypes = ['aviso', 'noticia', 'evento', 'comunicado'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de contenido inválido',
                validTypes
            });
        }

        const contentData = {
            type,
            title: title.trim(),
            content: content.trim(),
            image_url,
            priority,
            status,
            author_id: req.user.id,
            publish_date: publish_date || new Date(),
            expire_date,
            metadata: metadata ? JSON.stringify(metadata) : null
        };

        const newContent = await cmsService.createContent(contentData);

        res.status(201).json({
            success: true,
            message: 'Contenido creado exitosamente',
            data: newContent
        });
    } catch (error) {
        console.error('Error creando contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/{id}:
 *   put:
 *     summary: Actualizar contenido existente
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contenido actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Contenido no encontrado
 */
router.put('/content/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Agregar información de editor
        updateData.updated_by = req.user.id;
        updateData.updated_at = new Date();

        if (updateData.metadata) {
            updateData.metadata = JSON.stringify(updateData.metadata);
        }

        const updatedContent = await cmsService.updateContent(id, updateData);

        if (!updatedContent) {
            return res.status(404).json({
                success: false,
                error: 'Contenido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contenido actualizado exitosamente',
            data: updatedContent
        });
    } catch (error) {
        console.error('Error actualizando contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/{id}:
 *   delete:
 *     summary: Eliminar contenido
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/content/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await cmsService.deleteContent(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Contenido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contenido eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// RUTAS ESPECIALES DE CMS
// ============================================

/**
 * @swagger
 * /api/cms/content/{id}/publish:
 *   patch:
 *     summary: Publicar contenido
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/content/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const published = await cmsService.publishContent(id, req.user.id);

        if (!published) {
            return res.status(404).json({
                success: false,
                error: 'Contenido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contenido publicado exitosamente',
            data: published
        });
    } catch (error) {
        console.error('Error publicando contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/{id}/archive:
 *   patch:
 *     summary: Archivar contenido
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/content/:id/archive', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const archived = await cmsService.archiveContent(id, req.user.id);

        if (!archived) {
            return res.status(404).json({
                success: false,
                error: 'Contenido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Contenido archivado exitosamente',
            data: archived
        });
    } catch (error) {
        console.error('Error archivando contenido:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// ESTADÍSTICAS Y MÉTRICAS DE CMS
// ============================================

/**
 * @swagger
 * /api/cms/stats:
 *   get:
 *     summary: Obtener estadísticas del CMS
 *     tags: [CMS]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await cmsService.getCMSStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/recent:
 *   get:
 *     summary: Obtener contenido reciente
 *     tags: [CMS]
 */
router.get('/content/recent', async (req, res) => {
    try {
        const { limit = 5, type } = req.query;

        const recentContent = await cmsService.getRecentContent({
            limit: parseInt(limit),
            type,
            status: 'publicado'
        });

        res.json({
            success: true,
            data: recentContent
        });
    } catch (error) {
        console.error('Error obteniendo contenido reciente:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/cms/content/urgent:
 *   get:
 *     summary: Obtener contenido urgente
 *     tags: [CMS]
 */
router.get('/content/urgent', async (req, res) => {
    try {
        const urgentContent = await cmsService.getUrgentContent();

        res.json({
            success: true,
            data: urgentContent
        });
    } catch (error) {
        console.error('Error obteniendo contenido urgente:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

module.exports = router;