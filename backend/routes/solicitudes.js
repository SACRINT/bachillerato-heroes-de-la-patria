/**
 * 📄 API CRUD PARA SOLICITUDES DE DOCUMENTOS - PostgreSQL
 * Gestión de solicitudes de documentos oficiales
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger.js');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors.js');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const SolicitudesDAO = require('../data/solicitudes-documentos.dao.js');
const { body, validationResult } = require('express-validator');
const { softDelete } = require('../data/soft-delete-helpers.js');

// =====================================================
// POST /api/solicitudes - Crear nueva solicitud
// =====================================================
router.post('/', [
    body('nombre').optional().trim(),
    body('requesterName').optional().trim(),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('requesterEmail').optional().isEmail().withMessage('Email inválido'),
    body('tipo_usuario').optional().trim(),
    body('requesterType').optional().trim(),
    body('documento_solicitado').optional().trim(),
    body('documentName').optional().trim(),
    body('motivo').optional().trim(),
    body('requestReason').optional().trim(),
    body('nivel_urgencia').optional().isIn(['low', 'normal', 'high', 'urgent', 'Baja', 'Normal', 'Alta', 'Urgente']),
    body('urgencyLevel').optional().isIn(['low', 'normal', 'high', 'urgent', 'Baja', 'Normal', 'Alta', 'Urgente'])
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Aceptar tanto nombres en español como en inglés (compatibilidad con formularios)
    const nombre = req.body.nombre || req.body.requesterName;
    const email = req.body.email || req.body.requesterEmail;
    const tipo_usuario = req.body.tipo_usuario || req.body.requesterType;
    const documento_solicitado = req.body.documento_solicitado || req.body.documentName;
    const motivo = req.body.motivo || req.body.requestReason || '';
    const nivel_urgencia = req.body.nivel_urgencia || req.body.urgencyLevel || 'normal';

    // Validación de campos requeridos
    if (!nombre || !email || !tipo_usuario || !documento_solicitado) {
        return res.status(400).json({
            success: false,
            error: 'Faltan campos requeridos: nombre, email, tipo_usuario, documento_solicitado'
        });
    }

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // ✅ FASE 3: Using SolicitudesDAO
        const solicitud = await SolicitudesDAO.create({
            nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, ip_address, user_agent
        });

        debugLog.log('SOLICITUDES', '✅ Nueva solicitud de documento creada:', solicitud.id);

        res.status(201).json({
            success: true,
            message: 'Tu solicitud ha sido enviada exitosamente. Te contactaremos pronto.',
            data: { id: solicitud.id, fecha: solicitud.fecha_solicitud }
        });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al crear solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu solicitud. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/solicitudes - Listar todas las solicitudes
// =====================================================
router.get('/', async (req, res) => {
    const { status, tipo_usuario, nivel_urgencia, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using SolicitudesDAO
        const { data, total } = await SolicitudesDAO.getAll({ status, tipo_usuario, nivel_urgencia, limit, offset });

        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al obtener solicitudes:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/solicitudes/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using SolicitudesDAO
        const stats = await SolicitudesDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al obtener estadísticas:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/solicitudes/:id - Obtener una solicitud
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using SolicitudesDAO
        const solicitud = await SolicitudesDAO.getById(id);
        if (!solicitud) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        res.json({ success: true, data: solicitud });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al obtener solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la solicitud'
        });
    }
});

// =====================================================
// PUT /api/solicitudes/:id - Actualizar solicitud (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, notas_admin, procesado_por } = req.body;

    try {
        // ✅ FASE 3: Using SolicitudesDAO
        const result = await SolicitudesDAO.update(id, { status, notas_admin, procesado_por });
        if (!result) return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        res.json({ success: true, message: 'Solicitud actualizada correctamente', data: result });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al actualizar solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la solicitud'
        });
    }
});

// =====================================================
// DELETE /api/solicitudes/:id - Eliminar solicitud (Soft Delete)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await softDelete('solicitudes_documentos', id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Solicitud no encontrada o ya eliminada'
            });
        }

        debugLog.log('SOLICITUDES', `🗑️ Solicitud ${id} eliminada (soft delete)`);

        res.json({
            success: true,
            message: 'Solicitud eliminada correctamente'
        });

    } catch (error) {
        debugLog.error('SOLICITUDES', '❌ Error al eliminar solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la solicitud'
        });
    }
});

/**
 * PUT /api/solicitudes/:id/approve
 * Aprobar una solicitud pendiente
 */
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { notas_admin } = req.body;

        // ✅ FASE 3: Using SolicitudesDAO
        const result = await SolicitudesDAO.approve(id, notas_admin);
        if (!result) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        debugLog.log('SOLICITUDES', `✅ Solicitud ${id} aprobada`);
        res.json({ success: true, message: 'Solicitud aprobada exitosamente', solicitud: result });

    } catch (error) {
        debugLog.error('SOLICITUDES', 'Error aprobando solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            message: 'Error al aprobar solicitud',
            error: error.message
        });
    }
});

/**
 * PUT /api/solicitudes/:id/reject
 * Rechazar una solicitud pendiente
 */
router.put('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo) return res.status(400).json({ success: false, message: 'Se requiere un motivo de rechazo' });

        // ✅ FASE 3: Using SolicitudesDAO
        const result = await SolicitudesDAO.reject(id, motivo);
        if (!result) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

        debugLog.log('SOLICITUDES', `❌ Solicitud ${id} rechazada`);
        res.json({ success: true, message: 'Solicitud rechazada exitosamente', solicitud: result });

    } catch (error) {
        debugLog.error('SOLICITUDES', 'Error rechazando solicitud:', sanitizeError(error, 'solicitudes'));
        res.status(500).json({
            success: false,
            message: 'Error al rechazar solicitud',
            error: error.message
        });
    }
});

module.exports = router;
