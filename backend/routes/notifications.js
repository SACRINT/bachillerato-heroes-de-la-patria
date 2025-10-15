/**
 * 📱 RUTAS DE NOTIFICACIONES PUSH - BGE HÉROES DE LA PATRIA
 * APIs para gestión de notificaciones push
 */

const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getPushNotificationService } = require('../services/pushNotificationService');
const { logger } = require('../middleware/logger');
const router = express.Router();

/**
 * GET /api/notifications/vapid-public-key
 * Obtener clave pública VAPID (no requiere autenticación)
 */
router.get('/vapid-public-key', (req, res) => {
    try {
        const pushService = getPushNotificationService();
        const publicKey = pushService.getVAPIDPublicKey();

        res.json({
            success: true,
            data: {
                publicKey: publicKey
            }
        });
    } catch (error) {
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
router.post('/subscribe', authenticateToken, async (req, res, next) => {
    try {
        const { subscription, metadata = {} } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Suscripción inválida',
                message: 'Se requiere objeto subscription válido'
            });
        }

        console.log(`📱 [NOTIFICATIONS API] Nueva suscripción para usuario ${req.user.id}`);

        const pushService = getPushNotificationService();
        const subscriptionId = await pushService.subscribe(req.user.id, subscription, {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            ...metadata
        });

        await logger.info('Usuario suscrito a notificaciones push', {
            userId: req.user.id,
            subscriptionId: subscriptionId
        });

        res.json({
            success: true,
            message: 'Suscripción exitosa',
            data: {
                subscriptionId: subscriptionId
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notifications/unsubscribe/:subscriptionId
 * Cancelar suscripción a notificaciones
 */
router.delete('/unsubscribe/:subscriptionId', authenticateToken, async (req, res, next) => {
    try {
        const { subscriptionId } = req.params;

        console.log(`📱 [NOTIFICATIONS API] Cancelando suscripción ${subscriptionId}`);

        const pushService = getPushNotificationService();
        const result = await pushService.unsubscribe(subscriptionId);

        if (result) {
            await logger.info('Suscripción cancelada', {
                userId: req.user.id,
                subscriptionId: subscriptionId
            });

            res.json({
                success: true,
                message: 'Suscripción cancelada exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Suscripción no encontrada'
            });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/send
 * Enviar notificación (solo admins)
 */
router.post('/send', requireAdmin, async (req, res, next) => {
    try {
        const {
            userIds = [],
            title,
            body,
            icon,
            url,
            type,
            priority = 'normal',
            requireInteraction = false,
            scheduled = false,
            scheduledAt = null
        } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title y body'
            });
        }

        console.log(`📱 [NOTIFICATIONS API] Enviando notificación: "${title}"`);

        const pushService = getPushNotificationService();
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

        await logger.info('Notificación enviada', {
            userId: req.user.id,
            title: title,
            targetUsers: userIds.length || 'all',
            scheduled: scheduled
        });

        res.json({
            success: true,
            message: scheduled ? 'Notificación programada' : 'Notificación enviada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/send-emergency
 * Enviar notificación de emergencia (solo admins)
 */
router.post('/send-emergency', requireAdmin, async (req, res, next) => {
    try {
        const { title, body, userIds = [] } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title y body para emergencia'
            });
        }

        console.log(`🚨 [NOTIFICATIONS API] Enviando notificación de EMERGENCIA: "${title}"`);

        const pushService = getPushNotificationService();
        const result = await pushService.sendEmergencyNotification(title, body, userIds);

        await logger.warn('Notificación de emergencia enviada', {
            userId: req.user.id,
            title: title,
            targetUsers: userIds.length || 'all'
        });

        res.json({
            success: true,
            message: 'Notificación de emergencia enviada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/send-grade
 * Enviar notificación de calificación (solo admins/profesores)
 */
router.post('/send-grade', requireAdmin, async (req, res, next) => {
    try {
        const { userId, subject, grade } = req.body;

        if (!userId || !subject || grade === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren userId, subject y grade'
            });
        }

        console.log(`📊 [NOTIFICATIONS API] Enviando notificación de calificación: ${subject} - ${grade}`);

        const pushService = getPushNotificationService();
        const result = await pushService.sendGradeNotification(userId, subject, grade);

        await logger.info('Notificación de calificación enviada', {
            adminId: req.user.id,
            studentId: userId,
            subject: subject,
            grade: grade
        });

        res.json({
            success: true,
            message: 'Notificación de calificación enviada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications/stats
 * Obtener estadísticas de notificaciones (solo admins)
 */
router.get('/stats', requireAdmin, async (req, res, next) => {
    try {
        console.log('📊 [NOTIFICATIONS API] Obteniendo estadísticas de notificaciones');

        const pushService = getPushNotificationService();
        const stats = await pushService.getSubscriptionStats();

        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/test
 * Enviar notificación de prueba (solo admins)
 */
router.post('/test', requireAdmin, async (req, res, next) => {
    try {
        const { userId } = req.body;
        const targetUsers = userId ? [userId] : [];

        console.log('🧪 [NOTIFICATIONS API] Enviando notificación de prueba');

        const pushService = getPushNotificationService();
        const result = await pushService.sendNotification({
            userIds: targetUsers,
            title: '🧪 Notificación de Prueba',
            body: 'Esta es una notificación de prueba del sistema BGE.',
            icon: '/images/notification-icon.png',
            url: '/admin-dashboard.html',
            type: 'system'
        });

        await logger.info('Notificación de prueba enviada', {
            userId: req.user.id,
            targetUser: userId || 'all'
        });

        res.json({
            success: true,
            message: 'Notificación de prueba enviada',
            data: result
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/cleanup
 * Limpiar suscripciones inactivas (solo admins)
 */
router.post('/cleanup', requireAdmin, async (req, res, next) => {
    try {
        const { daysInactive = 30 } = req.body;

        console.log(`🧹 [NOTIFICATIONS API] Limpiando suscripciones inactivas (${daysInactive} días)`);

        const pushService = getPushNotificationService();
        const removed = await pushService.cleanupInactiveSubscriptions(daysInactive);

        await logger.info('Limpieza de suscripciones completada', {
            userId: req.user.id,
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
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notifications/my-subscriptions
 * Obtener mis suscripciones activas
 */
router.get('/my-subscriptions', authenticateToken, async (req, res, next) => {
    try {
        console.log(`📱 [NOTIFICATIONS API] Consultando suscripciones del usuario ${req.user.id}`);

        const pushService = getPushNotificationService();
        const allSubscriptions = Array.from(pushService.subscribers.values());
        const userSubscriptions = allSubscriptions.filter(
            sub => sub.userId === req.user.id && sub.active
        );

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
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notifications/schedule
 * Programar notificación futura (solo admins)
 */
router.post('/schedule', requireAdmin, async (req, res, next) => {
    try {
        const {
            title,
            body,
            scheduledAt,
            userIds = [],
            icon,
            url,
            type
        } = req.body;

        if (!title || !body || !scheduledAt) {
            return res.status(400).json({
                success: false,
                error: 'Datos incompletos',
                message: 'Se requieren title, body y scheduledAt'
            });
        }

        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
            return res.status(400).json({
                success: false,
                error: 'Fecha inválida',
                message: 'La fecha programada debe ser futura'
            });
        }

        console.log(`📅 [NOTIFICATIONS API] Programando notificación para ${scheduledAt}`);

        const pushService = getPushNotificationService();
        const scheduleId = await pushService.scheduleNotification({
            title,
            body,
            icon,
            url,
            type
        }, userIds, scheduledAt);

        await logger.info('Notificación programada', {
            userId: req.user.id,
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
    } catch (error) {
        next(error);
    }
});

module.exports = router;