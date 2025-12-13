"use strict";
/**
 * 📅 API CRUD PARA EVENTOS - TypeScript
 * Sistema de gestión de eventos del CMS
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
// ✅ FASE 3: DAO Layer
const eventos_dao_1 = __importDefault(require("../data/eventos.dao"));
const soft_delete_helpers_1 = require("../data/soft-delete-helpers");
const cache_1 = require("../middleware/cache");
const router = express_1.default.Router();
// ============================================
// HELPER FUNCTIONS
// ============================================
function generateSlug(titulo) {
    return titulo
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 300);
}
// ============================================
// ROUTES
// ============================================
/**
 * POST /api/eventos - Crear nuevo evento
 */
router.post('/', [
    (0, express_validator_1.body)('titulo').trim().notEmpty().withMessage('Título requerido'),
    (0, express_validator_1.body)('descripcion').trim().notEmpty().withMessage('Descripción requerida'),
    (0, express_validator_1.body)('fecha_inicio').trim().notEmpty().withMessage('Fecha de inicio requerida')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, organizador, organizador_id, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, destacado } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    try {
        let slug = generateSlug(titulo);
        const slugExists = await eventos_dao_1.default.slugExists(slug);
        if (slugExists)
            slug = `${slug}-${Date.now()}`;
        const evento = await eventos_dao_1.default.create({
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin,
            ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, organizador_id, contacto_email, contacto_telefono,
            capacidad_maxima, inscripciones_abiertas, requiere_inscripcion,
            slug, destacado, ip_address, user_agent
        });
        debug_logger_1.debugLog.log('EVENTOS', '✅ Nuevo evento creado:', evento.id);
        res.status(201).json({ success: true, message: 'Evento creado exitosamente', data: evento });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al crear evento:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al crear el evento' });
    }
});
/**
 * GET /api/eventos - Listar todos
 */
router.get('/', async (req, res) => {
    const { estado, categoria, modalidad, destacado, limit = '50', offset = '0' } = req.query;
    try {
        const { eventos, total } = await eventos_dao_1.default.getAll({ estado, categoria, modalidad, destacado, limit, offset });
        res.json({ success: true, data: eventos, total, limit: parseInt(limit), offset: parseInt(offset) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al obtener eventos:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener eventos' });
    }
});
/**
 * GET /api/eventos/stats
 */
router.get('/stats', (0, cache_1.cacheMiddleware)({ ttl: cache_1.TTL_CONFIG.stats }), async (req, res) => {
    try {
        const stats = await eventos_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al obtener estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});
/**
 * GET /api/eventos/calendar - Formato FullCalendar
 */
router.get('/calendar', async (req, res) => {
    try {
        const { start, end, categoria, modalidad } = req.query;
        const rows = await eventos_dao_1.default.getCalendarEvents({ start, end, categoria, modalidad });
        const events = rows.map(evento => ({
            id: evento.id,
            title: evento.title,
            start: evento.start,
            end: evento.end,
            description: evento.descripcion,
            extendedProps: {
                categoria: evento.categoria,
                modalidad: evento.modalidad,
                ubicacion: evento.ubicacion,
                cupoMaximo: evento.cupo_maximo,
                inscripciones: evento.inscripciones_actuales,
                destacado: evento.destacado,
                slug: evento.slug
            },
            backgroundColor: evento.color_hex || '#3788d8',
            borderColor: evento.color_hex || '#3788d8',
            textColor: '#ffffff'
        }));
        res.json({ success: true, events });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', 'Error en /calendar:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener eventos para calendario' });
    }
});
/**
 * GET /api/eventos/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const evento = await eventos_dao_1.default.getById(id);
        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, data: evento });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al obtener evento:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener el evento' });
    }
});
/**
 * GET /api/eventos/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const evento = await eventos_dao_1.default.getBySlug(slug);
        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }
        res.json({ success: true, data: evento });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al obtener evento:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al obtener el evento' });
    }
});
/**
 * PUT /api/eventos/:id
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion, modalidad, link_virtual, categoria, tipo, etiquetas, estado, organizador, contacto_email, contacto_telefono, capacidad_maxima, inscripciones_abiertas, requiere_inscripcion, destacado } = req.body;
    try {
        const evento = await eventos_dao_1.default.update(id, {
            titulo, descripcion, imagen_url, fecha_inicio, fecha_fin, ubicacion,
            modalidad, link_virtual, categoria, tipo, etiquetas, estado,
            organizador, contacto_email, contacto_telefono, capacidad_maxima,
            inscripciones_abiertas, requiere_inscripcion, destacado
        });
        if (!evento) {
            res.status(404).json({ success: false, error: 'Evento no encontrado' });
            return;
        }
        debug_logger_1.debugLog.log('EVENTOS', `✅ Evento ${id} actualizado`);
        res.json({ success: true, message: 'Evento actualizado correctamente', data: evento });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al actualizar evento:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al actualizar el evento' });
    }
});
/**
 * DELETE /api/eventos/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await (0, soft_delete_helpers_1.softDelete)('eventos', id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Evento no encontrado o ya eliminado' });
            return;
        }
        debug_logger_1.debugLog.log('EVENTOS', `🗑️ Evento ${id} eliminado (soft delete)`);
        res.json({ success: true, message: 'Evento eliminado correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('EVENTOS', '❌ Error al eliminar evento:', (0, sanitized_errors_1.sanitizeError)(error, 'eventos'));
        res.status(500).json({ success: false, error: 'Error al eliminar el evento' });
    }
});
module.exports = router;
//# sourceMappingURL=eventos.js.map