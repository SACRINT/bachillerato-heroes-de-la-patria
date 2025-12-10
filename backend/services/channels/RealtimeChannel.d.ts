export = realtimeChannel;
declare const realtimeChannel: RealtimeChannel;
declare class RealtimeChannel {
    io: any;
    userSockets: Map<any, any>;
    initialized: boolean;
    /**
     * Inicializa el canal con una instancia de Socket.IO
     * @param {SocketIO.Server} io - Instancia de Socket.IO
     */
    initialize(io: SocketIO.Server): void;
    /**
     * Configura los handlers de conexión/desconexión
     * @private
     */
    private _setupConnectionHandlers;
    /**
     * Maneja autenticación de un socket
     * @private
     */
    private _handleAuthenticate;
    /**
     * Maneja desconexión de un socket
     * @private
     */
    private _handleDisconnect;
    /**
     * Envía notificación a un usuario específico
     * @param {string|number} userId - ID del usuario
     * @param {Object} notification - Datos de la notificación
     * @returns {boolean} - true si se envió, false si usuario no conectado
     */
    sendToUser(userId: string | number, notification: any): boolean;
    /**
     * Envía notificación a múltiples usuarios
     * @param {Array<string|number>} userIds - IDs de usuarios
     * @param {Object} notification - Datos de la notificación
     * @returns {Object} - Estadísticas de envío
     */
    sendToUsers(userIds: Array<string | number>, notification: any): any;
    /**
     * Broadcast a todos los usuarios conectados
     * @param {Object} notification - Datos de la notificación
     * @param {Array} excludeUserIds - IDs a excluir del broadcast
     */
    broadcast(notification: any, excludeUserIds?: any[]): void;
    /**
     * Envía notificación a un rol específico
     * @param {string} role - Nombre del rol (admin, teacher, student, parent)
     * @param {Object} notification - Datos de la notificación
     */
    sendToRole(role: string, notification: any): void;
    /**
     * Verifica si un usuario está conectado
     * @param {string|number} userId - ID del usuario
     * @returns {boolean}
     */
    isUserOnline(userId: string | number): boolean;
    /**
     * Obtiene la lista de usuarios conectados
     * @returns {Array<string>}
     */
    getOnlineUsers(): Array<string>;
    /**
     * Obtiene estadísticas del canal
     * @returns {Object}
     */
    getStats(): any;
    /**
     * Destruye el canal y limpia recursos
     */
    destroy(): void;
}
//# sourceMappingURL=RealtimeChannel.d.ts.map