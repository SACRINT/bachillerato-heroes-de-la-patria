/**
 * 📦 SERVICIO DE DESPACHO Y COLA DE WEBHOOKS (BGE HÉROES DE LA PATRIA)
 * backend/services/webhook-delivery.js
 * 
 * Responsabilidades:
 * - Generación de firma criptográfica HMAC-SHA256 (X-Webhook-Signature)
 * - Envío HTTP POST de payloads a URLs externas suscritas
 * - Manejo de reintentos con retroceso exponencial (Exponential Backoff):
 *     * Intento 1: Inmediato (0s)
 *     * Intento 2: +30 segundos
 *     * Intento 3: +2 minutos (120s)
 *     * Intento 4: +10 minutos (600s)
 *     * Intento 5: Fallido definitivo (status: 'failed')
 * - Limitación estricta de response_body a 1KB (1024 caracteres) para no saturar la BD
 * - Procesador de reintentos pendientes para entornos serverless y persistentes
 */

const crypto = require('crypto');
const { pool } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

// ⏱️ Cronograma de reintentos (delays en milisegundos según el intento actual)
// Índice = número de intentos ya realizados
const RETRY_DELAYS_MS = [
    0,           // Intento 1: Inmediato
    30 * 1000,   // Intento 2: +30 segundos
    120 * 1000,  // Intento 3: +2 minutos
    600 * 1000   // Intento 4: +10 minutos
];

const MAX_ATTEMPTS = 5;
const MAX_RESPONSE_BODY = 1024; // Límite estricto de 1KB
const HTTP_TIMEOUT_MS = 8000;  // 8 segundos de timeout por llamada

class WebhookDeliveryService {
    get RETRY_DELAYS() { return [0, 30, 120, 600]; }
    get MAX_ATTEMPTS() { return MAX_ATTEMPTS; }
    get MAX_RESPONSE_BODY() { return MAX_RESPONSE_BODY; }

    /**
     * Alias de generateSignature
     */
    signPayload(payload, secret) {
        return this.generateSignature(payload, secret);
    }

    /**
     * Retorna el retardo en segundos para el siguiente reintento tras haber fallado N intentos.
     * Retorna null si ya se alcanzó el límite de MAX_ATTEMPTS (5).
     * @param {number} failedAttempts - Cantidad de intentos fallidos (1 a 5)
     * @returns {number|null}
     */
    getRetryDelaySeconds(failedAttempts) {
        if (failedAttempts >= MAX_ATTEMPTS) return null;
        const delaysSec = [30, 120, 600, 600];
        return delaysSec[failedAttempts - 1] !== undefined ? delaysSec[failedAttempts - 1] : 600;
    }

    /**
     * Generar firma HMAC-SHA256 para el payload
     * @param {Object|string} payload - Objeto o string JSON del payload
     * @param {string} secret - Secreto compartido de la suscripción
     * @returns {string|null} Firma con formato sha256=<hex>
     */
    generateSignature(payload, secret) {
        if (!secret) return null;
        try {
            const hmac = crypto.createHmac('sha256', secret);
            const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
            const hash = hmac.update(payloadStr, 'utf8').digest('hex');
            return `sha256=${hash}`;
        } catch (err) {
            devLogger.error('[WEBHOOK-DELIVERY] Error generando firma HMAC:', err.message);
            return null;
        }
    }

    /**
     * Verificar si una firma recibida coincide con la esperada
     * @param {Object|string} payload
     * @param {string} signature - Firma recibida (sha256=...)
     * @param {string} secret
     * @returns {boolean}
     */
    verifySignature(payload, signature, secret) {
        if (!signature || !secret) return false;
        const expected = this.generateSignature(payload, secret);
        if (!expected) return false;

        try {
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        } catch (e) {
            return false;
        }
    }

    /**
     * Despachar un registro específico de la bitácora (por logId)
     * @param {number} logId - ID en webhook_delivery_log
     * @returns {Promise<Object>} Resultado de la entrega
     */
    async deliverLogEntry(logId) {
        // 1. Obtener registro de entrega y datos de la suscripción
        const queryRes = await pool.query(
            `SELECT l.*, s.url, s.secret, s.active as subscription_active
             FROM webhook_delivery_log l
             JOIN webhook_subscriptions s ON s.id = l.webhook_id
             WHERE l.id = $1;`,
            [logId]
        );

        if (queryRes.rows.length === 0) {
            throw new Error(`Registro de entrega con ID ${logId} no encontrado`);
        }

        const log = queryRes.rows[0];

        // Si la suscripción fue desactivada, cancelar entrega
        if (!log.subscription_active) {
            await pool.query(
                `UPDATE webhook_delivery_log 
                 SET status = 'failed', response_body = 'Suscripción desactivada por el administrador'
                 WHERE id = $1;`,
                [logId]
            );
            return { success: false, error: 'Subscription inactive', status: 'failed' };
        }

        const currentAttempt = (log.attempts || 0) + 1;
        const payloadStr = JSON.stringify(log.payload);
        const signature = this.generateSignature(log.payload, log.secret);

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'BGE-Webhook-Dispatcher/1.0 (Bachillerato General Estatal Héroes de la Patria)',
            'X-Webhook-Event': log.event,
            'X-Webhook-Delivery': String(log.id),
            'X-Webhook-Timestamp': new Date().toISOString()
        };

        if (signature) {
            headers['X-Webhook-Signature'] = signature;
        }

        let responseCode = null;
        let responseBody = '';
        let isSuccess = false;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

        try {
            const response = await fetch(log.url, {
                method: 'POST',
                headers,
                body: payloadStr,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            responseCode = response.status;
            const rawText = await response.text();
            responseBody = (rawText || '').substring(0, MAX_RESPONSE_BODY);

            // Consideramos éxito cualquier código 2xx
            if (responseCode >= 200 && responseCode < 300) {
                isSuccess = true;
            }
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            responseCode = fetchErr.name === 'AbortError' ? 408 : 500;
            const errorMsg = fetchErr.name === 'AbortError' 
                ? `Timeout excedido (${HTTP_TIMEOUT_MS}ms) al conectar con ${log.url}`
                : `Error de red: ${fetchErr.message}`;
            responseBody = errorMsg.substring(0, MAX_RESPONSE_BODY);
        }

        // Determinar nuevo estado y cronograma de reintentos
        if (isSuccess) {
            await pool.query(
                `UPDATE webhook_delivery_log
                 SET status = 'delivered',
                     response_code = $1,
                     response_body = $2,
                     attempts = $3,
                     next_retry_at = NULL,
                     delivered_at = NOW()
                 WHERE id = $4;`,
                [responseCode, responseBody, currentAttempt, logId]
            );

            devLogger.log(`✅ [WEBHOOK] Entrega exitosa logId: ${logId} evento: ${log.event} status: ${responseCode}`);
            return {
                success: true,
                status: 'delivered',
                responseCode,
                responseBody,
                attempt: currentAttempt
            };
        } else {
            // Falló este intento
            if (currentAttempt >= MAX_ATTEMPTS) {
                // Alcanzó límite máximo de 5 intentos -> FAILED definitivo
                await pool.query(
                    `UPDATE webhook_delivery_log
                     SET status = 'failed',
                         response_code = $1,
                         response_body = $2,
                         attempts = $3,
                         next_retry_at = NULL
                     WHERE id = $4;`,
                    [responseCode, responseBody, currentAttempt, logId]
                );

                devLogger.warn(`❌ [WEBHOOK] Entrega fallida definitiva logId: ${logId} tras ${currentAttempt} intentos.`);
                return {
                    success: false,
                    status: 'failed',
                    responseCode,
                    responseBody,
                    attempt: currentAttempt
                };
            } else {
                // Programar siguiente reintento según exponential backoff
                const delayMs = RETRY_DELAYS_MS[currentAttempt] || 600000;
                const nextRetryAt = new Date(Date.now() + delayMs);

                await pool.query(
                    `UPDATE webhook_delivery_log
                     SET status = 'pending',
                         response_code = $1,
                         response_body = $2,
                         attempts = $3,
                         next_retry_at = $4
                     WHERE id = $5;`,
                    [responseCode, responseBody, currentAttempt, nextRetryAt, logId]
                );

                devLogger.log(`⏳ [WEBHOOK] Reintento programado logId: ${logId} intento: ${currentAttempt + 1}/${MAX_ATTEMPTS} en ${delayMs / 1000}s`);
                return {
                    success: false,
                    status: 'pending',
                    responseCode,
                    responseBody,
                    attempt: currentAttempt,
                    nextRetryAt
                };
            }
        }
    }

    /**
     * Procesar cola de reintentos pendientes (con límite para serverless)
     * @param {number} limit - Máximo número de entregas a procesar
     * @returns {Promise<Object>} Resumen del lote
     */
    async processPendingRetries(limit = 50) {
        try {
            const pendingRes = await pool.query(
                `SELECT id 
                 FROM webhook_delivery_log 
                 WHERE status = 'pending' AND next_retry_at <= NOW()
                 ORDER BY next_retry_at ASC 
                 LIMIT $1;`,
                [limit]
            );

            const summary = {
                totalFound: pendingRes.rows.length,
                delivered: 0,
                retried: 0,
                failed: 0
            };

            for (const row of pendingRes.rows) {
                try {
                    const result = await this.deliverLogEntry(row.id);
                    if (result.status === 'delivered') summary.delivered++;
                    else if (result.status === 'pending') summary.retried++;
                    else if (result.status === 'failed') summary.failed++;
                } catch (err) {
                    summary.failed++;
                    devLogger.error(`[WEBHOOK-RETRY] Error procesando logId ${row.id}:`, err.message);
                }
            }

            return summary;
        } catch (err) {
            devLogger.error('[WEBHOOK-RETRY] Error en processPendingRetries:', err.message);
            return { totalFound: 0, delivered: 0, retried: 0, failed: 0, error: err.message };
        }
    }
}

module.exports = new WebhookDeliveryService();
