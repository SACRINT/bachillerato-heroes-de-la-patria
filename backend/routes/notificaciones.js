/**
 * 🔔 API CRUD PARA NOTIFICACIONES DE CONVOCATORIAS - PostgreSQL
 * Gestión de suscripciones a notificaciones
 * Fecha: 17 Octubre 2025
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
// ✅ FASE 3: Using DAO layer instead of direct pool access
const NotificacionesDAO = require('../data/notificaciones-convocatorias.dao');
const { body, validationResult } = require('express-validator');

// =====================================================
// POST /api/notificaciones - Crear nueva suscripción
// =====================================================
router.post('/', [
    body('email').isEmail().withMessage('Email inválido'),
    body('nombre').optional().trim(),
    body('tipo_interes').optional().trim()
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    // Aceptar tanto 'subject' como 'tipo_interes' (compatibilidad con formularios)
    const { nombre, name, email, tipo_interes, subject } = req.body;
    const finalNombre = nombre || name || 'Usuario';
    const finalTipoInteres = tipo_interes || subject || 'Todas las convocatorias';

    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const existing = await NotificacionesDAO.getByEmail(email);

        if (existing) {
            if (existing.status === 'activo') {
                return res.json({
                    success: true,
                    message: 'Ya estás suscrito a las notificaciones de convocatorias',
                    data: { id: existing.id, already_subscribed: true }
                });
            }

            const result = await NotificacionesDAO.reactivate(email, {
                nombre: finalNombre, tipo_interes: finalTipoInteres, ip_address, user_agent
            });

            debugLog.log('NOTIFICACIONES', '✅ Suscripción reactivada:', result.id);
            return res.json({
                success: true,
                message: 'Tu suscripción ha sido reactivada exitosamente.',
                data: { id: result.id, reactivated: true }
            });
        }

        const result = await NotificacionesDAO.create({
            nombre: finalNombre, email, tipo_interes: finalTipoInteres, ip_address, user_agent
        });

        debugLog.log('NOTIFICACIONES', '✅ Nueva suscripción creada:', result.id);

        res.status(201).json({
            success: true,
            message: 'Te has suscrito exitosamente.',
            data: { id: result.id, fecha: result.fecha_suscripcion }
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al crear suscripción:', sanitizeError(error, 'notificaciones'));

        // Error de constraint (email duplicado)
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                error: 'Este email ya está registrado'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al procesar tu suscripción. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/notificaciones - Listar todas las suscripciones
// =====================================================
router.get('/', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const { data, total } = await NotificacionesDAO.getAll({ status, limit, offset });

        res.json({
            success: true,
            data,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener suscripciones:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/notificaciones/stats - Estadísticas
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const stats = await NotificacionesDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener estadísticas:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/notificaciones/:id - Obtener una suscripción
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const suscripcion = await NotificacionesDAO.getById(id);
        if (!suscripcion) return res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
        res.json({ success: true, data: suscripcion });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al obtener suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la suscripción'
        });
    }
});

// =====================================================
// PUT /api/notificaciones/:id - Actualizar suscripción
// =====================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, tipo_interes, status } = req.body;

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const result = await NotificacionesDAO.update(id, { nombre, tipo_interes, status });
        if (!result) return res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
        res.json({ success: true, message: 'Suscripción actualizada correctamente', data: result });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al actualizar suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la suscripción'
        });
    }
});

// =====================================================
// DELETE /api/notificaciones/:id - Cancelar suscripción
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const result = await NotificacionesDAO.cancel(id);
        if (!result) return res.status(404).json({ success: false, error: 'Suscripción no encontrada' });
        res.json({ success: true, message: 'Suscripción cancelada correctamente' });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al cancelar suscripción:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al cancelar la suscripción'
        });
    }
});

// =====================================================
// POST /api/notificaciones/unsubscribe - Darse de baja por email
// =====================================================
router.post('/unsubscribe', [
    body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { email } = req.body;

    try {
        // ✅ FASE 3: Using NotificacionesDAO
        const result = await NotificacionesDAO.unsubscribeByEmail(email);
        if (!result) return res.status(404).json({ success: false, error: 'No se encontró una suscripción activa con este email' });
        res.json({ success: true, message: 'Te has dado de baja exitosamente.' });

    } catch (error) {
        debugLog.error('NOTIFICACIONES', '❌ Error al dar de baja:', sanitizeError(error, 'notificaciones'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud'
        });
    }
});

module.exports = router;
