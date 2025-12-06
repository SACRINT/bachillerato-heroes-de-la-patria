/**
 * 📝 API CRUD PARA INSCRIPCIONES A ACTIVIDADES - PostgreSQL
 * Gestión de solicitudes de inscripción a actividades extracurriculares
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer
const InscriptionsDAO = require('../data/inscriptions.dao');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/inscriptions/register - Crear nueva inscripción
// =====================================================
router.post('/register', [
    body('activityId').trim().notEmpty().withMessage('ID de actividad requerido'),
    body('activityName').trim().notEmpty().withMessage('Nombre de actividad requerido'),
    body('studentName').trim().notEmpty().withMessage('Nombre del estudiante requerido'),
    body('studentEmail').isEmail().withMessage('Email inválido'),
    body('studentId').optional().trim(),
    body('studentGroup').optional().trim(),
    body('emergencyContact').optional().trim(),
    body('additionalInfo').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const {
        activityId,
        activityName,
        studentId,
        studentName,
        studentEmail,
        studentGroup,
        emergencyContact,
        additionalInfo
    } = req.body;

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const existing = await InscriptionsDAO.checkExisting(studentEmail, activityId);

        if (existing) {
            if (existing.status === 'pending') return res.json({ success: true, message: 'Ya tienes una solicitud pendiente.', data: { id: existing.id, already_pending: true } });
            if (existing.status === 'approved') return res.json({ success: true, message: 'Ya estás inscrito.', data: { id: existing.id, already_approved: true } });
            if (existing.status === 'rejected' || existing.status === 'cancelled') {
                const result = await InscriptionsDAO.updateResubmit(existing.id, { studentName, studentId, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
                debugLog.log('INSCRIPTIONS', '✅ Inscripción actualizada (reintento):', result.id);
                return res.json({ success: true, message: 'Tu nueva solicitud ha sido enviada.', data: { id: result.id, resubmitted: true } });
            }
        }

        const result = await InscriptionsDAO.create({ activityId, activityName, studentId, studentName, studentEmail, studentGroup, emergencyContact, additionalInfo, ip_address, user_agent });
        debugLog.log('INSCRIPTIONS', '✅ Nueva inscripción creada:', result.id);
        res.status(201).json({ success: true, message: '¡Solicitud enviada exitosamente!', data: { id: result.id, activityName: result.activity_name, fecha: result.fecha_solicitud } });



    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al crear inscripción:', sanitizeError(error, 'inscriptions'));

        // Error de constraint (email + actividad duplicado)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Ya existe una solicitud para esta actividad con este email'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al procesar tu solicitud. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// POST /api/inscriptions/create - Alias para compatibilidad
// =====================================================
router.post('/create', async (req, res) => {
    debugLog.log('INSCRIPTIONS', '📝 Redirigiendo /create a /register');
    // Redirigir internamente a /register
    req.url = '/register';
    return router.handle(req, res);
});

// =====================================================
// GET /api/inscriptions - Listar todas las inscripciones (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    const { status, activity_id, student_email, limit = 50, offset = 0 } = req.query;
    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const { data, total } = await InscriptionsDAO.getAll({ status, activity_id, student_email, limit, offset });
        res.json({ success: true, data, total, limit: parseInt(limit), offset: parseInt(offset) });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripciones:', sanitizeError(error, 'inscriptions'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/inscriptions/list - Alias para compatibilidad
// =====================================================
router.get('/list', async (req, res) => {
    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const inscripciones = await InscriptionsDAO.list();
        res.json({ success: true, inscripciones, total: inscripciones.length });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al listar inscripciones:', sanitizeError(error, 'inscriptions'));
        res.json({
            success: true,
            inscripciones: [],
            total: 0,
            message: 'Error al obtener inscripciones'
        });
    }
});

// =====================================================
// GET /api/inscriptions/stats - Estadísticas (ADMIN)
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const stats = await InscriptionsDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'inscriptions'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/inscriptions/:id - Obtener una inscripción
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const inscripcion = await InscriptionsDAO.getById(id);
        if (!inscripcion) return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
        res.json({ success: true, data: inscripcion });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al obtener inscripción:', sanitizeError(error, 'inscriptions'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la inscripción'
        });
    }
});

// =====================================================
// PUT /api/inscriptions/:id - Actualizar inscripción (ADMIN)
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, processed_by } = req.body;

    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const result = await InscriptionsDAO.update(id, { status, admin_notes, processed_by });
        if (!result) return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
        debugLog.log('INSCRIPTIONS', `✅ Inscripción ${id} actualizada: ${status}`);
        res.json({ success: true, message: 'Inscripción actualizada correctamente', data: result });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al actualizar inscripción:', sanitizeError(error, 'inscriptions'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la inscripción'
        });
    }
});

// =====================================================
// DELETE /api/inscriptions/:id - Eliminar inscripción (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // ✅ FASE 3: Using InscriptionsDAO
        const result = await InscriptionsDAO.cancel(id);
        if (!result) return res.status(404).json({ success: false, error: 'Inscripción no encontrada' });
        res.json({ success: true, message: 'Inscripción cancelada correctamente' });

    } catch (error) {
        debugLog.error('INSCRIPTIONS', '❌ Error al cancelar inscripción:', sanitizeError(error, 'inscriptions'));
        res.status(500).json({
            success: false,
            error: 'Error al cancelar la inscripción'
        });
    }
});

module.exports = router;
