/**
 * 📋 RUTAS PARA PENDIENTES DE APROBACIÓN
 * Sistema de 2 pasos: Formulario → Temporal (pendientes_aprobacion) → Aprobado/Rechazado
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response } from 'express';
// @ts-ignore
import { debugLog } from '../utils/debug-logger';
// @ts-ignore
import { sanitizeError } from '../utils/sanitized-errors';
// @ts-ignore
import PendientesDAO from '../data/pendientes-aprobacion.dao';

const router = express.Router();

/**
 * GET /api/pendientes-aprobacion
 * Listar todas las solicitudes pendientes de aprobación
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { tipo, estado, limit = '50', offset = '0' } = req.query;
        // ✅ FASE 3: Using PendientesDAO
        const { data, total } = await PendientesDAO.getAll({
            tipo: tipo as string,
            estado: estado as string,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });
        debugLog.log('PENDIENTES', `   ✅ Encontrados ${data.length} registros, Total: ${total}`);
        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit as string),
            offset: parseInt(offset as string)
        });

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
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
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
 * Aprobar una solicitud pendiente
 */
router.post('/aprobar/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { admin_id, admin_notas } = req.body;

    debugLog.log('PENDIENTES', `\n🔵 [BACKEND APROBAR] POST /aprobar/${id} recibido`);

    try {
        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) {
            debugLog.log('PENDIENTES', `⚠️ [BACKEND APROBAR] Solicitud ${id} NO ENCONTRADA`);
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }

        const datos = solicitud.datos_json;
        debugLog.log('PENDIENTES', `✅ [BACKEND APROBAR] Solicitud encontrada: Tipo=${solicitud.tipo_solicitud}`);

        await PendientesDAO.aprobar(id, solicitud, datos);

        debugLog.log('PENDIENTES', `🎉 [BACKEND APROBAR] ¡Solicitud aprobada exitosamente! ID=${id}`);
        res.json({ success: true, message: 'Solicitud aprobada y movida a tabla final', data: { id, estado: 'aprobada', action: 'deleted_from_pending' } });

    } catch (error: any) {
        debugLog.error('PENDIENTES', `❌ [BACKEND APROBAR] Error`, sanitizeError(error, 'pendientes'));
        res.status(500).json({ success: false, error: 'Error al procesar solicitud', message: error.message });
    }
});

/**
 * POST /api/pendientes-aprobacion/rechazar/:id
 * Rechazar una solicitud pendiente
 */
router.post('/rechazar/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { admin_notas } = req.body;

        // ✅ FASE 3: Using PendientesDAO
        const solicitud = await PendientesDAO.getById(id);
        if (!solicitud) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }

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
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // ✅ FASE 3: Using PendientesDAO
        const result = await PendientesDAO.delete(id);
        if (!result) {
            res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
            return;
        }
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
router.get('/stats/general', async (req: Request, res: Response) => {
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

export default router;
