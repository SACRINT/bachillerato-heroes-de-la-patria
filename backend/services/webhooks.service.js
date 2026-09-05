/**
 * 🛰️ SERVICIO DE GESTIÓN Y EMISIÓN DE WEBHOOKS (BGE HÉROES DE LA PATRIA)
 * backend/services/webhooks.service.js
 * 
 * Responsabilidades:
 * - Registro y administración de suscripciones por tenant escolar
 * - Generación segura de secretos criptográficos con crypto.randomBytes(32)
 * - Emisión asíncrona no bloqueante (fire-and-forget) de eventos canónicos:
 *     * student.review.completed
 *     * student.deck.completed
 *     * student.streak.achieved
 *     * teacher.deck.created
 *     * tutor.session.completed
 *     * alert.low.retention
 * - Despacho de pruebas interactivas con retorno de latencia y código de respuesta
 * - Consulta de bitácora histórica y métricas de interoperabilidad
 */

const crypto = require('crypto');
const { pool } = require('../config/database.js');
const webhookDelivery = require('./webhook-delivery.js');
const devLogger = require('../utils/devLogger.js');

// 📋 Catálogo oficial de eventos soportados en la plataforma escolar BGE
const EVENT_TYPES = [
    'student.review.completed',
    'student.deck.completed',
    'student.streak.achieved',
    'teacher.deck.created',
    'tutor.session.completed',
    'alert.low.retention'
];

class WebhooksService {
    constructor() {
        this.EVENT_TYPES = EVENT_TYPES;
    }

    get SUPPORTED_EVENTS() {
        return [...EVENT_TYPES];
    }

    /**
     * Generar un secreto seguro para firma HMAC (whsec_ + 64 hex chars)
     */
    generateSecret() {
        return `whsec_${crypto.randomBytes(32).toString('hex')}`;
    }

    /**
     * Listar suscripciones de webhooks por tenant
     * @param {number} tenantId
     * @param {string|null} eventFilter
     * @param {boolean} activeOnly
     */
    async getSubscriptions(tenantId = 1, eventFilter = null, activeOnly = false) {
        let sql = `SELECT * FROM webhook_subscriptions WHERE tenant_id = $1`;
        const params = [tenantId];

        if (activeOnly) {
            sql += ` AND active = true`;
        }

        if (eventFilter) {
            params.push(eventFilter);
            sql += ` AND ($${params.length} = ANY(events) OR '*' = ANY(events))`;
        }

        sql += ` ORDER BY id DESC;`;
        const res = await pool.query(sql, params);
        return res.rows;
    }

    /**
     * Obtener una suscripción por ID
     */
    async getSubscriptionById(id, tenantId = 1) {
        const res = await pool.query(
            `SELECT * FROM webhook_subscriptions WHERE id = $1 AND tenant_id = $2;`,
            [id, tenantId]
        );
        return res.rows[0] || null;
    }

    /**
     * Registrar una nueva suscripción a webhooks
     */
    async createSubscription({ tenant_id = 1, url, events, secret = null, active = true }) {
        if (!url || typeof url !== 'string' || (!url.startsWith('http://') && !url.startsWith('https://'))) {
            throw new Error('URL inválida: Debe comenzar con http:// o https://');
        }

        const eventsArray = Array.isArray(events) ? events : [events];
        if (eventsArray.length === 0) {
            throw new Error('Debes suscribir al menos un evento');
        }

        // Generar secreto criptográfico si no fue provisto
        const finalSecret = secret && secret.trim().length > 0 
            ? secret.trim() 
            : this.generateSecret();

        const res = await pool.query(
            `INSERT INTO webhook_subscriptions (tenant_id, url, events, secret, active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
             RETURNING *;`,
            [tenant_id, url.trim(), eventsArray, finalSecret, active]
        );

        devLogger.log(`🛰️ [WEBHOOKS] Nueva suscripción creada id: ${res.rows[0].id} url: ${url}`);
        return res.rows[0];
    }

    /**
     * Actualizar una suscripción existente
     */
    async updateSubscription(id, { url, events, secret, active }, tenantId = 1) {
        const existing = await this.getSubscriptionById(id, tenantId);
        if (!existing) {
            throw new Error('Suscripción no encontrada');
        }

        const newUrl = url !== undefined ? url.trim() : existing.url;
        const newEvents = events !== undefined ? (Array.isArray(events) ? events : [events]) : existing.events;
        const newSecret = secret !== undefined ? secret : existing.secret;
        const newActive = active !== undefined ? Boolean(active) : existing.active;

        const res = await pool.query(
            `UPDATE webhook_subscriptions
             SET url = $1, events = $2, secret = $3, active = $4, updated_at = NOW()
             WHERE id = $5 AND tenant_id = $6
             RETURNING *;`,
            [newUrl, newEvents, newSecret, newActive, id, tenantId]
        );

        return res.rows[0];
    }

    /**
     * Eliminar una suscripción
     */
    async deleteSubscription(id, tenantId = 1) {
        const res = await pool.query(
            `DELETE FROM webhook_subscriptions WHERE id = $1 AND tenant_id = $2 RETURNING id;`,
            [id, tenantId]
        );
        return res.rows.length > 0;
    }

    /**
     * Obtener bitácora de entregas con paginación
     */
    async getDeliveryLogs(tenantId = 1, { limit = 50, offset = 0, webhookId = null, status = null } = {}) {
        let sql = `
            SELECT l.*, s.url, s.events as subscribed_events
            FROM webhook_delivery_log l
            JOIN webhook_subscriptions s ON s.id = l.webhook_id
            WHERE s.tenant_id = $1
        `;
        const params = [tenantId];

        if (webhookId) {
            params.push(webhookId);
            sql += ` AND l.webhook_id = $${params.length}`;
        }

        if (status) {
            params.push(status);
            sql += ` AND l.status = $${params.length}`;
        }

        params.push(limit);
        const limitParam = `$${params.length}`;
        params.push(offset);
        const offsetParam = `$${params.length}`;

        sql += ` ORDER BY l.created_at DESC LIMIT ${limitParam} OFFSET ${offsetParam};`;

        const logsRes = await pool.query(sql, params);

        // Conteo total para paginación
        let countSql = `
            SELECT count(*) as total
            FROM webhook_delivery_log l
            JOIN webhook_subscriptions s ON s.id = l.webhook_id
            WHERE s.tenant_id = $1
        `;
        const countParams = [tenantId];
        if (webhookId) {
            countParams.push(webhookId);
            countSql += ` AND l.webhook_id = $${countParams.length}`;
        }
        if (status) {
            countParams.push(status);
            countSql += ` AND l.status = $${countParams.length}`;
        }
        const countRes = await pool.query(countSql, countParams);

        return {
            total: parseInt(countRes.rows[0]?.total || 0),
            limit,
            offset,
            logs: logsRes.rows
        };
    }

    /**
     * Obtener métricas resumidas para el panel de administración
     */
    async getWebhookStats(tenantId = 1) {
        const subsRes = await pool.query(
            `SELECT 
                count(*)::int as total_subscriptions,
                count(CASE WHEN active = true THEN 1 END)::int as active_subscriptions
             FROM webhook_subscriptions 
             WHERE tenant_id = $1;`,
            [tenantId]
        );

        const logsRes = await pool.query(
            `SELECT 
                count(*)::int as total_deliveries,
                count(CASE WHEN status = 'delivered' THEN 1 END)::int as successful_deliveries,
                count(CASE WHEN status = 'pending' THEN 1 END)::int as pending_deliveries,
                count(CASE WHEN status = 'failed' THEN 1 END)::int as failed_deliveries
             FROM webhook_delivery_log l
             JOIN webhook_subscriptions s ON s.id = l.webhook_id
             WHERE s.tenant_id = $1;`,
            [tenantId]
        );

        const totalDeliveries = logsRes.rows[0]?.total_deliveries || 0;
        const successful = logsRes.rows[0]?.successful_deliveries || 0;
        const successRate = totalDeliveries > 0 
            ? Number(((successful / totalDeliveries) * 100).toFixed(1)) 
            : 100;

        return {
            totalSubscriptions: subsRes.rows[0]?.total_subscriptions || 0,
            activeSubscriptions: subsRes.rows[0]?.active_subscriptions || 0,
            totalDeliveries,
            successfulDeliveries: successful,
            pendingDeliveries: logsRes.rows[0]?.pending_deliveries || 0,
            failedDeliveries: logsRes.rows[0]?.failed_deliveries || 0,
            successRate
        };
    }

    /**
     * =========================================================================
     * EMISOR DE EVENTOS (FIRE-AND-FORGET)
     * =========================================================================
     * Encola la entrega en la base de datos y la despacha de forma asíncrona sin
     * bloquear la respuesta al usuario.
     */
    async triggerEvent(event, data, tenantId = 1) {
        try {
            // Construir payload canónico
            const payload = {
                event,
                tenant_id: tenantId,
                timestamp: new Date().toISOString(),
                data: data || {}
            };

            // Buscar suscriptores activos para este evento o comodín '*'
            const subsRes = await pool.query(
                `SELECT id, url, secret
                 FROM webhook_subscriptions
                 WHERE tenant_id = $1 
                   AND active = true 
                   AND ($2 = ANY(events) OR '*' = ANY(events));`,
                [tenantId, event]
            );

            if (subsRes.rows.length === 0) {
                devLogger.log(`ℹ️ [WEBHOOKS] Evento emitido '${event}' sin suscriptores activos.`);
                return { success: true, event, enqueuedCount: 0 };
            }

            const enqueuedLogs = [];

            // Insertar en la bitácora de entregas para cada suscriptor
            for (const sub of subsRes.rows) {
                const logRes = await pool.query(
                    `INSERT INTO webhook_delivery_log (webhook_id, event, payload, status, attempts, created_at)
                     VALUES ($1, $2, $3, 'pending', 0, NOW())
                     RETURNING id;`,
                    [sub.id, event, JSON.stringify(payload)]
                );
                enqueuedLogs.push(logRes.rows[0].id);
            }

            devLogger.log(`🚀 [WEBHOOKS] Evento '${event}' encolado para ${enqueuedLogs.length} suscripciones.`);

            // Despacho inmediato asíncrono no bloqueante (Fire-and-Forget)
            setImmediate(async () => {
                for (const logId of enqueuedLogs) {
                    webhookDelivery.deliverLogEntry(logId).catch(err => {
                        devLogger.warn(`[WEBHOOK-DISPATCH] Error asíncrono en logId ${logId}:`, err.message);
                    });
                }
                // Barrido ligero de reintentos acumulados
                webhookDelivery.processPendingRetries(10).catch(() => {});
            });

            return {
                success: true,
                event,
                enqueuedCount: enqueuedLogs.length,
                logIds: enqueuedLogs
            };
        } catch (err) {
            devLogger.error(`❌ [WEBHOOKS] Error al emitir evento '${event}':`, err.message);
            // No arrojar error para no romper la experiencia principal del usuario
            return {
                success: false,
                event,
                error: err.message
            };
        }
    }

    /**
     * Enviar un payload de prueba interactivo a una suscripción específica
     */
    async testWebhook(webhookId, tenantId = 1) {
        const sub = await this.getSubscriptionById(webhookId, tenantId);
        if (!sub) {
            throw new Error(`Suscripción con ID ${webhookId} no encontrada`);
        }

        const testPayload = {
            event: 'test.ping',
            tenant_id: tenantId,
            timestamp: new Date().toISOString(),
            data: {
                message: 'Prueba de conexión de webhook desde Bachillerato General Estatal Héroes de la Patria',
                webhook_id: sub.id,
                target_url: sub.url,
                subscribed_events: sub.events,
                environment: process.env.NODE_ENV || 'production'
            }
        };

        const startTime = Date.now();

        // Registrar en la bitácora
        const logRes = await pool.query(
            `INSERT INTO webhook_delivery_log (webhook_id, event, payload, status, attempts, created_at)
             VALUES ($1, 'test.ping', $2, 'pending', 0, NOW())
             RETURNING id;`,
            [sub.id, JSON.stringify(testPayload)]
        );

        const logId = logRes.rows[0].id;

        // Despachar inmediatamente esperando la respuesta (modo síncrono para feedback interactivo en admin)
        const deliveryResult = await webhookDelivery.deliverLogEntry(logId);
        const latencyMs = Date.now() - startTime;

        return {
            logId,
            webhookId: sub.id,
            url: sub.url,
            latencyMs,
            ...deliveryResult
        };
    }
}

module.exports = new WebhooksService();
