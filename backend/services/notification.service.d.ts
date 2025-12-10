/**
 * 🔔 NOTIFICATION SERVICE - TypeScript
 * Servicio unificado de notificaciones
 *
 * Patrón Service Layer - Consolida lógica de notificaciones
 * Integra DAO, EventBus y Canales de envío (Realtime, Push, SMS)
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export declare class ServiceError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
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
    errors: Array<{
        userId: number;
        error: string;
    }>;
}
declare class NotificationService {
    /**
     * Crear y enviar notificación
     */
    createNotification(data: NotificationData, options?: NotificationOptions): Promise<any>;
    /**
     * Obtener notificaciones de usuario
     */
    getUserNotifications(userId: number, filters?: NotificationFilters): Promise<any[]>;
    /**
     * Marcar como leída
     */
    markAsRead(id: number, userId: number): Promise<any>;
    /**
     * Marcar todas como leídas
     */
    markAllAsRead(userId: number): Promise<{
        updated: number;
    }>;
    /**
     * Obtener contador de no leídas
     */
    getUnreadCount(userId: number): Promise<{
        count: number;
    }>;
    /**
     * Eliminar notificación
     */
    deleteNotification(id: number, userId: number): Promise<boolean>;
    /**
     * Enviar notificación a múltiples usuarios (Broadcast/Multicast)
     */
    sendBulkNotifications(userIds: number[], notificationData: Omit<NotificationData, 'usuario_id'>): Promise<BulkNotificationResult>;
    private _validateNotificationData;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map