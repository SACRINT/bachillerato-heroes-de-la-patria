"use strict";
/**
 * 📰 API CRUD PARA COMUNICADOS - TypeScript
 * Sistema de gestión de comunicados del CMS
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
const comunicados_dao_1 = __importDefault(require('../data/comunicados.dao.js'));
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
 * POST /api/comunicados
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
        const slugExists = await comunicados_dao_1.default.slugExists(slug);
        if (slugExists)
            slug = `${slug}-${Date.now()}`;
        const comunicado = await comunicados_dao_1.default.create({
            titulo, contenido, resumen, imagen_url, categoria, etiquetas,
            estado, autor, autor_id, slug, meta_descripcion, destacada,
            ip_address, user_agent
        });
        debug_logger_1.debugLog.log('COMUNICADOS', '✅ Nueva comunicado creada:', comunicado.id);
        res.status(201).json({ success: true, message: 'Comunicado creada exitosamente', data: comunicado });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al crear comunicado:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al crear la comunicado' });
    }
});
/**
 * GET /api/comunicados
 */
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query;
    try {
        const { comunicados, total } = await comunicados_dao_1.default.getAll({ estado, categoria, destacada, limit, offset });
        res.json({ success: true, data: comunicados, total, limit: parseInt(limit), offset: parseInt(offset) });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al obtener comunicados:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener comunicados' });
    }
});
/**
 * GET /api/comunicados/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await comunicados_dao_1.default.getStats();
        res.json({ success: true, data: stats || { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
    }
    catch (error) {
        res.json({ success: true, data: { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
    }
});
/**
 * GET /api/comunicados/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const comunicado = await comunicados_dao_1.default.getBySlug(slug);
        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        await comunicados_dao_1.default.incrementViews(slug, 'slug');
        res.json({ success: true, data: comunicado });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener la comunicado' });
    }
});
/**
 * GET /api/comunicados/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const comunicado = await comunicados_dao_1.default.getById(id);
        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        await comunicados_dao_1.default.incrementViews(id, 'id');
        res.json({ success: true, data: comunicado });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al obtener comunicado:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al obtener la comunicado' });
    }
});
/**
 * PUT /api/comunicados/:id
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;
    try {
        const comunicado = await comunicados_dao_1.default.update(id, {
            titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada
        });
        if (!comunicado) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('COMUNICADOS', `✅ Comunicado ${id} actualizada`);
        res.json({ success: true, message: 'Comunicado actualizada correctamente', data: comunicado });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al actualizar comunicado:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al actualizar la comunicado' });
    }
});
/**
 * DELETE /api/comunicados/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await comunicados_dao_1.default.archive(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Comunicado no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Comunicado archivada correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('COMUNICADOS', '❌ Error al archivar comunicado:', (0, sanitized_errors_1.sanitizeError)(error, 'comunicados'));
        res.status(500).json({ success: false, error: 'Error al archivar la comunicado' });
    }
});
exports.default = router;
//# sourceMappingURL=comunicados.js.map