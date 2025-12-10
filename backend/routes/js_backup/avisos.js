/**
 * 📰 API CRUD PARA NOTICIAS - PostgreSQL
 * Sistema de gestión de avisos del CMS
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const AvisosDAO = require('../data/avisos.dao');
const { body, validationResult } = require('express-validator');
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
// POST /api/avisos - Crear nueva aviso
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

        // Verificar si el slug ya existe
        // ✅ FASE 3: Using AvisosDAO
        const slugExists = await AvisosDAO.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }

        // ✅ FASE 3: Using AvisosDAO
        const aviso = await AvisosDAO.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });

        debugLog.log('AVISOS', '✅ Nueva aviso creada:', aviso.id);

        res.status(201).json({
            success: true,
            message: 'Aviso creada exitosamente',
            data: aviso
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al crear aviso:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al crear la aviso'
        });
    }
});

// =====================================================
// GET /api/avisos - Listar todas las avisos
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using AvisosDAO
        const { avisos, total } = await AvisosDAO.getAll({
            estado, categoria, destacada, limit, offset
        });

        res.json({
            success: true,
            data: avisos,
            total: total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener avisos:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener avisos'
        });
    }
});

// =====================================================
// GET /api/avisos/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using AvisosDAO
        const stats = await AvisosDAO.getStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'avisos'));

        // Si la tabla no existe, devolver datos vacíos en lugar de error
        if (error.code === '42P01') {
            debugLog.log('AVISOS', '⚠️ Tabla "avisos" no existe - devolviendo datos vacíos');
            return res.json({
                success: true,
                data: {
                    total: 0,
                    publicadas: 0,
                    borradores: 0,
                    destacadas: 0,
                    vistas_totales: 0
                }
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/avisos/:id - Obtener una aviso
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using AvisosDAO
        const aviso = await AvisosDAO.getById(id);

        if (!aviso) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        // Incrementar vistas
        await AvisosDAO.incrementViews(id, 'id');

        res.json({
            success: true,
            data: aviso
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener aviso:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la aviso'
        });
    }
});

// =====================================================
// GET /api/avisos/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        // ✅ FASE 3: Using AvisosDAO
        const aviso = await AvisosDAO.getBySlug(slug);

        if (!aviso) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        // Incrementar vistas
        await AvisosDAO.incrementViews(slug, 'slug');

        res.json({
            success: true,
            data: aviso
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al obtener aviso:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la aviso'
        });
    }
});

// =====================================================
// PUT /api/avisos/:id - Actualizar aviso
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
        // ✅ FASE 3: Using AvisosDAO
        const aviso = await AvisosDAO.update(id, {
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, meta_descripcion, destacada
        });

        if (!aviso) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrada'
            });
        }

        debugLog.log('AVISOS', `✅ Aviso ${id} actualizada`);

        res.json({
            success: true,
            message: 'Aviso actualizada correctamente',
            data: aviso
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al actualizar aviso:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la aviso'
        });
    }
});

// =====================================================
// DELETE /api/avisos/:id - Eliminar aviso (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await softDelete('avisos', id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Aviso no encontrado o ya eliminado'
            });
        }

        debugLog.log('AVISOS', `🗑️ Aviso ${id} eliminado (soft delete)`);

        res.json({
            success: true,
            message: 'Aviso eliminado correctamente'
        });

    } catch (error) {
        debugLog.error('AVISOS', '❌ Error al eliminar aviso:', sanitizeError(error, 'avisos'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el aviso'
        });
    }
});

module.exports = router;
