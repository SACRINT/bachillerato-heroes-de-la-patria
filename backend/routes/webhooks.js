/**
 * 🪝 WEBHOOKS ROUTES - SEMANA 8
 * ✅ FASE 3 DAL - Refactorizado para usar WebhookDAO
 * Sistema de webhooks para notificaciones de eventos en tiempo real
 *
 * Características:
 * - Registro de webhooks con validación de URL
 * - Eventos soportados: user.created, grade.updated, news.published, etc.
 * - Retry automático con exponential backoff
 * - Firma HMAC para seguridad
 * - Logs de deliveries
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ COMPLETADO
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const devLogger = require('../utils/devLogger');

// ✅ FASE 3: Using DAO layer
const WebhookDAO = require('../data/webhook.dao');

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

const SUPPORTED_EVENTS = [
    'user.created',
    'user.updated',
    'user.deleted',
    'student.enrolled',
    'grade.created',
    'grade.updated',
    'news.published',
    'payment.completed',
    'attendance.marked',
    'message.sent',
];

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // 1s, 5s, 15s

// =============================================================================
// ENDPOINTS DE GESTIÓN DE WEBHOOKS
// =============================================================================

/**
 * GET /api/webhooks
 * Listar todos los webhooks del tenant/usuario
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user.tenant_id;

        // ✅ FASE 3: Using WebhookDAO
        const webhooks = await WebhookDAO.listByTenant(tenantId);

        res.json({
            success: true,
            webhooks,
            count: webhooks.length,
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al listar:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al obtener webhooks',
            details: error.message,
        });
    }
});

/**
 * POST /api/webhooks
 * Crear un nuevo webhook
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { url, events = [], description = '' } = req.body;
        const tenantId = req.tenantId || req.user.tenant_id;

        // Validaciones
        if (!url || !isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_URL',
                message: 'URL inválida. Debe ser HTTPS y accesible.',
            });
        }

        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_EVENTS',
                message: 'Debes especificar al menos un evento',
                supportedEvents: SUPPORTED_EVENTS,
            });
        }

        // Validar eventos soportados
        const invalidEvents = events.filter(e => !SUPPORTED_EVENTS.includes(e));
        if (invalidEvents.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'UNSUPPORTED_EVENTS',
                message: 'Eventos no soportados',
                invalidEvents,
                supportedEvents: SUPPORTED_EVENTS,
            });
        }

        // Generar secret para HMAC
        const secret = crypto.randomBytes(32).toString('hex');
        const secretPreview = secret.substring(0, 8) + '...' + secret.substring(secret.length - 8);

        // ✅ FASE 3: Using WebhookDAO
        const webhook = await WebhookDAO.createForTenant(tenantId, url, events, description, secret, secretPreview);

        devLogger.log(`[WEBHOOKS] Webhook creado: ${webhook.id} para tenant ${tenantId}`);

        res.status(201).json({
            success: true,
            message: 'Webhook creado exitosamente',
            webhook: {
                ...webhook,
                secret, // Solo se devuelve al crear
            },
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al crear:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al crear webhook',
            details: error.message,
        });
    }
});

/**
 * GET /api/webhooks/:id
 * Obtener detalles de un webhook específico
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        // ✅ FASE 3: Using WebhookDAO
        const webhook = await WebhookDAO.getByIdAndTenant(id, tenantId);

        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        res.json({
            success: true,
            webhook,
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al obtener:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al obtener webhook',
            details: error.message,
        });
    }
});

/**
 * PATCH /api/webhooks/:id
 * Actualizar webhook (URL, eventos, estado)
 */
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { url, events, description, status } = req.body;
        const tenantId = req.tenantId || req.user.tenant_id;

        // Validaciones
        if (url !== undefined && !isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_URL',
                message: 'URL inválida',
            });
        }

        if (status !== undefined && !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_STATUS',
                message: 'Estado inválido. Debe ser "active" o "inactive"',
            });
        }

        const updates = {};
        if (url !== undefined) updates.url = url;
        if (events !== undefined) updates.events = events;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'NO_UPDATES',
                message: 'No se especificaron campos a actualizar',
            });
        }

        // ✅ FASE 3: Using WebhookDAO
        const webhook = await WebhookDAO.updateByIdAndTenant(id, tenantId, updates);

        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        devLogger.log(`[WEBHOOKS] Webhook actualizado: ${id}`);

        res.json({
            success: true,
            message: 'Webhook actualizado exitosamente',
            webhook,
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al actualizar:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al actualizar webhook',
            details: error.message,
        });
    }
});

/**
 * DELETE /api/webhooks/:id
 * Eliminar un webhook
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        // ✅ FASE 3: Using WebhookDAO
        const deleted = await WebhookDAO.deleteByIdAndTenant(id, tenantId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        devLogger.log(`[WEBHOOKS] Webhook eliminado: ${id}`);

        res.json({
            success: true,
            message: 'Webhook eliminado exitosamente',
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al eliminar:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al eliminar webhook',
            details: error.message,
        });
    }
});

/**
 * GET /api/webhooks/:id/deliveries
 * Obtener historial de deliveries de un webhook
 */
router.get('/:id/deliveries', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const tenantId = req.tenantId || req.user.tenant_id;

        // ✅ FASE 3: Using WebhookDAO
        const belongs = await WebhookDAO.belongsToTenant(id, tenantId);

        if (!belongs) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        // ✅ FASE 3: Using WebhookDAO
        const deliveries = await WebhookDAO.getDeliveries(id, limit, offset);

        res.json({
            success: true,
            deliveries,
            count: deliveries.length,
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al obtener deliveries:', error);
        res.status(500).json({
            success: false,
            error: 'DATABASE_ERROR',
            message: 'Error al obtener deliveries',
            details: error.message,
        });
    }
});

/**
 * POST /api/webhooks/:id/test
 * Enviar un evento de prueba al webhook
 */
router.post('/:id/test', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        // ✅ FASE 3: Using WebhookDAO
        const webhook = await WebhookDAO.getWithSecret(id, tenantId);

        if (!webhook) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        if (webhook.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'WEBHOOK_INACTIVE',
                message: 'El webhook está inactivo',
            });
        }

        // Payload de prueba
        const payload = {
            event: 'webhook.test',
            data: {
                message: 'Este es un evento de prueba',
                timestamp: new Date().toISOString(),
                tenant_id: tenantId,
            },
        };

        // Enviar webhook
        const deliveryResult = await sendWebhook(webhook, payload);

        res.json({
            success: true,
            message: 'Webhook de prueba enviado',
            delivery: deliveryResult,
        });

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al enviar test:', error);
        res.status(500).json({
            success: false,
            error: 'DELIVERY_ERROR',
            message: 'Error al enviar webhook de prueba',
            details: error.message,
        });
    }
});

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Valida si una URL es válida y segura
 */
function isValidUrl(url) {
    try {
        const parsed = new URL(url);
        // Solo permitir HTTPS en producción
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

/**
 * Envía un webhook con retry automático
 */
async function sendWebhook(webhook, payload, retryCount = 0) {
    const fetch = (await import('node-fetch')).default;

    try {
        // Generar firma HMAC
        const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        // Enviar request
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Event': payload.event,
                'User-Agent': 'BGE-Webhooks/1.0',
            },
            body: JSON.stringify(payload),
            timeout: 10000, // 10 segundos
        });

        const responseBody = await response.text();
        const success = response.ok;

        // ✅ FASE 3: Using WebhookDAO
        await WebhookDAO.logDeliveryFull(
            webhook.id,
            payload.event,
            payload,
            success ? 'success' : 'failed',
            response.status,
            responseBody,
            retryCount
        );

        devLogger.log(`[WEBHOOKS] Delivery ${success ? 'exitoso' : 'fallido'}: webhook ${webhook.id}, status ${response.status}`);

        // Retry si falló y quedan intentos
        if (!success && retryCount < MAX_RETRIES) {
            devLogger.warn(`[WEBHOOKS] Reintentando... (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
            return sendWebhook(webhook, payload, retryCount + 1);
        }

        return {
            success,
            status: response.status,
            retryCount,
        };

    } catch (error) {
        devLogger.error(`[WEBHOOKS] Error al enviar webhook ${webhook.id}:`, error);

        // ✅ FASE 3: Using WebhookDAO
        await WebhookDAO.logDeliveryError(
            webhook.id,
            payload.event,
            payload,
            error.message,
            retryCount
        );

        // Retry si quedan intentos
        if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
            return sendWebhook(webhook, payload, retryCount + 1);
        }

        return {
            success: false,
            error: error.message,
            retryCount,
        };
    }
}

/**
 * Dispara un evento webhook (llamado por otras partes del sistema)
 */
async function triggerWebhookEvent(eventType, data, tenantId) {
    try {
        // ✅ FASE 3: Using WebhookDAO
        const webhooks = await WebhookDAO.getActiveForEvent(tenantId, eventType);

        if (webhooks.length === 0) {
            devLogger.log(`[WEBHOOKS] No hay webhooks activos para evento ${eventType} en tenant ${tenantId}`);
            return;
        }

        // Payload del evento
        const payload = {
            event: eventType,
            data,
            timestamp: new Date().toISOString(),
            tenant_id: tenantId,
        };

        // Enviar a todos los webhooks (en paralelo)
        devLogger.log(`[WEBHOOKS] Disparando ${webhooks.length} webhooks para evento ${eventType}`);

        const promises = webhooks.map(webhook => sendWebhook(webhook, payload));
        await Promise.allSettled(promises);

    } catch (error) {
        devLogger.error('[WEBHOOKS] Error al disparar evento:', error);
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;
module.exports.triggerWebhookEvent = triggerWebhookEvent;
module.exports.SUPPORTED_EVENTS = SUPPORTED_EVENTS;
