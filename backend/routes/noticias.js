"use strict";
/**
 * 📰 API CRUD PARA NOTICIAS - TypeScript
 * Sistema de gestión de noticias del CMS
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// GDPR Logging
const debug_logger_1 = require('../utils/debug-logger.js');
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
// ✅ FASE 3: DAO Layer
const noticias_dao_1 = __importDefault(require('../data/noticias.dao.js'));
const soft_delete_helpers_1 = require('../data/soft-delete-helpers.js');
const cache_1 = require('../middleware/cache.js');
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
 * POST /api/noticias - Crear nueva noticia
 */
router.post('/', [
    (0, express_validator_1.body)('titulo').trim().notEmpty().withMessage('Título requerido'),
    (0, express_validator_1.body)('contenido').trim().notEmpty().withMessage('Contenido requerido'),
    (0, express_validator_1.body)('autor').trim().notEmpty().withMessage('Autor requerido')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return;
    }
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, autor, autor_id, meta_descripcion, destacada } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');
    try {
        let slug = generateSlug(titulo);
        const slugExists = await noticias_dao_1.default.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }
        const noticia = await noticias_dao_1.default.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });
        debug_logger_1.debugLog.log('NOTICIAS', '✅ Nueva noticia creada:', noticia.id);
        res.status(201).json({ success: true, message: 'Noticia creada exitosamente', data: noticia });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al crear noticia:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al crear la noticia' });
    }
});
/**
 * GET /api/noticias - Listar todos
 */
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query;
    try {
        const { noticias, total } = await noticias_dao_1.default.getAll({ estado, categoria, destacada, limit, offset });
        res.json({ success: true, data: noticias, total, limit: parseInt(limit), offset: parseInt(offset) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al obtener noticias:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener noticias' });
    }
});
/**
 * GET /api/noticias/stats
 */
router.get('/stats', (0, cache_1.cacheMiddleware)({ ttl: cache_1.TTL_CONFIG.stats }), async (req, res) => {
    try {
        const stats = await noticias_dao_1.default.getStats();
        res.json({ success: true, data: stats || { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
    }
    catch (error) {
        res.json({ success: true, data: { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
    }
});
/**
 * GET /api/noticias/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const noticia = await noticias_dao_1.default.getById(id);
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        await noticias_dao_1.default.incrementViews(id, 'id');
        res.json({ success: true, data: noticia });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener la noticia' });
    }
});
/**
 * GET /api/noticias/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const noticia = await noticias_dao_1.default.getBySlug(slug);
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        await noticias_dao_1.default.incrementViews(slug, 'slug');
        res.json({ success: true, data: noticia });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al obtener noticia:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al obtener la noticia' });
    }
});
/**
 * PUT /api/noticias/:id
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;
    try {
        const noticia = await noticias_dao_1.default.update(id, { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada });
        if (!noticia) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('NOTICIAS', `✅ Noticia ${id} actualizada`);
        res.json({ success: true, message: 'Noticia actualizada correctamente', data: noticia });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al actualizar noticia:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al actualizar la noticia' });
    }
});
/**
 * DELETE /api/noticias/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await (0, soft_delete_helpers_1.softDelete)('noticias', id);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Noticia no encontrada o ya eliminada' });
            return;
        }
        debug_logger_1.debugLog.log('NOTICIAS', `🗑️ Noticia ${id} eliminada (soft delete)`);
        res.json({ success: true, message: 'Noticia eliminada correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('NOTICIAS', '❌ Error al eliminar noticia:', (0, sanitized_errors_1.sanitizeError)(error, 'noticias'));
        res.status(500).json({ success: false, error: 'Error al eliminar la noticia' });
    }
});
exports.default = router;
//# sourceMappingURL=noticias.js.map