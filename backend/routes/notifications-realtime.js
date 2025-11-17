/**
 * 🔔 NOTIFICATIONS REALTIME ROUTES - SEMANA 5
 * Endpoints de ejemplo para demostrar uso de Socket.IO
 * Envío de notificaciones en tiempo real a usuarios conectados
 *
 * Características:
 * - Notificaciones individuales (a un usuario)
 * - Notificaciones por rol (admins, docentes, estudiantes)
 * - Notificaciones broadcast (a todos)
 * - Notificaciones por tenant
 * - Historial de notificaciones
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const devLogger = require('../utils/devLogger');

/**
 * POST /api/notifications-realtime/send-to-user
 * Enviar notificación a un usuario específico
 *
 * Body:
 * {
 *   userId: number,
 *   type: 'info' | 'success' | 'warning' | 'error' | 'message',
 *   message: string,
 *   metadata: object (opcional)
 * }
 */
router.post('/send-to-user', authMiddleware, async (req, res) => {
    try {
        const { userId, type = 'info', message, metadata = {} } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                error: 'userId y message son requeridos'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Enviar notificación al usuario
        await socketService.sendToUser(userId, 'notification', {
            type,
            message,
            from: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });

        devLogger.log(`[NOTIFICATION] Enviada a usuario ${userId}: ${message}`);

        res.json({
            success: true,
            message: 'Notificación enviada exitosamente',
            userId,
            type
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al enviar:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});

/**
 * POST /api/notifications-realtime/send-to-role
 * Enviar notificación a todos los usuarios de un rol
 *
 * Body:
 * {
 *   role: 'admin' | 'estudiante' | 'docente' | 'padre',
 *   type: 'info' | 'success' | 'warning' | 'error',
 *   message: string,
 *   metadata: object (opcional)
 * }
 */
router.post('/send-to-role', authMiddleware, async (req, res) => {
    try {
        const { role, type = 'info', message, metadata = {} } = req.body;

        if (!role || !message) {
            return res.status(400).json({
                error: 'role y message son requeridos'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Enviar notificación al rol
        await socketService.sendToRole(role, 'notification', {
            type,
            message,
            from: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });

        devLogger.log(`[NOTIFICATION] Enviada a rol ${role}: ${message}`);

        res.json({
            success: true,
            message: `Notificación enviada a todos los ${role}s`,
            role,
            type
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al enviar a rol:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});

/**
 * POST /api/notifications-realtime/broadcast
 * Enviar notificación a TODOS los usuarios conectados
 *
 * Body:
 * {
 *   type: 'info' | 'success' | 'warning' | 'error',
 *   message: string,
 *   metadata: object (opcional)
 * }
 */
router.post('/broadcast', authMiddleware, async (req, res) => {
    try {
        // Solo admins pueden hacer broadcast
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Solo administradores pueden enviar broadcasts'
            });
        }

        const { type = 'info', message, metadata = {} } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'message es requerido'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Broadcast a todos
        await socketService.broadcastToAll('notification', {
            type,
            message,
            from: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });

        devLogger.log(`[NOTIFICATION] Broadcast enviado: ${message}`);

        res.json({
            success: true,
            message: 'Notificación broadcast enviada a todos',
            type
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al broadcast:', error);
        res.status(500).json({
            error: 'Error al enviar broadcast',
            details: error.message
        });
    }
});

/**
 * POST /api/notifications-realtime/send-to-tenant
 * Enviar notificación a todos los usuarios de un tenant
 *
 * Body:
 * {
 *   tenantId: number,
 *   type: 'info' | 'success' | 'warning' | 'error',
 *   message: string,
 *   metadata: object (opcional)
 * }
 */
router.post('/send-to-tenant', authMiddleware, async (req, res) => {
    try {
        const { tenantId, type = 'info', message, metadata = {} } = req.body;

        if (!tenantId || !message) {
            return res.status(400).json({
                error: 'tenantId y message son requeridos'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Enviar a tenant
        await socketService.sendToTenant(tenantId, 'notification', {
            type,
            message,
            from: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });

        devLogger.log(`[NOTIFICATION] Enviada a tenant ${tenantId}: ${message}`);

        res.json({
            success: true,
            message: `Notificación enviada a tenant ${tenantId}`,
            tenantId,
            type
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al enviar a tenant:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});

/**
 * GET /api/notifications-realtime/history/:userId
 * Obtener historial de notificaciones de un usuario
 */
router.get('/history/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        // Solo el propio usuario o admins pueden ver historial
        if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'No autorizado para ver este historial'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Obtener historial de Redis
        const history = await socketService.getNotificationHistory(userId, limit);

        res.json({
            success: true,
            userId,
            count: history.length,
            notifications: history
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al obtener historial:', error);
        res.status(500).json({
            error: 'Error al obtener historial',
            details: error.message
        });
    }
});

/**
 * GET /api/notifications-realtime/online-users
 * Obtener lista de usuarios conectados (solo admins)
 */
router.get('/online-users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Solo administradores pueden ver usuarios online'
            });
        }

        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        const onlineUsers = socketService.getOnlineUsers();

        res.json({
            success: true,
            count: onlineUsers.length,
            users: onlineUsers
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error al obtener usuarios online:', error);
        res.status(500).json({
            error: 'Error al obtener usuarios online',
            details: error.message
        });
    }
});

/**
 * POST /api/notifications-realtime/example
 * Endpoint de prueba para testear notificaciones
 * (Solo para desarrollo/testing)
 */
router.post('/example', authMiddleware, async (req, res) => {
    try {
        const socketService = req.app.socketService;
        if (!socketService) {
            return res.status(503).json({
                error: 'Socket.IO no disponible'
            });
        }

        // Enviar notificación de prueba al usuario actual
        await socketService.sendToUser(req.user.id, 'notification', {
            type: 'success',
            message: '¡Prueba exitosa! Socket.IO está funcionando correctamente.',
            from: {
                email: 'Sistema BGE',
                role: 'system'
            },
            metadata: {
                test: true,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Notificación de prueba enviada'
        });

    } catch (error) {
        devLogger.error('[NOTIFICATION] Error en prueba:', error);
        res.status(500).json({
            error: 'Error al enviar notificación de prueba',
            details: error.message
        });
    }
});

module.exports = router;
