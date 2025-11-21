/**
 * TEST EVENTS ROUTES - Endpoints para testing de Event Bus
 *
 * Propósito: Permitir emitir eventos de prueba para validar Subscribers
 * SOLO para desarrollo/testing
 *
 * Endpoints:
 *   POST /api/test-events/emit - Emitir evento de prueba
 *   GET /api/test-events/stats - Ver estadísticas de Event Bus
 *   GET /api/test-events/history - Ver historial de eventos
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/test-events/emit
 * Emite un evento de prueba en el Event Bus
 *
 * Body:
 *   {
 *     "eventType": "students.created",
 *     "data": { ... }
 *   }
 */
router.post('/emit', (req, res) => {
    try {
        const { eventType, data } = req.body;

        if (!eventType) {
            return res.status(400).json({
                success: false,
                error: 'eventType es requerido'
            });
        }

        // Emitir evento usando Event Bus del servidor
        const eventBus = req.app.eventBus;

        if (!eventBus) {
            return res.status(500).json({
                success: false,
                error: 'Event Bus no está inicializado en el servidor'
            });
        }

        const event = eventBus.emit(eventType, data || {});

        console.log(`[TEST-EVENTS] ✅ Evento emitido: ${eventType}`);

        res.json({
            success: true,
            message: `Evento "${eventType}" emitido exitosamente`,
            event: {
                type: event.type,
                eventId: event.metadata.eventId,
                timestamp: event.metadata.timestamp
            }
        });

    } catch (error) {
        console.error('[TEST-EVENTS] ❌ Error emitiendo evento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/test-events/stats
 * Obtiene estadísticas del Event Bus
 */
router.get('/stats', (req, res) => {
    try {
        const eventBus = req.app.eventBus;

        if (!eventBus) {
            return res.status(500).json({
                success: false,
                error: 'Event Bus no está inicializado'
            });
        }

        const stats = eventBus.getStats();

        res.json({
            success: true,
            stats: stats
        });

    } catch (error) {
        console.error('[TEST-EVENTS] ❌ Error obteniendo stats:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/test-events/history
 * Obtiene historial de eventos
 */
router.get('/history', (req, res) => {
    try {
        const eventBus = req.app.eventBus;

        if (!eventBus) {
            return res.status(500).json({
                success: false,
                error: 'Event Bus no está inicializado'
            });
        }

        const limit = parseInt(req.query.limit) || 50;
        const eventType = req.query.eventType || null;

        const history = eventBus.getHistory(eventType, limit);

        res.json({
            success: true,
            count: history.length,
            history: history.map(event => ({
                type: event.type,
                timestamp: event.metadata?.timestamp || event.timestamp,
                eventId: event.metadata?.eventId,
                dataPreview: JSON.stringify(event.data).substring(0, 100)
            }))
        });

    } catch (error) {
        console.error('[TEST-EVENTS] ❌ Error obteniendo history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/test-events/emit-multiple
 * Emite múltiples eventos de prueba predefinidos
 */
router.post('/emit-multiple', (req, res) => {
    try {
        const eventBus = req.app.eventBus;

        if (!eventBus) {
            return res.status(500).json({
                success: false,
                error: 'Event Bus no está inicializado'
            });
        }

        const testEvents = [
            {
                type: 'students.created',
                data: { id: 1, nombre: 'Test Student', email: 'test@student.com' }
            },
            {
                type: 'grades.created',
                data: { id: 1, studentId: 1, subject: 'Math', grade: 9.5 }
            },
            {
                type: 'auth.success',
                data: { provider: 'google', user: { email: 'test@admin.com' } }
            },
            {
                type: 'page.viewed',
                data: { page: '/admin-dashboard.html' }
            },
            {
                type: 'button.clicked',
                data: { button: 'save-student' }
            },
            {
                type: 'form.submitted',
                data: { form: 'student-form' }
            }
        ];

        const emittedEvents = [];

        testEvents.forEach(({ type, data }) => {
            const event = eventBus.emit(type, data);
            emittedEvents.push({
                type: event.type,
                eventId: event.metadata.eventId
            });
            console.log(`[TEST-EVENTS] ✅ Evento emitido: ${type}`);
        });

        res.json({
            success: true,
            message: `${emittedEvents.length} eventos emitidos exitosamente`,
            events: emittedEvents
        });

    } catch (error) {
        console.error('[TEST-EVENTS] ❌ Error emitiendo eventos:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
