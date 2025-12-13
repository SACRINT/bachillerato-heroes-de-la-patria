"use strict";
/**
 * 📱 NOTIFICATIONS ROUTES - TypeScript
 * APIs para gestión de notificaciones push
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const debug_logger_1 = require("../utils/debug-logger");
const auth_1 = require("../middleware/auth");
// @ts-ignore
const pushNotificationService_1 = require("../services/pushNotificationService");
const router = express_1.default.Router();
/**
 * GET /api/notifications
 * Obtener notificaciones del usuario actual
 */
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Mock implementation for now
        res.json({
            success: true,
            notifications: []
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/notifications/vapid-public-key
 * Obtener clave pública VAPID (no requiere autenticación)
 */
router.get('/vapid-public-key', (req, res) => {
    try {
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const publicKey = pushService.getVAPIDPublicKey();
        res.json({
            success: true,
            data: {
                publicKey: publicKey
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error obteniendo clave VAPID',
            message: error.message
        });
    }
});
/**
 * POST /api/notifications/subscribe
 * Suscribirse a notificaciones push
 */
router.post('/subscribe', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const { subscription, metadata = {} } = req.body;
        if (!subscription || !subscription.endpoint) {
            res.status(400).json({
                success: false,
                error: 'Suscripción inválida',
                message: 'Se requiere objeto subscription válido'
            });
            return;
        }
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📱 [NOTIFICATIONS API] Nueva suscripción para usuario ${authReq.user.id}`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const subscriptionId = await pushService.subscribe(authReq.user.id, subscription, {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            ...metadata
        });
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Usuario suscrito a notificaciones push', {
            userId: authReq.user.id,
            subscriptionId: subscriptionId
        });
        res.json({
            success: true,
            message: 'Suscripción exitosa',
            data: {
                subscriptionId: subscriptionId
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/notifications/unsubscribe/:subscriptionId
 * Cancelar suscripción a notificaciones
 */
router.delete('/unsubscribe/:subscriptionId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        const { subscriptionId } = req.params;
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📱 [NOTIFICATIONS API] Cancelando suscripción ${subscriptionId}`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const result = await pushService.unsubscribe(subscriptionId);
        if (result) {
            debug_logger_1.debugLog.log('NOTIFICATIONS', 'Suscripción cancelada', {
                userId: authReq.user.id,
                subscriptionId: subscriptionId
            });
            res.json({
                success: true,
                message: 'Suscripción cancelada exitosamente'
            });
        }
        else {
            res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/send
 * Enviar notificación (solo admins)
 */
router.post('/send', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { userIds = [], title, body, icon, url, type, priority = 'normal', requireInteraction = false, scheduled = false, scheduledAt = null } = req.body;
        if (!title || !body) {
            res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title y body'
            });
            return;
        }
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📱 [NOTIFICATIONS API] Enviando notificación: "${title}"`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const result = await pushService.sendNotification({
            userIds,
            title,
            body,
            icon,
            url,
            type,
            priority,
            requireInteraction,
            scheduled,
            scheduledAt
        });
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Notificación enviada', {
            userId: authReq.user.id,
            title: title,
            targetUsers: userIds.length || 'all',
            scheduled: scheduled
        });
        res.json({
            success: true,
            message: scheduled ? 'Notificación programada' : 'Notificación enviada',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/send-emergency
 * Enviar notificación de emergencia (solo admins)
 */
router.post('/send-emergency', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { title, body, userIds = [] } = req.body;
        if (!title || !body) {
            res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title y body para emergencia'
            });
            return;
        }
        debug_logger_1.debugLog.log('NOTIFICATIONS', `🚨 [NOTIFICATIONS API] Enviando notificación de EMERGENCIA: "${title}"`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const result = await pushService.sendEmergencyNotification(title, body, userIds);
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Notificación de emergencia enviada', {
            userId: authReq.user.id,
            title: title,
            targetUsers: userIds.length || 'all'
        });
        res.json({
            success: true,
            message: 'Notificación de emergencia enviada',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/send-grade
 * Enviar notificación de calificación (solo admins/profesores)
 */
router.post('/send-grade', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { userId, subject, grade } = req.body;
        if (!userId || !subject || grade === undefined) {
            res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren userId, subject y grade'
            });
            return;
        }
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📊 [NOTIFICATIONS API] Enviando notificación de calificación: ${subject} - ${grade}`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const result = await pushService.sendGradeNotification(userId, subject, grade);
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Notificación de calificación enviada', {
            adminId: authReq.user.id,
            studentId: userId,
            subject: subject,
            grade: grade
        });
        res.json({
            success: true,
            message: 'Notificación de calificación enviada',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/notifications/stats
 * Obtener estadísticas de notificaciones (solo admins)
 */
router.get('/stats', auth_1.requireAdmin, async (req, res, next) => {
    try {
        debug_logger_1.debugLog.log('NOTIFICATIONS', '📊 [NOTIFICATIONS API] Obteniendo estadísticas de notificaciones');
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const stats = await pushService.getSubscriptionStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/test
 * Enviar notificación de prueba (solo admins)
 */
router.post('/test', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { userId } = req.body;
        const targetUsers = userId ? [userId] : [];
        debug_logger_1.debugLog.log('NOTIFICATIONS', '🧪 [NOTIFICATIONS API] Enviando notificación de prueba');
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const result = await pushService.sendNotification({
            userIds: targetUsers,
            title: '🧪 Notificación de Prueba',
            body: 'Esta es una notificación de prueba del sistema BGE.',
            icon: '/images/notification-icon.png',
            url: '/admin-dashboard.html',
            type: 'system'
        });
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Notificación de prueba enviada', {
            userId: authReq.user.id,
            targetUser: userId || 'all'
        });
        res.json({
            success: true,
            message: 'Notificación de prueba enviada',
            data: result
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/cleanup
 * Limpiar suscripciones inactivas (solo admins)
 */
router.post('/cleanup', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { daysInactive = 30 } = req.body;
        debug_logger_1.debugLog.log('NOTIFICATIONS', `🧹 [NOTIFICATIONS API] Limpiando suscripciones inactivas (${daysInactive} días)`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const removed = await pushService.cleanupInactiveSubscriptions(daysInactive);
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Limpieza de suscripciones completada', {
            userId: authReq.user.id,
            removed: removed,
            daysInactive: daysInactive
        });
        res.json({
            success: true,
            message: `Limpieza completada: ${removed} suscripciones eliminadas`,
            data: {
                removed: removed,
                daysInactive: daysInactive
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/notifications/my-subscriptions
 * Obtener mis suscripciones activas
 */
router.get('/my-subscriptions', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const authReq = req;
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📱 [NOTIFICATIONS API] Consultando suscripciones del usuario ${authReq.user.id}`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        // @ts-ignore
        const allSubscriptions = Array.from(pushService.subscribers.values());
        const userSubscriptions = allSubscriptions.filter(sub => sub.userId === authReq.user.id && sub.active);
        const subscriptionData = userSubscriptions.map(sub => ({
            id: sub.id,
            platform: sub.metadata.platform,
            subscribedAt: sub.metadata.subscribedAt,
            lastSeen: sub.metadata.lastSeen
        }));
        res.json({
            success: true,
            data: {
                subscriptions: subscriptionData,
                total: subscriptionData.length
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/notifications/schedule
 * Programar notificación futura (solo admins)
 */
router.post('/schedule', auth_1.requireAdmin, async (req, res, next) => {
    try {
        const authReq = req;
        const { title, body, scheduledAt, userIds = [], icon, url, type } = req.body;
        if (!title || !body || !scheduledAt) {
            res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title, body y scheduledAt'
            });
            return;
        }
        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
            res.status(400).json({
                success: false,
                error: 'Fecha inválida',
                message: 'La fecha programada debe ser futura'
            });
            return;
        }
        debug_logger_1.debugLog.log('NOTIFICATIONS', `📅 [NOTIFICATIONS API] Programando notificación para ${scheduledAt}`);
        const pushService = (0, pushNotificationService_1.getPushNotificationService)();
        const scheduleId = await pushService.scheduleNotification({
            title,
            body,
            icon,
            url,
            type
        }, userIds, scheduledAt);
        debug_logger_1.debugLog.log('NOTIFICATIONS', 'Notificación programada', {
            userId: authReq.user.id,
            scheduleId: scheduleId,
            scheduledAt: scheduledAt,
            title: title
        });
        res.json({
            success: true,
            message: 'Notificación programada exitosamente',
            data: {
                scheduleId: scheduleId,
                scheduledAt: scheduledAt
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map