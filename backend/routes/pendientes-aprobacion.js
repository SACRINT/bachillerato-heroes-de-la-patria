"use strict";
/**
 * 📋 RUTAS PARA PENDIENTES DE APROBACIÓN
 * Sistema de 2 pasos: Formulario → Temporal (pendientes_aprobacion) → Aprobado/Rechazado
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const debug_logger_1 = require("../utils/debug-logger");
// @ts-ignore
const sanitized_errors_1 = require("../utils/sanitized-errors");
// @ts-ignore
const pendientes_aprobacion_dao_1 = __importDefault(require("../data/pendientes-aprobacion.dao"));
const router = express_1.default.Router();
/**
 * GET /api/pendientes-aprobacion
 * Listar todas las solicitudes pendientes de aprobación
 */
router.get('/', async (req, res) => {
    try {
        const { tipo, estado, limit = '50', offset = '0' } = req.query;
        // ✅ FASE 3: Using PendientesDAO
        const { data, total } = await pendientes_aprobacion_dao_1.default.getAll({
            tipo: tipo,
            estado: estado,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        debug_logger_1.debugLog.log('PENDIENTES', `   ✅ Encontrados ${data.length} registros, Total: ${total}`);
        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', '❌ Error al obtener pendientes', (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitudes pendientes'
        });
    }
});
/**
 * GET /api/pendientes-aprobacion/:id
 * Obtener detalle de una solicitud pendiente
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await pendientes_aprobacion_dao_1.default.getById(id);
        if (!solicitud) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
        res.json({ success: true, data: solicitud });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', '❌ Error al obtener solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitud'
        });
    }
});
/**
 * POST /api/pendientes-aprobacion/aprobar/:id
 * Aprobar una solicitud pendiente
 */
router.post('/aprobar/:id', async (req, res) => {
    const { id } = req.params;
    const { admin_id, admin_notas } = req.body;
    debug_logger_1.debugLog.log('PENDIENTES', `\n🔵 [BACKEND APROBAR] POST /aprobar/${id} recibido`);
    try {
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await pendientes_aprobacion_dao_1.default.getById(id);
        if (!solicitud) {
            debug_logger_1.debugLog.log('PENDIENTES', `⚠️ [BACKEND APROBAR] Solicitud ${id} NO ENCONTRADA`);
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
        const datos = solicitud.datos_json;
        debug_logger_1.debugLog.log('PENDIENTES', `✅ [BACKEND APROBAR] Solicitud encontrada: Tipo=${solicitud.tipo_solicitud}`);
        await pendientes_aprobacion_dao_1.default.aprobar(id, solicitud, datos);
        debug_logger_1.debugLog.log('PENDIENTES', `🎉 [BACKEND APROBAR] ¡Solicitud aprobada exitosamente! ID=${id}`);
        res.json({ success: true, message: 'Solicitud aprobada y movida a tabla final', data: { id, estado: 'aprobada', action: 'deleted_from_pending' } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', `❌ [BACKEND APROBAR] Error`, (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({ success: false, error: 'Error al procesar solicitud', message: error.message });
    }
});
/**
 * POST /api/pendientes-aprobacion/rechazar/:id
 * Rechazar una solicitud pendiente
 */
router.post('/rechazar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notas } = req.body;
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await pendientes_aprobacion_dao_1.default.getById(id);
        if (!solicitud) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
        debug_logger_1.debugLog.log('PENDIENTES', `❌ Rechazando solicitud ${id}: ${solicitud.tipo_solicitud}`);
        const deleted = await pendientes_aprobacion_dao_1.default.rechazar(id);
        res.json({ success: true, message: 'Solicitud rechazada y eliminada', data: { id: deleted.id, tipo_solicitud: solicitud.tipo_solicitud, email_usuario: solicitud.email_usuario, action: 'deleted', admin_notas: admin_notas || null } });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', '❌ Error al rechazar solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al rechazar solicitud'
        });
    }
});
/**
 * DELETE /api/pendientes-aprobacion/:id
 * Eliminar una solicitud pendiente
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ FASE 3: Using PendientesDAO
        const result = await pendientes_aprobacion_dao_1.default.delete(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
        res.json({ success: true, message: 'Solicitud eliminada' });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', '❌ Error al eliminar solicitud', (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar solicitud'
        });
    }
});
/**
 * GET /api/pendientes-aprobacion/stats/general
 * Estadísticas de solicitudes pendientes
 */
router.get('/stats/general', async (req, res) => {
    try {
        // ✅ FASE 3: Using PendientesDAO
        const stats = await pendientes_aprobacion_dao_1.default.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        debug_logger_1.debugLog.error('PENDIENTES', '❌ Error al obtener estadísticas', (0, sanitized_errors_1.sanitizeError)(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pendientes-aprobacion.js.map