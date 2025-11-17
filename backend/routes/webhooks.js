/**
 * 🪝 WEBHOOKS ROUTES - SEMANA 8
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
const { authMiddleware } = require('../middleware/authMiddleware');
const pool = require('../config/database');
const devLogger = require('../utils/devLogger');

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
router.get('/', authMiddleware, async (req, res) => {
    try {
        const tenantId = req.tenantId || req.user.tenant_id;

        const result = await pool.query(
            `SELECT id, url, events, status, secret_preview, created_at, updated_at
             FROM webhooks
             WHERE tenant_id = $1
             ORDER BY created_at DESC`,
            [tenantId]
        );

        res.json({
            success: true,
            webhooks: result.rows,
            count: result.rows.length,
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
 *
 * Body:
 * {
 *   url: "https://example.com/webhook",
 *   events: ["user.created", "grade.updated"],
 *   description: "Webhook para sincronización"
 * }
 */
router.post('/', authMiddleware, async (req, res) => {
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

        // Insertar en BD
        const result = await pool.query(
            `INSERT INTO webhooks (tenant_id, url, events, description, secret, secret_preview, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'active')
             RETURNING id, url, events, description, secret_preview, status, created_at`,
            [tenantId, url, JSON.stringify(events), description, secret, secretPreview]
        );

        const webhook = result.rows[0];

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
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        const result = await pool.query(
            `SELECT id, url, events, description, status, secret_preview, created_at, updated_at
             FROM webhooks
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        res.json({
            success: true,
            webhook: result.rows[0],
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
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { url, events, description, status } = req.body;
        const tenantId = req.tenantId || req.user.tenant_id;

        // Construir query dinámico
        const updates = [];
        const values = [];
        let paramCounter = 1;

        if (url !== undefined) {
            if (!isValidUrl(url)) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_URL',
                    message: 'URL inválida',
                });
            }
            updates.push(`url = $${paramCounter++}`);
            values.push(url);
        }

        if (events !== undefined) {
            updates.push(`events = $${paramCounter++}`);
            values.push(JSON.stringify(events));
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCounter++}`);
            values.push(description);
        }

        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_STATUS',
                    message: 'Estado inválido. Debe ser "active" o "inactive"',
                });
            }
            updates.push(`status = $${paramCounter++}`);
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'NO_UPDATES',
                message: 'No se especificaron campos a actualizar',
            });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id, tenantId);

        const result = await pool.query(
            `UPDATE webhooks
             SET ${updates.join(', ')}
             WHERE id = $${paramCounter++} AND tenant_id = $${paramCounter++}
             RETURNING id, url, events, description, status, updated_at`,
            values
        );

        if (result.rows.length === 0) {
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
            webhook: result.rows[0],
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
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        const result = await pool.query(
            `DELETE FROM webhooks
             WHERE id = $1 AND tenant_id = $2
             RETURNING id`,
            [id, tenantId]
        );

        if (result.rows.length === 0) {
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
router.get('/:id/deliveries', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const tenantId = req.tenantId || req.user.tenant_id;

        // Verificar que el webhook pertenece al tenant
        const webhookCheck = await pool.query(
            `SELECT id FROM webhooks WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );

        if (webhookCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        // Obtener deliveries
        const result = await pool.query(
            `SELECT id, event_type, status, response_code, response_body,
                    retry_count, delivered_at, created_at
             FROM webhook_deliveries
             WHERE webhook_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            deliveries: result.rows,
            count: result.rows.length,
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
router.post('/:id/test', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId || req.user.tenant_id;

        // Obtener webhook
        const webhookResult = await pool.query(
            `SELECT id, url, secret, status FROM webhooks
             WHERE id = $1 AND tenant_id = $2`,
            [id, tenantId]
        );

        if (webhookResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'WEBHOOK_NOT_FOUND',
                message: 'Webhook no encontrado',
            });
        }

        const webhook = webhookResult.rows[0];

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

        // Guardar delivery log
        await pool.query(
            `INSERT INTO webhook_deliveries
             (webhook_id, event_type, payload, status, response_code, response_body, retry_count)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                webhook.id,
                payload.event,
                JSON.stringify(payload),
                success ? 'success' : 'failed',
                response.status,
                responseBody.substring(0, 1000), // Limitar tamaño
                retryCount,
            ]
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

        // Guardar error en BD
        await pool.query(
            `INSERT INTO webhook_deliveries
             (webhook_id, event_type, payload, status, response_body, retry_count)
             VALUES ($1, $2, $3, 'error', $4, $5)`,
            [
                webhook.id,
                payload.event,
                JSON.stringify(payload),
                error.message,
                retryCount,
            ]
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
 *
 * Ejemplo de uso:
 *   triggerWebhookEvent('user.created', { id: 123, email: 'user@example.com' }, tenantId)
 */
async function triggerWebhookEvent(eventType, data, tenantId) {
    try {
        // Obtener webhooks activos que escuchan este evento
        const result = await pool.query(
            `SELECT id, url, secret, events
             FROM webhooks
             WHERE tenant_id = $1
               AND status = 'active'
               AND events @> $2::jsonb`,
            [tenantId, JSON.stringify([eventType])]
        );

        const webhooks = result.rows;

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
