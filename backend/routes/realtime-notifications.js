/**
 * 🔔 REALTIME NOTIFICATIONS ROUTES
 * Endpoints para notificaciones en tiempo real
 * 
 * REFACTORIZADO: 04 Diciembre 2025
 * - Usa notification.service.js unificado
 * - Usa RealtimeChannel para funcionalidad de usuarios online
 */

const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

// Servicios refactorizados
const notificationService = require('../services/notification.service');
const RealtimeChannel = require('../services/channels/RealtimeChannel');

// Middleware de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array()
        });
    }
    next();
};

// =====================================
// OBTENER NOTIFICACIONES
// =====================================

/**
 * GET /api/notifications
 * Obtiene notificaciones del usuario
 */
router.get('/',
    authenticateToken,
    [
        query('unreadOnly').optional().isBoolean(),
        query('type').optional().isString(),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    async (req, res) => {
        try {
            const options = {
                unreadOnly: req.query.unreadOnly === 'true',
                type: req.query.type,
                limit: parseInt(req.query.limit) || 50,
                offset: parseInt(req.query.offset) || 0
            };

            const notifications = await notificationService.getUserNotifications(
                req.user.id,
                options
            );

            res.json({
                success: true,
                data: notifications,
                pagination: {
                    limit: options.limit,
                    offset: options.offset,
                    count: notifications.length
                }
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error obteniendo notificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones'
            });
        }
    }
);

/**
 * GET /api/notifications/unread-count
 * Cuenta notificaciones no leídas
 */
router.get('/unread-count',
    authenticateToken,
    async (req, res) => {
        try {
            const count = await notificationService.getUnreadCount(req.user.id);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error contando no leídas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al contar notificaciones'
            });
        }
    }
);

/**
 * GET /api/notifications/online-users
 * Obtiene usuarios online (admin only)
 */
router.get('/online-users',
    authenticateToken,
    async (req, res) => {
        try {
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso solo para administradores'
                });
            }

            const onlineUsers = RealtimeChannel.getOnlineUsers();

            res.json({
                success: true,
                data: {
                    count: onlineUsers.length,
                    userIds: onlineUsers
                }
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error obteniendo usuarios online:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener usuarios online'
            });
        }
    }
);

// =====================================
// ACCIONES DE NOTIFICACIONES
// =====================================

/**
 * PUT /api/notifications/:id/read
 * Marca notificación como leída
 */
router.put('/:id/read',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const success = await notificationService.markAsRead(
                req.user.id,
                parseInt(req.params.id)
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Notificación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Notificación marcada como leída'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marcando como leída:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar notificación'
            });
        }
    }
);

/**
 * PUT /api/notifications/read-all
 * Marca todas como leídas
 */
router.put('/read-all',
    authenticateToken,
    async (req, res) => {
        try {
            await notificationService.markAllAsRead(req.user.id);

            res.json({
                success: true,
                message: 'Todas las notificaciones marcadas como leídas'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error marcando todas como leídas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al marcar notificaciones'
            });
        }
    }
);

/**
 * DELETE /api/notifications/:id
 * Archiva notificación
 */
router.delete('/:id',
    authenticateToken,
    [param('id').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            await notificationService.archiveNotification(
                req.user.id,
                parseInt(req.params.id)
            );

            res.json({
                success: true,
                message: 'Notificación archivada'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error archivando:', error);
            res.status(500).json({
                success: false,
                message: 'Error al archivar notificación'
            });
        }
    }
);

// =====================================
// PREFERENCIAS
// =====================================

/**
 * GET /api/notifications/preferences
 * Obtiene preferencias de notificación
 */
router.get('/preferences',
    authenticateToken,
    async (req, res) => {
        try {
            const preferences = await notificationService.getUserPreferences(req.user.id);

            res.json({
                success: true,
                data: preferences
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error obteniendo preferencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener preferencias'
            });
        }
    }
);

/**
 * PUT /api/notifications/preferences
 * Actualiza preferencias
 */
router.put('/preferences',
    authenticateToken,
    [
        body('enable_push').optional().isBoolean(),
        body('enable_email').optional().isBoolean(),
        body('enable_sms').optional().isBoolean(),
        body('enable_in_app').optional().isBoolean(),
        body('notify_achievements').optional().isBoolean(),
        body('notify_challenges').optional().isBoolean(),
        body('notify_messages').optional().isBoolean(),
        body('notify_system').optional().isBoolean(),
        body('notify_marketing').optional().isBoolean(),
        body('quiet_hours_start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        body('quiet_hours_end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        body('timezone').optional().isString(),
        body('email_digest').optional().isIn(['none', 'daily', 'weekly'])
    ],
    validate,
    async (req, res) => {
        try {
            const updated = await notificationService.updatePreferences(
                req.user.id,
                req.body
            );

            res.json({
                success: true,
                data: updated,
                message: 'Preferencias actualizadas'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error actualizando preferencias:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar preferencias'
            });
        }
    }
);

// =====================================
// ENVÍO DE NOTIFICACIONES (ADMIN)
// =====================================

/**
 * POST /api/notifications/send
 * Envía notificación a usuario(s)
 */
router.post('/send',
    authenticateToken,
    [
        body('userIds').isArray({ min: 1 }),
        body('userIds.*').isInt({ min: 1 }),
        body('title').isString().isLength({ min: 1, max: 200 }),
        body('message').isString().isLength({ min: 1 }),
        body('type').optional().isIn(['system', 'achievement', 'challenge', 'message', 'alert', 'marketing']),
        body('category').optional().isIn(['info', 'success', 'warning', 'error', 'reward']),
        body('priority').optional().isInt({ min: 0, max: 2 }),
        body('actionUrl').optional().isString(),
        body('actionText').optional().isString()
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden enviar notificaciones'
                });
            }

            const { userIds, title, message, type, category, priority, actionUrl, actionText } = req.body;

            const results = await notificationService.sendToUsers(userIds, {
                title,
                message,
                type: type || 'system',
                category: category || 'info',
                priority: priority || 0,
                actionUrl,
                actionText
            });

            res.json({
                success: true,
                data: {
                    sent: results.length,
                    notifications: results
                },
                message: `Notificación enviada a ${results.length} usuario(s)`
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error enviando notificación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar notificación'
            });
        }
    }
);

/**
 * POST /api/notifications/broadcast
 * Envía notificación a todos los usuarios
 */
router.post('/broadcast',
    authenticateToken,
    [
        body('title').isString().isLength({ min: 1, max: 200 }),
        body('message').isString().isLength({ min: 1 }),
        body('type').optional().isIn(['system', 'achievement', 'challenge', 'message', 'alert', 'marketing']),
        body('category').optional().isIn(['info', 'success', 'warning', 'error', 'reward']),
        body('excludeUserIds').optional().isArray()
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden hacer broadcast'
                });
            }

            const { title, message, type, category, excludeUserIds } = req.body;

            const results = await notificationService.broadcast(
                {
                    title,
                    message,
                    type: type || 'system',
                    category: category || 'info'
                },
                excludeUserIds || []
            );

            res.json({
                success: true,
                data: {
                    sent: results.length
                },
                message: `Broadcast enviado a ${results.length} usuario(s)`
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error en broadcast:', error);
            res.status(500).json({
                success: false,
                message: 'Error al hacer broadcast'
            });
        }
    }
);

/**
 * POST /api/notifications/send-to-role
 * Envía notificación a un rol específico
 */
router.post('/send-to-role',
    authenticateToken,
    [
        body('role').isIn(['estudiante', 'docente', 'padre', 'admin', 'administrativo']),
        body('title').isString().isLength({ min: 1, max: 200 }),
        body('message').isString().isLength({ min: 1 }),
        body('type').optional().isIn(['system', 'achievement', 'challenge', 'message', 'alert', 'marketing']),
        body('category').optional().isIn(['info', 'success', 'warning', 'error', 'reward'])
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin', 'administrativo'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden enviar a roles'
                });
            }

            const { role, title, message, type, category } = req.body;

            const results = await notificationService.sendToRole(role, {
                title,
                message,
                type: type || 'system',
                category: category || 'info'
            });

            res.json({
                success: true,
                data: {
                    sent: results.length,
                    role
                },
                message: `Notificación enviada a ${results.length} ${role}(s)`
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error enviando a rol:', error);
            res.status(500).json({
                success: false,
                message: 'Error al enviar a rol'
            });
        }
    }
);

/**
 * POST /api/notifications/from-template
 * Envía notificación desde plantilla
 */
router.post('/from-template',
    authenticateToken,
    [
        body('userId').isInt({ min: 1 }),
        body('templateSlug').isString().isLength({ min: 1, max: 100 }),
        body('variables').optional().isObject()
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin', 'administrativo', 'docente'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para enviar desde plantilla'
                });
            }

            const { userId, templateSlug, variables } = req.body;

            const notification = await notificationService.sendFromTemplate(
                userId,
                templateSlug,
                variables || {}
            );

            res.json({
                success: true,
                data: notification,
                message: 'Notificación enviada desde plantilla'
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error enviando desde plantilla:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error al enviar desde plantilla'
            });
        }
    }
);

// =====================================
// MANTENIMIENTO
// =====================================

/**
 * POST /api/notifications/cleanup
 * Limpia notificaciones antiguas (admin)
 */
router.post('/cleanup',
    authenticateToken,
    [
        body('daysOld').optional().isInt({ min: 7, max: 365 })
    ],
    validate,
    async (req, res) => {
        try {
            // Verificar permisos
            if (!['admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Solo administradores pueden limpiar notificaciones'
                });
            }

            const daysOld = req.body.daysOld || 30;
            await notificationService.cleanupOldNotifications(daysOld);

            res.json({
                success: true,
                message: `Notificaciones archivadas de más de ${daysOld} días eliminadas`
            });
        } catch (error) {
            console.error('[NOTIFICATIONS] Error en limpieza:', error);
            res.status(500).json({
                success: false,
                message: 'Error al limpiar notificaciones'
            });
        }
    }
);

module.exports = router;
