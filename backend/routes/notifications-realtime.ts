/**
 * 🔔 NOTIFICATIONS REALTIME ROUTES - TypeScript
 * Endpoints demos para uso de Socket.IO
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { debugLog } from '../utils/debug-logger';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        email: string;
        role: string;
    };
    app: any; // Para acceder a socketService
}

/**
 * POST /api/notifications-realtime/send-to-user
 */
router.post('/send-to-user', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

        debugLog.log(`[NOTIFICATION] Enviada a usuario ${userId}: ${message}`);

        res.json({
            success: true,
            message: 'Notificación enviada exitosamente',
            userId,
            type
        });

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al enviar:', error as Error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: (error as Error).message
        });
    }
});

/**
 * POST /api/notifications-realtime/send-to-role
 */
router.post('/send-to-role', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

        debugLog.log(`[NOTIFICATION] Enviada a rol ${role}: ${message}`);

        res.json({
            success: true,
            message: `Notificación enviada a todos los ${role}s`,
            role,
            type
        });

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al enviar a rol:', error as Error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: (error as Error).message
        });
    }
});

/**
 * POST /api/notifications-realtime/broadcast
 */
router.post('/broadcast', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

        debugLog.log(`[NOTIFICATION] Broadcast enviado: ${message}`);

        res.json({
            success: true,
            message: 'Notificación broadcast enviada a todos',
            type
        });

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al broadcast:', error as Error);
        res.status(500).json({
            error: 'Error al enviar broadcast',
            details: (error as Error).message
        });
    }
});

/**
 * POST /api/notifications-realtime/send-to-tenant
 */
router.post('/send-to-tenant', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

        debugLog.log(`[NOTIFICATION] Enviada a tenant ${tenantId}: ${message}`);

        res.json({
            success: true,
            message: `Notificación enviada a tenant ${tenantId}`,
            tenantId,
            type
        });

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al enviar a tenant:', error as Error);
        res.status(500).json({
            error: 'Error al enviar notificación',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/notifications-realtime/history/:userId
 */
router.get('/history/:userId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

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

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al obtener historial:', error as Error);
        res.status(500).json({
            error: 'Error al obtener historial',
            details: (error as Error).message
        });
    }
});

/**
 * GET /api/notifications-realtime/online-users
 */
router.get('/online-users', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error al obtener usuarios online:', error as Error);
        res.status(500).json({
            error: 'Error al obtener usuarios online',
            details: (error as Error).message
        });
    }
});

/**
 * POST /api/notifications-realtime/example
 */
router.post('/example', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as AuthenticatedRequest;
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

    } catch (error) {
        debugLog.error('[NOTIFICATION] Error en prueba:', error as Error);
        res.status(500).json({
            error: 'Error al enviar notificación de prueba',
            details: (error as Error).message
        });
    }
});

export default router;
