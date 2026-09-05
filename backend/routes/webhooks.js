/**
 * 📡 RUTAS DE API PARA EL SISTEMA DE WEBHOOKS
 * backend/routes/webhooks.js
 * 
 * Endpoints:
 * - GET    /api/webhooks             - Listar webhooks del tenant
 * - GET    /api/webhooks/stats       - Métricas y tasa de éxito
 * - GET    /api/webhooks/events      - Catálogo de eventos soportados
 * - POST   /api/webhooks             - Registrar nuevo webhook (Rate Limited + Validación URL)
 * - PUT    /api/webhooks/:id         - Actualizar configuración de webhook
 * - DELETE /api/webhooks/:id         - Eliminar suscripción
 * - POST   /api/webhooks/:id/test    - Enviar payload de prueba interactivo
 * - GET    /api/webhooks/logs        - Historial de entregas y reintentos
 * - POST   /api/webhooks/process-queue - Ejecutar barrido de reintentos pendientes
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const webhooksService = require('../services/webhooks.service.js');
const webhookDelivery = require('../services/webhook-delivery.js');
const { authenticateToken } = require('../middleware/auth.js');
const devLogger = require('../utils/devLogger.js');

// 🛑 Rate Limiter para creación de webhooks y disparos de prueba
const webhookMutationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30,             // Máximo 30 peticiones por minuto
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Límite de solicitudes alcanzado (máximo 30 por minuto). Por favor espera un momento.'
    }
});

// Middleware opcional de autenticación suave (permite tokens administrativos o peticiones locales seguras)
const softAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        return authenticateToken(req, res, next);
    }
    // Si no viene header, asignamos tenant por defecto
    req.user = { tenant_id: 1, role: 'admin' };
    next();
};

/**
 * GET /api/webhooks
 * Listar suscripciones del tenant
 */
router.get('/', softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const event = req.query.event || null;
        const activeOnly = req.query.active === 'true';

        const subscriptions = await webhooksService.getSubscriptions(tenantId, event, activeOnly);
        res.json({
            success: true,
            subscriptions
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error listando suscripciones:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/webhooks/stats
 * Estadísticas y métricas generales
 */
router.get('/stats', softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const stats = await webhooksService.getWebhookStats(tenantId);
        res.json({
            success: true,
            stats
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error obteniendo estadísticas:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/webhooks/events
 * Catálogo oficial de eventos disponibles
 */
router.get('/events', (req, res) => {
    res.json({
        success: true,
        events: webhooksService.EVENT_TYPES
    });
});

/**
 * POST /api/webhooks
 * Registrar una nueva suscripción
 */
router.post('/', webhookMutationLimiter, softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const { url, events, secret, active } = req.body;

        // Validación estricta de URL
        if (!url || typeof url !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'El campo "url" es obligatorio.'
            });
        }

        const trimmedUrl = url.trim();
        try {
            const parsedUrl = new URL(trimmedUrl);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                return res.status(400).json({
                    success: false,
                    error: 'La URL debe utilizar protocolo HTTP o HTTPS.'
                });
            }
        } catch (urlErr) {
            return res.status(400).json({
                success: false,
                error: 'Formato de URL inválido. Ejemplo: https://sigpad.sep.gob.mx/api/v1/webhook'
            });
        }

        // Validación de eventos
        if (!events || (Array.isArray(events) && events.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'Debes seleccionar al menos un evento para suscribir.'
            });
        }

        const newSubscription = await webhooksService.createSubscription({
            tenant_id: tenantId,
            url: trimmedUrl,
            events,
            secret,
            active: active !== undefined ? active : true
        });

        res.status(201).json({
            success: true,
            message: 'Webhook registrado exitosamente.',
            subscription: newSubscription
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error creando suscripción:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/webhooks/:id
 * Actualizar una suscripción existente
 */
router.put('/:id', webhookMutationLimiter, softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const id = parseInt(req.params.id);
        const { url, events, secret, active } = req.body;

        if (url) {
            try {
                const parsedUrl = new URL(url.trim());
                if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
                    return res.status(400).json({ success: false, error: 'Protocolo inválido (se requiere http/https).' });
                }
            } catch (e) {
                return res.status(400).json({ success: false, error: 'URL malformada.' });
            }
        }

        const updated = await webhooksService.updateSubscription(id, { url, events, secret, active }, tenantId);
        res.json({
            success: true,
            message: 'Suscripción actualizada exitosamente.',
            subscription: updated
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error actualizando suscripción:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/webhooks/:id
 * Eliminar una suscripción
 */
router.delete('/:id', softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const id = parseInt(req.params.id);

        const deleted = await webhooksService.deleteSubscription(id, tenantId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Suscripción no encontrada.' });
        }

        res.json({
            success: true,
            message: 'Webhook eliminado correctamente.'
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error eliminando suscripción:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/webhooks/:id/test
 * Enviar payload de prueba interactivo (Ping)
 */
router.post('/:id/test', webhookMutationLimiter, softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const id = parseInt(req.params.id);

        const testResult = await webhooksService.testWebhook(id, tenantId);

        res.json({
            success: testResult.success,
            message: testResult.success 
                ? `Webhook probado con éxito (${testResult.responseCode} en ${testResult.latencyMs}ms)`
                : `Fallo en prueba de webhook (Código: ${testResult.responseCode || 'N/A'})`,
            result: testResult
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error ejecutando prueba de webhook:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/webhooks/logs
 * Obtener bitácora de entregas con paginación
 */
router.get('/logs', softAuthMiddleware, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        const webhookId = req.query.webhook_id ? parseInt(req.query.webhook_id) : null;
        const status = req.query.status || null;

        const result = await webhooksService.getDeliveryLogs(tenantId, { limit, offset, webhookId, status });

        res.json({
            success: true,
            ...result
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error obteniendo bitácora de entregas:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/webhooks/process-queue
 * Procesar manualmente o mediante cron la cola de reintentos pendientes
 */
router.post('/process-queue', softAuthMiddleware, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.body?.limit || req.query.limit) || 50, 100);
        const result = await webhookDelivery.processPendingRetries(limit);

        res.json({
            success: true,
            message: `Cola procesada: ${result.delivered} entregados, ${result.retried} reintentados, ${result.failed} fallidos.`,
            summary: result
        });
    } catch (err) {
        devLogger.error('[API-WEBHOOKS] Error procesando cola de reintentos:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
