/**
 * Inicializar Socket.IO Server con Namespaces Multi-Tenant
 * @param {HttpServer} httpServer - Servidor HTTP de Express
 * @returns {Server} - Instancia de Socket.IO
 */
export function initializeSocketIOAdvanced(httpServer: HttpServer): Server;
/**
 * Helper: Enviar notificación a usuario específico
 */
export function sendNotificationToUser(io: any, tenantId: any, userId: any, notification: any): void;
/**
 * Helper: Broadcast a rol específico
 */
export function broadcastToRole(io: any, tenantId: any, role: any, event: any, data: any): void;
/**
 * Helper: Obtener usuarios conectados
 */
export function getConnectedUsers(): any[];
/**
 * Helper: Obtener usuarios en sala específica
 */
export function getUsersInRoom(roomId: any): any[];
import { Server } from "socket.io";
//# sourceMappingURL=socket-server-advanced.d.ts.map