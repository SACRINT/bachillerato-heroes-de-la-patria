"use strict";
/**
 * 🔔 PUSH NOTIFICATIONS SERVICE
 * Sistema de notificaciones push con Web Push API
 * Creado: 19 Enero 2026
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const webpush = require('web-push');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { executeQuery } = require('../config/database');
const debugLog = require('../utils/debug-logger');
const { sanitizeError } = require('../middleware/errorHandler');
const router = express_1.default.Router();
// VAPID Keys - These should be in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGE-demo-public-key-placeholder-for-development';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'BGE-demo-private-key-placeholder';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@bge-heroes.edu.mx';
// Configure web-push
try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}
catch (error) {
    debugLog.warn('PUSH', 'Web Push VAPID configuration failed - using demo mode');
}
// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================
/**
 * POST /api/push/subscribe
 * Subscribe user to push notifications
 */
router.post('/subscribe', authenticateToken, [
    (0, express_validator_1.body)('subscription').isObject().withMessage('Subscription object required'),
    (0, express_validator_1.body)('subscription.endpoint').isURL().withMessage('Valid endpoint required'),
    (0, express_validator_1.body)('subscription.keys.p256dh').notEmpty(),
    (0, express_validator_1.body)('subscription.keys.auth').notEmpty()
], async (req, res) => {
    try {
        const authReq = req;
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { subscription, device_name, device_type } = req.body;
        // Check if subscription already exists
        const existing = await executeQuery(`
            SELECT id FROM push_subscriptions 
            WHERE usuario_id = $1 AND endpoint = $2
        `, [authReq.user.id, subscription.endpoint]);
        if (existing && existing.length > 0) {
            // Update existing subscription
            await executeQuery(`
                UPDATE push_subscriptions 
                SET keys_p256dh = $1, keys_auth = $2, updated_at = CURRENT_TIMESTAMP, activo = true
                WHERE id = $3
            `, [subscription.keys.p256dh, subscription.keys.auth, existing[0].id]);
        }
        else {
            // Create new subscription
            await executeQuery(`
                INSERT INTO push_subscriptions (usuario_id, endpoint, keys_p256dh, keys_auth, device_name, device_type)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                authReq.user.id,
                subscription.endpoint,
                subscription.keys.p256dh,
                subscription.keys.auth,
                device_name || 'Unknown Device',
                device_type || 'web'
            ]);
        }
        res.json({
            success: true,
            message: 'Suscripción registrada exitosamente'
        });
        debugLog.log('PUSH', `User ${authReq.user.id} subscribed to push notifications`);
    }
    catch (error) {
        debugLog.error('PUSH', 'Error subscribing to push', sanitizeError(error, 'PUSH'));
        res.status(500).json({ success: false, message: 'Error al registrar suscripción' });
    }
});
/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { endpoint } = req.body;
        if (endpoint) {
            // Unsubscribe specific endpoint
            await executeQuery(`
                UPDATE push_subscriptions 
                SET activo = false, updated_at = CURRENT_TIMESTAMP
                WHERE usuario_id = $1 AND endpoint = $2
            `, [authReq.user.id, endpoint]);
        }
        else {
            // Unsubscribe all
            await executeQuery(`
                UPDATE push_subscriptions 
                SET activo = false, updated_at = CURRENT_TIMESTAMP
                WHERE usuario_id = $1
            `, [authReq.user.id]);
        }
        res.json({
            success: true,
            message: 'Suscripción cancelada'
        });
    }
    catch (error) {
        debugLog.error('PUSH', 'Error unsubscribing', sanitizeError(error, 'PUSH'));
        res.status(500).json({ success: false, message: 'Error al cancelar suscripción' });
    }
});
/**
 * GET /api/push/vapid-key
 * Get public VAPID key for client
 */
router.get('/vapid-key', (req, res) => {
    res.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
    });
});
// ============================================
// SEND NOTIFICATIONS
// ============================================
/**
 * POST /api/push/send
 * Send push notification to specific user
 */
router.post('/send', authenticateToken, requireRole(['admin', 'docente']), [
    (0, express_validator_1.body)('user_id').isInt({ min: 1 }),
    (0, express_validator_1.body)('title').notEmpty(),
    (0, express_validator_1.body)('body').notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { user_id, title, body, icon, tag, data, actions } = req.body;
        const result = await sendPushToUser(user_id, {
            title,
            body,
            icon: icon || '/images/logo-bachillerato-HDLP.webp',
            badge: '/images/badge-72x72.png',
            tag,
            data,
            actions
        });
        res.json({
            success: true,
            message: `Notificación enviada: ${result.sent} dispositivos`,
            data: result
        });
    }
    catch (error) {
        debugLog.error('PUSH', 'Error sending push notification', sanitizeError(error, 'PUSH'));
        res.status(500).json({ success: false, message: 'Error al enviar notificación' });
    }
});
/**
 * POST /api/push/broadcast
 * Send push notification to role group
 */
router.post('/broadcast', authenticateToken, requireRole(['admin']), [
    (0, express_validator_1.body)('role').isIn(['estudiante', 'padre', 'docente', 'admin', 'all']),
    (0, express_validator_1.body)('title').notEmpty(),
    (0, express_validator_1.body)('body').notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ success: false, errors: errors.array() });
            return;
        }
        const { role, title, body, icon, tag, data } = req.body;
        const result = await broadcastPushToRole(role, {
            title,
            body,
            icon: icon || '/images/logo-bachillerato-HDLP.webp',
            badge: '/images/badge-72x72.png',
            tag,
            data
        });
        res.json({
            success: true,
            message: `Broadcast enviado: ${result.sent} dispositivos`,
            data: result
        });
    }
    catch (error) {
        debugLog.error('PUSH', 'Error broadcasting notification', sanitizeError(error, 'PUSH'));
        res.status(500).json({ success: false, message: 'Error al enviar broadcast' });
    }
});
// ============================================
// PUSH SERVICE FUNCTIONS
// ============================================
/**
 * Send push notification to specific user
 */
async function sendPushToUser(userId, payload) {
    const subscriptions = await executeQuery(`
        SELECT endpoint, keys_p256dh, keys_auth
        FROM push_subscriptions
        WHERE usuario_id = $1 AND activo = true
    `, [userId]);
    return await sendPushToSubscriptions(subscriptions, payload);
}
/**
 * Broadcast push notification to role
 */
async function broadcastPushToRole(role, payload) {
    let query = `
        SELECT ps.endpoint, ps.keys_p256dh, ps.keys_auth
        FROM push_subscriptions ps
        JOIN usuarios u ON ps.usuario_id = u.id
        WHERE ps.activo = true
    `;
    const params = [];
    if (role !== 'all') {
        query += ' AND u.role = $1';
        params.push(role);
    }
    const subscriptions = await executeQuery(query, params);
    return await sendPushToSubscriptions(subscriptions, payload);
}
/**
 * Send push to array of subscriptions
 */
async function sendPushToSubscriptions(subscriptions, payload) {
    let sent = 0;
    let failed = 0;
    const payloadString = JSON.stringify(payload);
    for (const sub of subscriptions) {
        try {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.keys_p256dh,
                    auth: sub.keys_auth
                }
            };
            await webpush.sendNotification(pushSubscription, payloadString);
            sent++;
        }
        catch (error) {
            failed++;
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
                await executeQuery(`
                    UPDATE push_subscriptions 
                    SET activo = false 
                    WHERE endpoint = $1
                `, [sub.endpoint]);
                debugLog.log('PUSH', `Removed invalid subscription: ${sub.endpoint.substring(0, 50)}...`);
            }
        }
    }
    debugLog.log('PUSH', `Push sent: ${sent} success, ${failed} failed`);
    return { sent, failed };
}
// Export functions for use in other services
exports.PushNotificationService = {
    sendToUser: sendPushToUser,
    broadcastToRole: broadcastPushToRole
};
exports.default = router;
