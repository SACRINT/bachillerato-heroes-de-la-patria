"use strict";
/**
 * 🔔 NOTIFICATION SERVICE - TypeScript
 * Servicio unificado de notificaciones
 *
 * Patrón Service Layer - Consolida lógica de notificaciones
 * Integra DAO, EventBus y Canales de envío (Realtime, Push, SMS)
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
const notifications_dao_1 = __importDefault(require("../data/notifications.dao"));
const devLogger_1 = __importDefault(require("../utils/devLogger"));
// Dynamic imports for JS modules
const EventBus = require('./eventBus.service').getInstance();
const RealtimeChannel = require('./channels/RealtimeChannel');
// =====================================================
// INTERFACES
// =====================================================
class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.statusCode = statusCode;
    }
}
exports.ServiceError = ServiceError;
// =====================================================
// NOTIFICATION SERVICE CLASS
// =====================================================
class NotificationService {
    /**
     * Crear y enviar notificación
     */
    async createNotification(data, options = {}) {
        this._validateNotificationData(data);
        const { sendRealtime = true, sendPush = false, sendEmail = false } = options;
        try {
            // 1. Guardar en BD (Persistencia)
            const notification = await notifications_dao_1.default.create(data);
            // 2. Enviar por canal realtime (WebSocket/Socket.IO)
            if (sendRealtime) {
                const delivered = RealtimeChannel.sendToUser(data.usuario_id, {
                    id: notification.id,
                    titulo: notification.titulo,
                    mensaje: notification.mensaje,
                    tipo: notification.tipo,
                    creado_en: notification.creado_en || notification.created_at
                });
                devLogger_1.default.log(`[NotificationService] Realtime: ${delivered ? 'entregado' : 'usuario offline'}`);
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
            devLogger_1.default.log(`[NotificationService] 🔔 Notificación creada para usuario ${data.usuario_id}: ${data.titulo}`);
            return notification;
        }
        catch (error) {
            devLogger_1.default.error('[NotificationService] Error creando notificación', error);
            throw new ServiceError('Error al crear notificación', 500);
        }
    }
    /**
     * Obtener notificaciones de usuario
     */
    async getUserNotifications(userId, filters = {}) {
        if (!userId)
            throw new ServiceError('ID de usuario requerido', 400);
        try {
            return await notifications_dao_1.default.getByUser(userId, filters);
        }
        catch (error) {
            devLogger_1.default.error('[NotificationService] Error obteniendo notificaciones', error);
            throw new ServiceError('Error al obtener notificaciones', 500);
        }
    }
    /**
     * Marcar como leída
     */
    async markAsRead(id, userId) {
        if (!id || !userId)
            throw new ServiceError('ID y Usuario requeridos', 400);
        try {
            const result = await notifications_dao_1.default.markAsRead(id, userId);
            if (!result)
                throw new ServiceError('Notificación no encontrada o no pertenece al usuario', 404);
            EventBus.emit('notification:read', { id, userId });
            return result;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[NotificationService] Error marcando como leída', error);
            throw new ServiceError('Error al marcar notificación', 500);
        }
    }
    /**
     * Marcar todas como leídas
     */
    async markAllAsRead(userId) {
        if (!userId)
            throw new ServiceError('Usuario requerido', 400);
        try {
            const count = await notifications_dao_1.default.markAllAsRead(userId);
            return { updated: count };
        }
        catch (error) {
            devLogger_1.default.error('[NotificationService] Error marcando todas como leídas', error);
            throw new ServiceError('Error al marcar todas las notificaciones', 500);
        }
    }
    /**
     * Obtener contador de no leídas
     */
    async getUnreadCount(userId) {
        if (!userId)
            throw new ServiceError('Usuario requerido', 400);
        try {
            const count = await notifications_dao_1.default.getUnreadCount(userId);
            return { count };
        }
        catch (error) {
            devLogger_1.default.error('[NotificationService] Error obteniendo contador', error);
            throw new ServiceError('Error al contar notificaciones', 500);
        }
    }
    /**
     * Eliminar notificación
     */
    async deleteNotification(id, userId) {
        if (!id || !userId)
            throw new ServiceError('ID y Usuario requeridos', 400);
        try {
            const success = await notifications_dao_1.default.delete(id, userId);
            if (!success)
                throw new ServiceError('Notificación no encontrada', 404);
            return true;
        }
        catch (error) {
            if (error instanceof ServiceError)
                throw error;
            devLogger_1.default.error('[NotificationService] Error eliminando notificación', error);
            throw new ServiceError('Error al eliminar notificación', 500);
        }
    }
    /**
     * Enviar notificación a múltiples usuarios (Broadcast/Multicast)
     */
    async sendBulkNotifications(userIds, notificationData) {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new ServiceError('Lista de usuarios requerida', 400);
        }
        const results = {
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
            }
            catch (error) {
                results.failed++;
                results.errors.push({ userId, error: error.message });
            }
        }));
        return results;
    }
    // ==========================================
    // VALIDACIONES
    // ==========================================
    _validateNotificationData(data) {
        if (!data.usuario_id)
            throw new ServiceError('ID de usuario requerido', 400);
        if (!data.titulo)
            throw new ServiceError('Título requerido', 400);
        if (!data.mensaje)
            throw new ServiceError('Mensaje requerido', 400);
    }
}
exports.default = new NotificationService();
module.exports = new NotificationService();
module.exports.ServiceError = ServiceError;
//# sourceMappingURL=notification.service.js.map