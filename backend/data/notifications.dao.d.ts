/**
 * 🔔 NOTIFICATION DAO - TypeScript
 * Gestión de notificaciones del sistema
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface NotificationRow {
    id: number;
    usuario_id: number;
    titulo: string;
    mensaje: string;
    tipo: 'info' | 'warning' | 'error' | 'success';
    leida: boolean;
    data?: Record<string, any>;
    prioridad: 'low' | 'normal' | 'high';
    canal: 'in_app' | 'email' | 'push';
    created_at: Date;
    read_at?: Date;
}
export interface NotificationCreateData {
    usuario_id: number;
    titulo: string;
    mensaje: string;
    tipo?: string;
    data?: Record<string, any>;
    prioridad?: string;
    canal?: string;
}
export interface NotificationFilters {
    usuario_id?: number;
    leida?: boolean;
    tipo?: string;
    limit?: number;
}
declare class NotificationDAO {
    static create(data: NotificationCreateData): Promise<NotificationRow>;
    static get(id: number): Promise<NotificationRow | undefined>;
    static list(filters?: NotificationFilters): Promise<NotificationRow[]>;
    static getByUser(userId: number, filters?: NotificationFilters): Promise<NotificationRow[]>;
    static markAsRead(id: number, userId: number): Promise<NotificationRow | undefined>;
    static markAllAsRead(userId: number): Promise<number>;
    static delete(id: number, userId: number): Promise<boolean>;
    static deleteOld(days?: number): Promise<number>;
    static getUnreadCount(userId: number): Promise<number>;
}
export default NotificationDAO;
//# sourceMappingURL=notifications.dao.d.ts.map