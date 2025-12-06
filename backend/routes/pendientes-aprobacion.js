/**
 * 📋 RUTAS PARA PENDIENTES DE APROBACIÓN
 * Sistema de 2 pasos: Formulario → Temporal (pendientes_aprobacion) → Aprobado/Rechazado
 */

const express = require('express');

// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');

const router = express.Router();
// ✅ FASE 3: Using DAO layer
const PendientesDAO = require('../data/pendientes-aprobacion.dao');

/**
 * GET /api/pendientes-aprobacion
 * Listar todas las solicitudes pendientes de aprobación
 * Query params: tipo (egresado|bolsa_trabajo), estado (pendiente|aprobada|rechazada), limit, offset
 *
 * ⚠️ NOTA: Se removió el filtro email_confirmado para mostrar TODOS los registros
 * pendientes sin importar su estado de confirmación. Los registros deben aparecer
 * en el tab de aprobaciones para ser revisados por el administrador.
 */
router.get('/', async (req, res) => {
    try {
        const { tipo, estado, limit = 50, offset = 0 } = req.query;
        // ✅ FASE 3: Using PendientesDAO
        const { data, total } = await PendientesDAO.getAll({ tipo, estado, limit, offset });
        debugLog.log('PENDIENTES', `   ✅ Encontrados ${data.length} registros, Total: ${total}`);
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });

    } catch (error) {
        debugLog.error('PENDIENTES', '❌ Error al obtener pendientes', sanitizeError(error, 'pendientes'));
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
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        res.json({ success: true, data: solicitud });

    } catch (error) {
        debugLog.error('PENDIENTES', '❌ Error al obtener solicitud', sanitizeError(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener solicitud'
        });
    }
});

/**
 * POST /api/pendientes-aprobacion/aprobar/:id
 * Aprobar una solicitud pendiente (mover a tabla final y ELIMINAR de pendientes_aprobacion)
 *
 * ✅ IMPORTANTE: Después de insertar en tabla final, se ELIMINA de pendientes_aprobacion
 * Esto asegura que pendientes_aprobacion solo contiene registros con estado='pendiente'
 */
router.post('/aprobar/:id', async (req, res) => {
    const { id } = req.params;
    const { admin_id, admin_notas } = req.body;

    debugLog.log('PENDIENTES', `\n🔵 [BACKEND APROBAR] POST /aprobar/${id} recibido`);

    try {
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) {
            debugLog.log('PENDIENTES', `⚠️ [BACKEND APROBAR] Solicitud ${id} NO ENCONTRADA`);
            return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }

        const datos = solicitud.datos_json;
        debugLog.log('PENDIENTES', `✅ [BACKEND APROBAR] Solicitud encontrada: Tipo=${solicitud.tipo_solicitud}`);

        await PendientesDAO.aprobar(id, solicitud, datos);

        debugLog.log('PENDIENTES', `🎉 [BACKEND APROBAR] ¡Solicitud aprobada exitosamente! ID=${id}`);
        res.json({ success: true, message: 'Solicitud aprobada y movida a tabla final', data: { id, estado: 'aprobada', action: 'deleted_from_pending' } });

    } catch (error) {
        debugLog.error('PENDIENTES', `❌ [BACKEND APROBAR] Error`, sanitizeError(error, 'pendientes'));
        res.status(500).json({ success: false, error: 'Error al procesar solicitud', message: error.message });
    }
});

/**
 * POST /api/pendientes-aprobacion/rechazar/:id
 * Rechazar una solicitud pendiente - ELIMINA el registro de la BD
 */
router.post('/rechazar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notas } = req.body;

        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });

        debugLog.log('PENDIENTES', `❌ Rechazando solicitud ${id}: ${solicitud.tipo_solicitud}`);
        const deleted = await PendientesDAO.rechazar(id);

        res.json({ success: true, message: 'Solicitud rechazada y eliminada', data: { id: deleted.id, tipo_solicitud: solicitud.tipo_solicitud, email_usuario: solicitud.email_usuario, action: 'deleted', admin_notas: admin_notas || null } });

    } catch (error) {
        debugLog.error('PENDIENTES', '❌ Error al rechazar solicitud', sanitizeError(error, 'pendientes'));
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
        const result = await PendientesDAO.delete(id);
        if (!result) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        res.json({ success: true, message: 'Solicitud eliminada' });

    } catch (error) {
        debugLog.error('PENDIENTES', '❌ Error al eliminar solicitud', sanitizeError(error, 'pendientes'));
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
        const stats = await PendientesDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('PENDIENTES', '❌ Error al obtener estadísticas', sanitizeError(error, 'pendientes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;
