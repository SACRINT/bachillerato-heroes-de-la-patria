"use strict";
/**
 * 🔔 NOTIFICATIONS REALTIME ROUTES - TypeScript
 * Endpoints demos para uso de Socket.IO
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const debug_logger_1 = require("../utils/debug-logger");
const router = express_1.default.Router();
/**
 * POST /api/notifications-realtime/send-to-user
 */
router.post('/send-to-user', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { userId, type = 'info', message, metadata = {} } = req.body;
        if (!userId || !message) {
            res.status(400).json({ error: 'userId y message son requeridos' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        await socketService.sendToUser(userId, 'notification', {
            type,
            message,
            from: {
                id: authReq.user.id,
                email: authReq.user.email,
                role: authReq.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });
        debug_logger_1.debugLog.log(`[NOTIFICATION] Enviada a usuario ${userId}: ${message}`);
        res.json({
            success: true,
            message: 'Notificación enviada exitosamente',
            userId,
            type
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al enviar:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});
/**
 * POST /api/notifications-realtime/send-to-role
 */
router.post('/send-to-role', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { role, type = 'info', message, metadata = {} } = req.body;
        if (!role || !message) {
            res.status(400).json({ error: 'role y message son requeridos' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        await socketService.sendToRole(role, 'notification', {
            type,
            message,
            from: {
                id: authReq.user.id,
                email: authReq.user.email,
                role: authReq.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });
        debug_logger_1.debugLog.log(`[NOTIFICATION] Enviada a rol ${role}: ${message}`);
        res.json({
            success: true,
            message: `Notificación enviada a todos los ${role}s`,
            role,
            type
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al enviar a rol:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});
/**
 * POST /api/notifications-realtime/broadcast
 */
router.post('/broadcast', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        // Solo admins pueden hacer broadcast
        if (authReq.user.role !== 'admin') {
            res.status(403).json({ error: 'Solo administradores pueden enviar broadcasts' });
            return;
        }
        const { type = 'info', message, metadata = {} } = req.body;
        if (!message) {
            res.status(400).json({ error: 'message es requerido' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        await socketService.broadcastToAll('notification', {
            type,
            message,
            from: {
                id: authReq.user.id,
                email: authReq.user.email,
                role: authReq.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });
        debug_logger_1.debugLog.log(`[NOTIFICATION] Broadcast enviado: ${message}`);
        res.json({
            success: true,
            message: 'Notificación broadcast enviada a todos',
            type
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al broadcast:', error);
        res.status(500).json({
            error: 'Error al enviar broadcast',
            details: error.message
        });
    }
});
/**
 * POST /api/notifications-realtime/send-to-tenant
 */
router.post('/send-to-tenant', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { tenantId, type = 'info', message, metadata = {} } = req.body;
        if (!tenantId || !message) {
            res.status(400).json({ error: 'tenantId y message son requeridos' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        await socketService.sendToTenant(tenantId, 'notification', {
            type,
            message,
            from: {
                id: authReq.user.id,
                email: authReq.user.email,
                role: authReq.user.role
            },
            metadata,
            timestamp: new Date().toISOString()
        });
        debug_logger_1.debugLog.log(`[NOTIFICATION] Enviada a tenant ${tenantId}: ${message}`);
        res.json({
            success: true,
            message: `Notificación enviada a tenant ${tenantId}`,
            tenantId,
            type
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al enviar a tenant:', error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: error.message
        });
    }
});
/**
 * GET /api/notifications-realtime/history/:userId
 */
router.get('/history/:userId', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        if (authReq.user.id !== parseInt(userId) && authReq.user.role !== 'admin') {
            res.status(403).json({ error: 'No autorizado para ver este historial' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        const history = await socketService.getNotificationHistory(userId, limit);
        res.json({
            success: true,
            userId,
            count: history.length,
            notifications: history
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al obtener historial:', error);
        res.status(500).json({
            error: 'Error al obtener historial',
            details: error.message
        });
    }
});
/**
 * GET /api/notifications-realtime/online-users
 */
router.get('/online-users', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        if (authReq.user.role !== 'admin') {
            res.status(403).json({ error: 'Solo administradores pueden ver usuarios online' });
            return;
        }
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        const onlineUsers = socketService.getOnlineUsers();
        res.json({
            success: true,
            count: onlineUsers.length,
            users: onlineUsers
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error al obtener usuarios online:', error);
        res.status(500).json({
            error: 'Error al obtener usuarios online',
            details: error.message
        });
    }
});
/**
 * POST /api/notifications-realtime/example
 */
router.post('/example', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const socketService = authReq.app.socketService;
        if (!socketService) {
            res.status(503).json({ error: 'Socket.IO no disponible' });
            return;
        }
        await socketService.sendToUser(authReq.user.id, 'notification', {
            type: 'success',
            message: '¡Prueba exitosa! Socket.IO está funcionando correctamente.',
            from: {
                id: 0,
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('[NOTIFICATION] Error en prueba:', error);
        res.status(500).json({
            error: 'Error al enviar notificación de prueba',
            details: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=notifications-realtime.js.map