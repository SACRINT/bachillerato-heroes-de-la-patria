/**
 * 📅 API CRUD PARA EVENTOS - PostgreSQL
 * Sistema de gestión de eventos del CMS
 * Fecha: 18 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const EventosDAO = require('../data/eventos.dao');
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
// POST /api/eventos - Crear nuevo evento
// =====================================================
router.post('/', [
    body('titulo').trim().notEmpty().withMessage('Título requerido'),
    body('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    body('fecha_inicio').trim().notEmpty().withMessage('Fecha de inicio requerida')
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
        descripcion,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        modalidad,
        link_virtual,
        categoria,
        tipo,
        etiquetas,
        estado,
        organizador,
        organizador_id,
        contacto_email,
        contacto_telefono,
        capacidad_maxima,
        inscripciones_abiertas,
        requiere_inscripcion,
        destacado
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        let slug = generateSlug(titulo);

        // ✅ FASE 3: Using EventosDAO
        const slugExists = await EventosDAO.slugExists(slug);
        if (slugExists) slug = `${slug}-${Date.now()}`;

        const evento = await EventosDAO.create({
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin,
            ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, organizador_id, contacto_email, contacto_telefono,
            capacidad_maxima, inscripciones_abiertas, requiere_inscripcion,
            slug, destacado, ip_address, user_agent
        });

        debugLog.log('EVENTOS', '✅ Nuevo evento creado:', evento.id);

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            data: evento
        });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al crear evento:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al crear el evento'
        });
    }
});

// =====================================================
// GET /api/eventos - Listar todos los eventos
// =====================================================
router.get('/', async (req, res) => {
    const { estado, categoria, modalidad, destacado, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using EventosDAO
        const { eventos, total } = await EventosDAO.getAll({ estado, categoria, modalidad, destacado, limit, offset });

        res.json({
            success: true,
            data: eventos,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener eventos:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener eventos'
        });
    }
});

// =====================================================
// GET /api/eventos/stats - Estadísticas (con caché)
// =====================================================
router.get('/stats', cacheMiddleware({ ttl: TTL_CONFIG.stats }), async (req, res) => {
    try {
        // ✅ FASE 3: Using EventosDAO
        const stats = await EventosDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/eventos/:id - Obtener un evento
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using EventosDAO
        const evento = await EventosDAO.getById(id);
        if (!evento) return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        res.json({ success: true, data: evento });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener evento:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener el evento'
        });
    }
});

// =====================================================
// GET /api/eventos/slug/:slug - Obtener por slug
// =====================================================
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        // ✅ FASE 3: Using EventosDAO
        const evento = await EventosDAO.getBySlug(slug);
        if (!evento) return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        res.json({ success: true, data: evento });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al obtener evento:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener el evento'
        });
    }
});

// =====================================================
// PUT /api/eventos/:id - Actualizar evento
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        titulo,
        descripcion,
        imagen_url,
        fecha_inicio,
        fecha_fin,
        ubicacion,
        modalidad,
        link_virtual,
        categoria,
        tipo,
        etiquetas,
        estado,
        organizador,
        contacto_email,
        contacto_telefono,
        capacidad_maxima,
        inscripciones_abiertas,
        requiere_inscripcion,
        destacado
    } = req.body;

    try {
        // ✅ FASE 3: Using EventosDAO
        const evento = await EventosDAO.update(id, {
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
            modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, contacto_email, contacto_telefono, capacidad_maxima,
            inscripciones_abiertas, requiere_inscripcion, destacado
        });

        if (!evento) return res.status(404).json({ success: false, error: 'Evento no encontrado' });

        debugLog.log('EVENTOS', `✅ Evento ${id} actualizado`);
        res.json({ success: true, message: 'Evento actualizado correctamente', data: evento });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al actualizar evento:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el evento'
        });
    }
});

// =====================================================
// DELETE /api/eventos/:id - Eliminar evento (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await softDelete('eventos', id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Evento no encontrado o ya eliminado'
            });
        }

        debugLog.log('EVENTOS', `🗑️ Evento ${id} eliminado (soft delete)`);

        res.json({
            success: true,
            message: 'Evento eliminado correctamente'
        });

    } catch (error) {
        debugLog.error('EVENTOS', '❌ Error al eliminar evento:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el evento'
        });
    }
});

/**
 * GET /api/eventos/calendar
 * Obtener eventos en formato FullCalendar
 */
router.get('/calendar', async (req, res) => {
    try {
        const { start, end, categoria, modalidad } = req.query;

        // ✅ FASE 3: Using EventosDAO
        const rows = await EventosDAO.getCalendarEvents({ start, end, categoria, modalidad });

        const events = rows.map(evento => ({
            id: evento.id, title: evento.title, start: evento.start, end: evento.end,
            description: evento.descripcion,
            extendedProps: {
                categoria: evento.categoria, modalidad: evento.modalidad, ubicacion: evento.ubicacion,
                cupoMaximo: evento.cupo_maximo, inscripciones: evento.inscripciones_actuales,
                destacado: evento.destacado, slug: evento.slug
            },
            backgroundColor: evento.color_hex || '#3788d8',
            borderColor: evento.color_hex || '#3788d8', textColor: '#ffffff'
        }));

        res.json({ success: true, events });
    } catch (error) {
        debugLog.error('EVENTOS', 'Error en /calendar:', sanitizeError(error, 'eventos'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener eventos para calendario'
        });
    }
});

module.exports = router;
