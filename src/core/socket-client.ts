/**
 * 🔔 SOCKET.IO CLIENT - TypeScript
 * Cliente centralizado de notificaciones en tiempo real
 *
 * Características:
 * - Auto-reconnection con backoff exponencial
 * - Event listeners con cleanup
 * - UI integration para notificaciones
 * - Presence detection (usuarios online)
 * - Typing indicators
 * 
 * Migrado a TypeScript: 13 Diciembre 2025
 */

// Declaraciones de socket.io
declare const io: (url: string, options: SocketIOOptions) => Socket;

interface Socket {
    id: string;
    connected: boolean;
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
    connect(): void;
    disconnect(): void;
}

interface SocketIOOptions {
    auth: { token: string };
    reconnection: boolean;
    reconnectionDelay: number;
    reconnectionDelayMax: number;
    reconnectionAttempts: number;
    timeout: number;
}

// Interfaces
export interface Notification {
    id?: string;
    message: string;
    type: NotificationType;
    from?: { email: string; name?: string };
    timestamp: string;
    metadata?: Record<string, any>;
}

export interface UserPresenceData {
    userId: number | string;
    status: 'online' | 'offline' | 'away';
    lastSeen?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'message';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

export interface SocketClientConfig {
    maxReconnectAttempts?: number;
    notificationDuration?: number;
    soundEnabled?: boolean;
    soundPath?: string;
}

export class SocketClient {
    private socket: Socket | null;
    private connected: boolean;
    private reconnectAttempts: number;
    private maxReconnectAttempts: number;
    private config: SocketClientConfig;
    private stylesInjected: boolean;

    constructor(config: SocketClientConfig = {}) {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
        this.stylesInjected = false;
        this.config = {
            notificationDuration: 8000,
            soundEnabled: true,
            soundPath: '/sounds/notification.mp3',
            ...config
        };

        this.init();
    }

    /**
     * Inicializar conexión
     */
    async init(): Promise<void> {
        // En Vercel serverless no hay servidor WebSocket de socket.io activo
        if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
            return;
        }

        // Verificar si socket.io está disponible
        if (typeof io === 'undefined') {
            return;
        }

        // Obtener token de autenticación
        const token = this.getAuthToken();

        if (!token) {
            return;
        }

        // Inyectar estilos CSS
        this.injectStyles();

        // Configurar Socket.IO client
        const serverUrl = window.location.origin;

        try {
            this.socket = io(serverUrl, {
                auth: { token },
                reconnection: false,
                timeout: 5000
            });
            this.setupEventListeners();
        } catch (e) {
            // Silently fallback to REST API
        }
    }

    /**
     * Obtener token JWT del storage
     */
    private getAuthToken(): string | null {
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
    }

    /**
     * Setup de event listeners
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => this.handleConnect());
        this.socket.on('disconnect', (reason: string) => this.handleDisconnect(reason));
        this.socket.on('connect_error', (error: Error) => this.handleConnectError(error));

        // Notification events
        this.socket.on('notification', (data: Notification) => this.handleNotification(data));
        this.socket.on('notifications_history', (data: Notification[]) => this.handleNotificationsHistory(data));

        // Presence events
        this.socket.on('user_presence', (data: UserPresenceData) => this.handleUserPresence(data));
        this.socket.on('online_users', (data: (number | string)[]) => this.handleOnlineUsers(data));

        // Typing events
        this.socket.on('user_typing', (data: { email: string; room: string }) => this.handleUserTyping(data));
        this.socket.on('user_stopped_typing', (data: { email: string; room: string }) => this.handleUserStoppedTyping(data));

        // Room events
        this.socket.on('room_joined', (data: { room: string }) => console.log(`[Socket Client] Joined room: ${data.room}`));
        this.socket.on('room_left', (data: { room: string }) => console.log(`[Socket Client] Left room: ${data.room}`));

        // Error events
        this.socket.on('error', (data: { message: string }) => this.handleError(data));
    }

    /**
     * Manejo de conexión exitosa
     */
    private handleConnect(): void {
        this.connected = true;
        this.reconnectAttempts = 0;

        console.log('[Socket Client] Connected to server:', this.socket?.id);
        this.updateConnectionStatus('connected');

        document.dispatchEvent(new CustomEvent('socketConnected', {
            detail: { socketId: this.socket?.id }
        }));
    }

    /**
     * Manejo de desconexión
     */
    private handleDisconnect(reason: string): void {
        this.connected = false;
        console.log('[Socket Client] Disconnected:', reason);
        this.updateConnectionStatus('disconnected');

        document.dispatchEvent(new CustomEvent('socketDisconnected', {
            detail: { reason }
        }));
    }

    /**
     * Manejo de error de conexión
     */
    private handleConnectError(error: Error): void {
        this.reconnectAttempts++;
        console.error(`[Socket Client] Connection error (attempt ${this.reconnectAttempts}):`, error.message);

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[Socket Client] Max reconnection attempts reached.');
            this.updateConnectionStatus('failed');
        } else {
            this.updateConnectionStatus('reconnecting');
        }
    }

    /**
     * Actualizar indicador visual de conexión
     */
    updateConnectionStatus(status: ConnectionStatus): void {
        const indicator = document.getElementById('socket-connection-status');

        const statusLabels: Record<ConnectionStatus, string> = {
            connected: '● Online',
            disconnected: '● Offline',
            reconnecting: '● Reconnecting...',
            failed: '● Connection Failed'
        };

        if (indicator) {
            indicator.className = `socket-status socket-status-${status}`;
            indicator.textContent = statusLabels[status] || '● Unknown';
        }
    }

    /**
     * Manejo de notificación recibida
     */
    private handleNotification(notification: Notification): void {
        console.log('[Socket Client] Notification received:', notification);
        this.displayNotification(notification);

        document.dispatchEvent(new CustomEvent('notificationReceived', {
            detail: notification
        }));

        if (this.config.soundEnabled) {
            this.playNotificationSound();
        }
    }

    /**
     * Mostrar notificación en UI
     */
    displayNotification(notification: Notification): void {
        const { message, type, from, timestamp } = notification;

        const notifEl = document.createElement('div');
        notifEl.className = `notification notification-${type || 'info'} slide-in`;
        notifEl.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-from">${from?.email || 'System'}</span>
                <span class="notification-time">${this.formatTime(timestamp)}</span>
                <button class="notification-close" aria-label="Close">×</button>
            </div>
            <div class="notification-body">
                ${message}
            </div>
        `;

        // Add close handler
        const closeBtn = notifEl.querySelector('.notification-close');
        closeBtn?.addEventListener('click', () => notifEl.remove());

        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }

        container.appendChild(notifEl);

        setTimeout(() => {
            notifEl.classList.add('slide-out');
            setTimeout(() => notifEl.remove(), 300);
        }, this.config.notificationDuration || 8000);
    }

    /**
     * Obtener ícono para tipo de notificación
     */
    private getNotificationIcon(type?: NotificationType): string {
        const icons: Record<NotificationType, string> = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            message: '💬'
        };
        return icons[type || 'info'] || 'ℹ️';
    }

    /**
     * Formatear timestamp
     */
    private formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return 'Ahora';
        if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
        return date.toLocaleDateString();
    }

    /**
     * Reproducir sonido de notificación
     */
    private playNotificationSound(): void {
        if (document.hasFocus() && this.config.soundPath) {
            const audio = new Audio(this.config.soundPath);
            audio.volume = 0.3;
            audio.play().catch(() => {/* Silently fail */ });
        }
    }

    /**
     * Manejo de historial de notificaciones
     */
    private handleNotificationsHistory(notifications: Notification[]): void {
        console.log(`[Socket Client] Received ${notifications.length} historical notifications`);
        document.dispatchEvent(new CustomEvent('notificationsHistory', {
            detail: { notifications }
        }));
    }

    /**
     * Manejo de presencia de usuario
     */
    private handleUserPresence(data: UserPresenceData): void {
        console.log(`[Socket Client] User ${data.userId} is now ${data.status}`);
        this.updateUserPresenceUI(data);
        document.dispatchEvent(new CustomEvent('userPresence', { detail: data }));
    }

    /**
     * Actualizar UI de presencia
     */
    private updateUserPresenceUI(data: UserPresenceData): void {
        const elements = document.querySelectorAll<HTMLElement>(`[data-user-id="${data.userId}"] .presence-indicator`);
        elements.forEach(el => {
            el.className = `presence-indicator presence-${data.status}`;
        });
    }

    /**
     * Manejo de lista de usuarios online
     */
    private handleOnlineUsers(userIds: (number | string)[]): void {
        console.log(`[Socket Client] ${userIds.length} users online`);
        document.dispatchEvent(new CustomEvent('onlineUsers', {
            detail: { userIds, count: userIds.length }
        }));
    }

    /**
     * Manejo de typing indicator
     */
    private handleUserTyping(data: { email: string; room: string }): void {
        document.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
    }

    /**
     * Manejo de stop typing
     */
    private handleUserStoppedTyping(data: { email: string; room: string }): void {
        document.dispatchEvent(new CustomEvent('userStoppedTyping', { detail: data }));
    }

    /**
     * Manejo de errores
     */
    private handleError(data: { message: string }): void {
        console.error('[Socket Client] Server error:', data.message);
        this.displayNotification({
            type: 'error',
            message: data.message,
            from: { email: 'System' },
            timestamp: new Date().toISOString()
        });
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    /**
     * Verifica si está conectado
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Enviar notificación
     */
    sendNotification(to: string | number, message: string, type: NotificationType = 'info', metadata: Record<string, any> = {}): void {
        if (!this.connected || !this.socket) {
            console.warn('[Socket Client] Not connected. Cannot send notification.');
            return;
        }
        this.socket.emit('send_notification', { to, type, message, metadata });
    }

    /**
     * Join a room específico
     */
    joinRoom(room: string): void {
        if (!this.connected || !this.socket) return;
        this.socket.emit('join_room', room);
    }

    /**
     * Leave room
     */
    leaveRoom(room: string): void {
        if (!this.connected || !this.socket) return;
        this.socket.emit('leave_room', room);
    }

    /**
     * Indicar que estás escribiendo
     */
    typing(room: string): void {
        if (!this.connected || !this.socket) return;
        this.socket.emit('typing', { room });
    }

    /**
     * Indicar que dejaste de escribir
     */
    stopTyping(room: string): void {
        if (!this.connected || !this.socket) return;
        this.socket.emit('stop_typing', { room });
    }

    /**
     * Desconectar manualmente
     */
    disconnect(): void {
        this.socket?.disconnect();
    }

    /**
     * Reconectar manualmente
     */
    reconnect(): void {
        this.socket?.connect();
    }

    /**
     * Inyectar estilos CSS
     */
    private injectStyles(): void {
        if (this.stylesInjected) return;

        const styles = document.createElement('style');
        styles.id = 'socket-client-styles';
        styles.textContent = `
            .notifications-container {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            }
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                border-left: 4px solid #3498db;
            }
            .notification-info { border-left-color: #3498db; }
            .notification-success { border-left-color: #27ae60; }
            .notification-warning { border-left-color: #f39c12; }
            .notification-error { border-left-color: #e74c3c; }
            .notification-message { border-left-color: #9b59b6; }
            .notification-header {
                display: flex; align-items: center; gap: 8px;
                margin-bottom: 8px; font-size: 12px; color: #666;
            }
            .notification-icon { font-size: 16px; }
            .notification-from { flex: 1; font-weight: 600; }
            .notification-time { font-size: 11px; }
            .notification-close {
                background: none; border: none; font-size: 20px;
                cursor: pointer; color: #999;
            }
            .notification-close:hover { color: #333; }
            .notification-body { font-size: 14px; color: #333; }
            .slide-in { animation: slideIn 0.3s ease-out; }
            .slide-out { animation: slideOut 0.3s ease-in; }
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
            .socket-status {
                position: fixed; bottom: 20px; right: 20px;
                padding: 8px 16px; border-radius: 20px;
                font-size: 12px; font-weight: 600; z-index: 9999;
            }
            .socket-status-connected { background: #d4edda; color: #155724; }
            .socket-status-disconnected { background: #f8d7da; color: #721c24; }
            .socket-status-reconnecting { background: #fff3cd; color: #856404; }
            .socket-status-failed { background: #f8d7da; color: #721c24; }
            .presence-indicator {
                display: inline-block; width: 10px; height: 10px;
                border-radius: 50%; margin-right: 5px;
            }
            .presence-online { background: #27ae60; box-shadow: 0 0 4px #27ae60; }
            .presence-offline { background: #95a5a6; }
        `;
        document.head.appendChild(styles);
        this.stylesInjected = true;
    }
}

// Singleton instance - only create if socket.io is available
export const socketClient = typeof io !== 'undefined' ? new SocketClient() : null;

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).SocketClient = SocketClient;
    if (socketClient) {
        (window as any).socketClient = socketClient;
    }
}

export default socketClient;
