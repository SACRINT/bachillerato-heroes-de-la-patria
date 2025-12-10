/**
 * Inicializar Socket.IO Server
 * @param {HttpServer} httpServer - Servidor HTTP de Express
 * @returns {Server} - Instancia de Socket.IO
 */
export function initializeSocketIO(httpServer: HttpServer): Server;
/**
 * Enviar notificación a usuario específico (helper function)
 * @param {Server} io - Instancia de Socket.IO
 * @param {string} userId - ID del usuario
 * @param {object} notification - Objeto de notificación
 */
export function sendNotificationToUser(io: Server, userId: string, notification: object): void;
/**
 * Broadcast notificación a rol
 * @param {Server} io - Instancia de Socket.IO
 * @param {string} role - Rol (admin, docente, estudiante)
 * @param {object} notification - Objeto de notificación
 */
export function broadcastToRole(io: Server, role: string, notification: object): void;
/**
 * Obtener usuarios conectados
 * @returns {Array} - Lista de usuarios conectados
 */
export function getConnectedUsers(): any[];
import { Server } from "socket.io";
//# sourceMappingURL=socket-server.d.ts.map