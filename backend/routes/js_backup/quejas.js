const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
const router = express.Router();
const { body, validationResult } = require('express-validator');
// ✅ FASE 3: Using DAO layer
const QuejasDAO = require('../data/quejas.dao');
const emailService = require('../services/emailService');

// =====================================================
// POST /api/quejas - Crear nueva queja/sugerencia
// =====================================================
router.post('/', [
    body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('subject').isIn(['queja', 'sugerencia', 'felicitacion', 'otro']).withMessage('Tipo inválido'),
    body('message').trim().notEmpty().withMessage('Mensaje es requerido')
], async (req, res) => {
    // Validar datos
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { nombre, email, subject, message, form_type } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('User-Agent');

    try {
        // ✅ FASE 3: Using QuejasDAO
        const queja = await QuejasDAO.create({ nombre, email, subject, message, form_type, ip_address, user_agent });
        debugLog.log('QUEJAS', '✅ Queja/sugerencia guardada:', queja.id);

        try {
            if (email) await emailService.sendEmail({ to: email, subject: 'Hemos recibido tu mensaje - Bachillerato Héroes de la Patria', template: 'contact-confirmation', data: { nombre: nombre || 'Usuario', subject, fecha: new Date() } });
        } catch (emailError) { console.error('[Quejas] Error al enviar correo:', emailError); }

        res.status(201).json({ success: true, message: 'Tu mensaje ha sido recibido.', data: { id: queja.id, fecha: queja.fecha_creacion } });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al guardar queja:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al procesar tu mensaje. Por favor intenta nuevamente.'
        });
    }
});

// =====================================================
// GET /api/quejas - Listar todas (ADMIN)
// =====================================================
router.get('/', async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        // ✅ FASE 3: Using QuejasDAO
        const data = await QuejasDAO.getAll({ status, limit, offset });
        res.json({ success: true, data, total: data.length });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener quejas:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener los datos'
        });
    }
});

// =====================================================
// GET /api/quejas/stats - Estadísticas (ADMIN)
// =====================================================
router.get('/stats', async (req, res) => {
    try {
        // ✅ FASE 3: Using QuejasDAO
        const stats = await QuejasDAO.getStats();
        res.json({ success: true, data: stats });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener estadísticas:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// =====================================================
// GET /api/quejas/:id - Obtener una queja específica
// =====================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using QuejasDAO
        const queja = await QuejasDAO.getById(id);
        if (!queja) return res.status(404).json({ success: false, error: 'Queja no encontrada' });
        res.json({ success: true, data: queja });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al obtener queja:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener la queja'
        });
    }
});

// =====================================================
// PUT /api/quejas/:id - Actualizar queja (ADMIN)
// =====================================================
router.put('/:id', [
    body('status').optional().isIn(['pendiente', 'en_revision', 'respondida', 'cerrada']),
    body('respuesta').optional().trim(),
    body('respondido_por').optional().trim()
], async (req, res) => {
    const { id } = req.params;
    const { status, respuesta, respondido_por } = req.body;

    try {
        // ✅ FASE 3: Using QuejasDAO
        const result = await QuejasDAO.update(id, { status, respuesta, respondido_por });
        if (!result) return res.status(404).json({ success: false, error: 'Queja no encontrada' });
        res.json({ success: true, message: 'Queja actualizada correctamente', data: result });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al actualizar queja:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al actualizar la queja'
        });
    }
});

// =====================================================
// DELETE /api/quejas/:id - Eliminar queja (ADMIN)
// =====================================================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ FASE 3: Using QuejasDAO
        const result = await QuejasDAO.delete(id);
        if (!result) return res.status(404).json({ success: false, error: 'Queja no encontrada' });
        res.json({ success: true, message: 'Queja eliminada correctamente' });

    } catch (error) {
        debugLog.error('QUEJAS', '❌ Error al eliminar queja:', sanitizeError(error, 'quejas'));
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la queja'
        });
    }
});

module.exports = router;
