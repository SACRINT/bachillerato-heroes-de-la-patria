/**
 * 📰 API CRUD PARA NOTICIAS - PostgreSQL
 * Sistema de gestión de noticias del CMS
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const NoticiasDAO = require('../data/noticias.dao');
const { body, validationResult } = require('express-validator');
const { cacheMiddleware, TTL_CONFIG } = require('../middleware/cache');
const { softDelete } = require('../data/soft-delete-helpers');

// Función para generar slug
function generateSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, '-') // Reemplazar espacios con guiones
        .replace(/-+/g, '-') // Remover guiones múltiples
        .substring(0, 300); // Limitar longitud
}

// =====================================================
// POST /api/noticias - Crear nueva noticia
// =====================================================
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('contenido').trim().notEmpty().withMessage('Contenido requerido'),
    body('autor').trim().notEmpty().withMessage('Autor requerido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        titulo,
        contenido,
        resumen,
        imagen_url,
        categoria,
        etiquetas,
        estado,
        autor,
        autor_id,
        meta_descripcion,
        destacada
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // Generar slug único
        let slug = generateSlug(titulo);

        // ✅ FASE 3: Using NoticiasDAO
        const slugExists = await NoticiasDAO.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }

        const noticia = await NoticiasDAO.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });

        debugLog.log('NOTICIAS', '✅ Nueva noticia creada:', noticia.id);

        res.status(201).json({
            success: true,
            message: 'Noticia creada exitosamente',
            data: noticia
        });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al crear noticia:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al crear la noticia'
        });
    }
});

// =====================================================
// GET /api/noticias - Listar todas las noticias
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using NoticiasDAO
        const { noticias, total } = await NoticiasDAO.getAll({ estado, categoria, destacada, limit, offset });

        res.json({
            success: true,
            data: noticias,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticias:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener noticias'
        });
    }
});

// =====================================================
// GET /api/noticias/stats - Estadísticas (con caché)
// =====================================================
router.get('/stats', cacheMiddleware({ ttl: TTL_CONFIG.stats }), async (req, res) => {
    try {
        // ✅ FASE 3: Using NoticiasDAO
        const stats = await NoticiasDAO.getStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/noticias/:id - Obtener una noticia
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using NoticiasDAO
        const noticia = await NoticiasDAO.getById(id);

        if (!noticia) {
            return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
        }

        await NoticiasDAO.incrementViews(id, 'id');

        res.json({ success: true, data: noticia });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la noticia'
        });
    }
});

// =====================================================
// GET /api/noticias/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        // ✅ FASE 3: Using NoticiasDAO
        const noticia = await NoticiasDAO.getBySlug(slug);

        if (!noticia) {
            return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
        }

        await NoticiasDAO.incrementViews(slug, 'slug');

        res.json({ success: true, data: noticia });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la noticia'
        });
    }
});

// =====================================================
// PUT /api/noticias/:id - Actualizar noticia
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        titulo,
        contenido,
        resumen,
        imagen_url,
        categoria,
        etiquetas,
        estado,
        meta_descripcion,
        destacada
    } = req.body;

    try {
        // ✅ FASE 3: Using NoticiasDAO
        const noticia = await NoticiasDAO.update(id, {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, meta_descripcion, destacada
        });

        if (!noticia) {
            return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
        }

        debugLog.log('NOTICIAS', `✅ Noticia ${id} actualizada`);

        res.json({
            success: true,
            message: 'Noticia actualizada correctamente',
            data: noticia
        });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al actualizar noticia:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la noticia'
        });
    }
});

// =====================================================
// DELETE /api/noticias/:id - Eliminar noticia (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await softDelete('noticias', id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Noticia no encontrada o ya eliminada'
            });
        }

        debugLog.log('NOTICIAS', `🗑️ Noticia ${id} eliminada (soft delete)`);

        res.json({
            success: true,
            message: 'Noticia eliminada correctamente'
        });

    } catch (error) {
        debugLog.error('NOTICIAS', '❌ Error al eliminar noticia:', sanitizeError(error, 'noticias'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la noticia'
        });
    }
});

module.exports = router;
