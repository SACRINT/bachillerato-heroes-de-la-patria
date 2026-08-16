/**
 * 🔔 NOTIFICATION SERVICE - TypeScript
 * Servicio unificado de notificaciones
 * 
 * Patrón Service Layer - Consolida lógica de notificaciones
 * Integra DAO, EventBus y Canales de envío (Realtime, Push, SMS)
 * 
 * Migración TypeScript: 07 Diciembre 2025
 */

import NotificationDAO from '../data/notifications.dao';
import devLogger from '../utils/devLogger';

// Dynamic imports for JS modules
const EventBus = require('./event-bus.service').getInstance();
const RealtimeChannel = require('./channels/RealtimeChannel');

// =====================================================
// INTERFACES
// =====================================================

export class ServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}

export interface NotificationData {
    usuario_id: number;
    titulo: string;
    mensaje: string;
    tipo?: string;
    data?: any;
    canal?: 'realtime' | 'push' | 'email';
}

export interface NotificationOptions {
    sendRealtime?: boolean;
    sendPush?: boolean;
    sendEmail?: boolean;
}

export interface NotificationFilters {
    leida?: boolean;
    tipo?: string;
    limit?: number;
    offset?: number;
}

export interface BulkNotificationResult {
    success: number;
    failed: number;
    errors: Array<{ userId: number; error: string }>;
}

// =====================================================
// NOTIFICATION SERVICE CLASS
// =====================================================

class NotificationService {

    /**
     * Crear y enviar notificación
     */
    async createNotification(data: NotificationData, options: NotificationOptions = {}): Promise<any> {
        this._validateNotificationData(data);

        const { sendRealtime = true, sendPush = false, sendEmail = false } = options;

        try {
            // 1. Guardar en BD (Persistencia)
            const notification = await NotificationDAO.create(data);

            // 2. Enviar por canal realtime (WebSocket/Socket.IO)
            if (sendRealtime) {
                const delivered = RealtimeChannel.sendToUser(data.usuario_id, {
                    id: notification.id,
                    titulo: notification.titulo,
                    mensaje: notification.mensaje,
                    tipo: notification.tipo,
                    creado_en: (notification as any).creado_en || notification.created_at
                });

                devLogger.log(`[NotificationService] Realtime: ${delivered ? 'entregado' : 'usuario offline'}`);
            }

            // 3. Emitir evento para otros suscriptores (desacoplamiento)
            EventBus.emit('notification:created', {
                notificationId: notification.id,
                userId: notification.usuario_id,
                title: notification.titulo,
                message: notification.mensaje,
                type: notification.tipo,
                data: notification.data
            });

            // 4. Push notifications (si está habilitado)
            if (sendPush || data.canal === 'push') {
                EventBus.emit('notification:push_requested', notification);
            }

            // 5. Email (si está habilitado)
            if (sendEmail || data.canal === 'email') {
                EventBus.emit('notification:email_requested', notification);
            }

            devLogger.log(`[NotificationService] 🔔 Notificación creada para usuario ${data.usuario_id}: ${data.titulo}`);
            return notification;

        } catch (error: any) {
            devLogger.error('[NotificationService] Error creando notificación', error);
            throw new ServiceError('Error al crear notificación', 500);
        }
    }

    /**
     * Obtener notificaciones de usuario
     */
    async getUserNotifications(userId: number, filters: NotificationFilters = {}): Promise<any[]> {
        if (!userId) throw new ServiceError('ID de usuario requerido', 400);

        try {
            return await NotificationDAO.getByUser(userId, filters);
        } catch (error: any) {
            devLogger.error('[NotificationService] Error obteniendo notificaciones', error);
            throw new ServiceError('Error al obtener notificaciones', 500);
        }
    }

    /**
     * Marcar como leída
     */
    async markAsRead(id: number, userId: number): Promise<any> {
        if (!id || !userId) throw new ServiceError('ID y Usuario requeridos', 400);

        try {
            const result = await NotificationDAO.markAsRead(id, userId);
            if (!result) throw new ServiceError('Notificación no encontrada o no pertenece al usuario', 404);

            EventBus.emit('notification:read', { id, userId });
            return result;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[NotificationService] Error marcando como leída', error);
            throw new ServiceError('Error al marcar notificación', 500);
        }
    }

    /**
     * Marcar todas como leídas
     */
    async markAllAsRead(userId: number): Promise<{ updated: number }> {
        if (!userId) throw new ServiceError('Usuario requerido', 400);

        try {
            const count = await NotificationDAO.markAllAsRead(userId);
            return { updated: count };
        } catch (error: any) {
            devLogger.error('[NotificationService] Error marcando todas como leídas', error);
            throw new ServiceError('Error al marcar todas las notificaciones', 500);
        }
    }

    /**
     * Obtener contador de no leídas
     */
    async getUnreadCount(userId: number): Promise<{ count: number }> {
        if (!userId) throw new ServiceError('Usuario requerido', 400);

        try {
            const count = await NotificationDAO.getUnreadCount(userId);
            return { count };
        } catch (error: any) {
            devLogger.error('[NotificationService] Error obteniendo contador', error);
            throw new ServiceError('Error al contar notificaciones', 500);
        }
    }

    /**
     * Eliminar notificación
     */
    async deleteNotification(id: number, userId: number): Promise<boolean> {
        if (!id || !userId) throw new ServiceError('ID y Usuario requeridos', 400);

        try {
            const success = await NotificationDAO.delete(id, userId);
            if (!success) throw new ServiceError('Notificación no encontrada', 404);
            return true;
        } catch (error: any) {
            if (error instanceof ServiceError) throw error;
            devLogger.error('[NotificationService] Error eliminando notificación', error);
            throw new ServiceError('Error al eliminar notificación', 500);
        }
    }

    /**
     * Enviar notificación a múltiples usuarios (Broadcast/Multicast)
     */
    async sendBulkNotifications(userIds: number[], notificationData: Omit<NotificationData, 'usuario_id'>): Promise<BulkNotificationResult> {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new ServiceError('Lista de usuarios requerida', 400);
        }

        const results: BulkNotificationResult = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Procesar en paralelo (con límite si fuera necesario)
        await Promise.all(userIds.map(async (userId) => {
            try {
                await this.createNotification({
                    ...notificationData,
                    usuario_id: userId
                });
                results.success++;
            } catch (error: any) {
                results.failed++;
                results.errors.push({ userId, error: error.message });
            }
        }));

        return results;
    }

    // ==========================================
    // VALIDACIONES
    // ==========================================

    private _validateNotificationData(data: NotificationData): void {
        if (!data.usuario_id) throw new ServiceError('ID de usuario requerido', 400);
        if (!data.titulo) throw new ServiceError('Título requerido', 400);
        if (!data.mensaje) throw new ServiceError('Mensaje requerido', 400);
    }
}

export default new NotificationService();
module.exports = new NotificationService();
module.exports.ServiceError = ServiceError;
