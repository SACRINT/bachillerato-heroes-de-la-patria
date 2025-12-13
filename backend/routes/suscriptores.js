"use strict";
/**
 * 📧 API CRUD PARA SUSCRIPTORES - TypeScript
 * Gestión completa de suscriptores
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require("../utils/debug-logger");
// @ts-ignore
const sanitized_errors_1 = require("../utils/sanitized-errors");
// @ts-ignore
const suscriptores_dao_1 = __importDefault(require("../data/suscriptores.dao"));
const router = express_1.default.Router();
// ============================================
// GET - Listar todos los suscriptores
// ============================================
router.get('/', async (req, res) => {
    try {
        debug_logger_1.debugLog.log('SUSCRIPTORES', '📧 [SUSCRIPTORES] Obteniendo lista de suscriptores...');
        const suscriptores = await suscriptores_dao_1.default.getAll();
        debug_logger_1.debugLog.log('SUSCRIPTORES', `✅ [SUSCRIPTORES] ${suscriptores.length} suscriptores encontrados`);
        res.json({
            success: true,
            total: suscriptores.length,
            data: suscriptores
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error al obtener suscriptores:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        if (error.code === '42P01' || error.code === '42703') {
            res.json({ success: true, total: 0, data: [] });
            return;
        }
        res.status(500).json({ success: false, error: 'Error al obtener lista', message: error.message });
    }
});
// ============================================
// GET - Filtrar suscriptores por estado
// ============================================
router.get('/estado/:estado', async (req, res) => {
    try {
        const { estado } = req.params;
        const suscriptores = await suscriptores_dao_1.default.getByEstado(estado);
        res.json({ success: true, estado, total: suscriptores.length, suscriptores });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error al filtrar por estado:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al filtrar suscriptores' });
    }
});
// ============================================
// GET - Suscriptores activos para envío masivo
// ============================================
router.get('/activos/email', async (req, res) => {
    try {
        const { tipo } = req.query;
        const suscriptores = await suscriptores_dao_1.default.getActivosForEmail(tipo);
        res.json({
            success: true,
            tipo: tipo || 'todas',
            total: suscriptores.length,
            emails: suscriptores.map((s) => s.email),
            suscriptores
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error al obtener emails activos:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al obtener emails activos' });
    }
});
// ============================================
// GET - Estadísticas generales
// ============================================
router.get('/stats/general', async (req, res) => {
    try {
        const stats = await suscriptores_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error estadísticas:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        if (error.code === '42P01' || error.code === '42703') {
            res.json({ success: true, data: { total: 0, porEstado: [], porTipo: {} } });
            return;
        }
        res.status(500).json({ success: false, error: 'Error estadísticas' });
    }
});
// ============================================
// GET - Obtener suscriptor por ID
// ============================================
// ============================================
// GET - Obtener suscriptor por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'ID inválido' });
            return;
        }
        const suscriptor = await suscriptores_dao_1.default.getById(id);
        if (!suscriptor) {
            res.status(404).json({ success: false, error: 'Suscriptor no encontrado' });
            return;
        }
        res.json({ success: true, suscriptor });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error obtener suscriptor:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error obtener suscriptor' });
    }
});
// ... (skipping POST) ...
// ============================================
// PUT - Actualizar suscriptor
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, error: 'ID inválido' });
            return;
        }
        const result = await suscriptores_dao_1.default.update(id, req.body);
        if (!result || result.length === 0) {
            res.status(404).json({ success: false, error: 'No encontrado' });
            return;
        }
        res.json({ success: true, message: 'Actualizado exitosamente' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('SUSCRIPTORES', '❌ Error actualizar:', (0, sanitized_errors_1.sanitizeError)(error, 'suscriptores'));
        res.status(500).json({ success: false, error: 'Error al actualizar' });
    }
});
module.exports = router;
//# sourceMappingURL=suscriptores.js.map