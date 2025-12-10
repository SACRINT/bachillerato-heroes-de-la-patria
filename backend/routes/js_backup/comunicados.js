/**
 * 📰 API CRUD PARA NOTICIAS - PostgreSQL
 * Sistema de gestión de comunicados del CMS
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const ComunicadosDAO = require('../data/comunicados.dao');
const { body, validationResult } = require('express-validator');

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
// POST /api/comunicados - Crear nueva comunicado
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
        let slug = generateSlug(titulo);

        // ✅ FASE 3: Using ComunicadosDAO
        const slugExists = await ComunicadosDAO.slugExists(slug);
        if (slugExists) slug = `${slug}-${Date.now()}`;

        const comunicado = await ComunicadosDAO.create({
            titulo, contenido, resumen, imagen_url, categoria, etiquetas,
            estado, autor, autor_id, slug, meta_descripcion, destacada,
            ip_address, user_agent
        });

        debugLog.log('COMUNICADOS', '✅ Nueva comunicado creada:', comunicado.id);

        res.status(201).json({
            success: true,
            message: 'Comunicado creada exitosamente',
            data: comunicado
        });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al crear comunicado:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al crear la comunicado'
        });
    }
});

// =====================================================
// GET /api/comunicados - Listar todas las comunicados
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using ComunicadosDAO
        const { comunicados, total } = await ComunicadosDAO.getAll({ estado, categoria, destacada, limit, offset });

        res.json({
            success: true,
            data: comunicados,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicados:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener comunicados'
        });
    }
});

// =====================================================
// GET /api/comunicados/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using ComunicadosDAO
        const stats = await ComunicadosDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/comunicados/:id - Obtener una comunicado
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using ComunicadosDAO
        const comunicado = await ComunicadosDAO.getById(id);
        if (!comunicado) return res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
        await ComunicadosDAO.incrementViews(id, 'id');
        res.json({ success: true, data: comunicado });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la comunicado'
        });
    }
});

// =====================================================
// GET /api/comunicados/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        // ✅ FASE 3: Using ComunicadosDAO
        const comunicado = await ComunicadosDAO.getBySlug(slug);
        if (!comunicado) return res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
        await ComunicadosDAO.incrementViews(slug, 'slug');
        res.json({ success: true, data: comunicado });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la comunicado'
        });
    }
});

// =====================================================
// PUT /api/comunicados/:id - Actualizar comunicado
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
        // ✅ FASE 3: Using ComunicadosDAO
        const comunicado = await ComunicadosDAO.update(id, {
            titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada
        });

        if (!comunicado) return res.status(404).json({ success: false, error: 'Comunicado no encontrada' });

        debugLog.log('COMUNICADOS', `✅ Comunicado ${id} actualizada`);
        res.json({ success: true, message: 'Comunicado actualizada correctamente', data: comunicado });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al actualizar comunicado:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la comunicado'
        });
    }
});

// =====================================================
// DELETE /api/comunicados/:id - Eliminar comunicado
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using ComunicadosDAO
        const result = await ComunicadosDAO.archive(id);
        if (!result) return res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
        res.json({ success: true, message: 'Comunicado archivada correctamente' });

    } catch (error) {
        debugLog.error('COMUNICADOS', '❌ Error al archivar comunicado:', sanitizeError(error, 'comunicados'));
        res.status(500).json({
            success: false,
            error: 'Error al archivar la comunicado'
        });
    }
});

module.exports = router;
