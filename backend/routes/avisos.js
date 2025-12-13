"use strict";
/**
 * 📰 API CRUD PARA AVISOS - TypeScript
 * Sistema de gestión de avisos del CMS
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// GDPR Logging
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
// ✅ FASE 3: DAO Layer
const avisos_dao_1 = __importDefault(require("../data/avisos.dao"));
const soft_delete_helpers_1 = require("../data/soft-delete-helpers");
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
 * POST /api/avisos - Crear nueva aviso
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
        const slugExists = await avisos_dao_1.default.slugExists(slug);
        if (slugExists) {
            slug = `${slug}-${Date.now()}`;
        }
        const aviso = await avisos_dao_1.default.create({
            titulo, contenido, resumen, imagen_url, categoria,
            etiquetas, estado, autor, autor_id, slug,
            meta_descripcion, destacada, ip_address, user_agent
        });
        debug_logger_1.debugLog.log('AVISOS', '✅ Nueva aviso creada:', aviso.id);
        res.status(201).json({ success: true, message: 'Aviso creada exitosamente', data: aviso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al crear aviso:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al crear la aviso' });
    }
});
/**
 * GET /api/avisos - Listar todos
 */
router.get('/', async (req, res) => {
    const { estado, categoria, destacada, limit = '50', offset = '0' } = req.query;
    const limitNum = parseInt(limit, 10);
    const offsetNum = parseInt(offset, 10);
    try {
        const { avisos, total } = await avisos_dao_1.default.getAll({ estado, categoria, destacada, limit: limitNum, offset: offsetNum });
        // Map AvisoRow to Aviso interface
        const mappedAvisos = avisos.map(a => ({
            ...a,
            estado: a.publico ? 'publicado' : 'borrador', // Simplification
            autor: 'Sistema', // Placeholder as we only have autor_id
            vistas: a.visualizaciones,
            created_at: a.fecha_publicacion ? a.fecha_publicacion.toISOString() : new Date().toISOString(),
            updated_at: a.fecha_actualizacion ? a.fecha_actualizacion.toISOString() : new Date().toISOString()
        }));
        res.json({ success: true, data: mappedAvisos, total, limit: limitNum, offset: offsetNum });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al obtener avisos:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener avisos' });
    }
});
/**
 * GET /api/avisos/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await avisos_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        const err = error;
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al obtener estadísticas:', (0, sanitized_errors_1.sanitizeError)(err, 'avisos'));
        if (err.code === '42P01') {
            res.json({ success: true, data: { total: 0, publicadas: 0, borradores: 0, destacadas: 0, vistas_totales: 0 } });
            return;
        }
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
    }
});
/**
 * GET /api/avisos/:id
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const avisoId = parseInt(id, 10);
    try {
        const row = await avisos_dao_1.default.getById(avisoId);
        if (!row) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        await avisos_dao_1.default.incrementViews(avisoId, 'id');
        const aviso = {
            ...row,
            estado: row.publico ? 'publicado' : 'borrador', // Simplification
            autor: 'Sistema',
            vistas: row.visualizaciones,
            created_at: row.fecha_publicacion ? new Date(row.fecha_publicacion).toISOString() : new Date().toISOString(),
            updated_at: row.fecha_actualizacion ? new Date(row.fecha_actualizacion).toISOString() : new Date().toISOString()
        }; // Force cast compatible props
        res.json({ success: true, data: aviso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al obtener aviso:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener la aviso' });
    }
});
/**
 * GET /api/avisos/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const row = await avisos_dao_1.default.getBySlug(slug);
        if (!row) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        await avisos_dao_1.default.incrementViews(slug, 'slug');
        const aviso = {
            ...row,
            estado: row.publico ? 'publicado' : 'borrador',
            autor: 'Sistema',
            vistas: row.visualizaciones,
            created_at: row.fecha_publicacion ? new Date(row.fecha_publicacion).toISOString() : new Date().toISOString(),
            updated_at: row.fecha_actualizacion ? new Date(row.fecha_actualizacion).toISOString() : new Date().toISOString()
        };
        res.json({ success: true, data: aviso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al obtener aviso:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al obtener la aviso' });
    }
});
/**
 * PUT /api/avisos/:id
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const avisoId = parseInt(id, 10);
    const { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, meta_descripcion, destacada } = req.body;
    try {
        const aviso = await avisos_dao_1.default.update(avisoId, { titulo, contenido, resumen, imagen_url, categoria, etiquetas, estado, destacada });
        if (!aviso) {
            res.status(404).json({ success: false, error: 'Aviso no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('AVISOS', `✅ Aviso ${id} actualizada`);
        res.json({ success: true, message: 'Aviso actualizada correctamente', data: aviso });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al actualizar aviso:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al actualizar la aviso' });
    }
});
/**
 * DELETE /api/avisos/:id
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const avisoId = parseInt(id, 10);
    try {
        const deleted = await (0, soft_delete_helpers_1.softDelete)('avisos', avisoId);
        if (!deleted) {
            res.status(404).json({ success: false, error: 'Aviso no encontrado o ya eliminado' });
            return;
        }
        debug_logger_1.debugLog.log('AVISOS', `🗑️ Aviso ${id} eliminado (soft delete)`);
        res.json({ success: true, message: 'Aviso eliminado correctamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('AVISOS', '❌ Error al eliminar aviso:', (0, sanitized_errors_1.sanitizeError)(error, 'avisos'));
        res.status(500).json({ success: false, error: 'Error al eliminar el aviso' });
    }
});
exports.default = router;
//# sourceMappingURL=avisos.js.map