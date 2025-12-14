/**
 * 🔔 SOCKET.IO CLIENT - SEMANA 5
 * Cliente centralizado de notificaciones en tiempo real
 *
 * Características:
 * - Auto-reconnection con backoff exponencial
 * - Event listeners con cleanup
 * - UI integration para notificaciones
 * - Presence detection (usuarios online)
 * - Typing indicators
 */

(function() {
    'use strict';

    // Verificar si io está disponible (debe cargar socket.io-client CDN primero)
    if (typeof io === 'undefined') {
        console.error('[Socket Client] socket.io-client not loaded. Add <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>');
        return;
    }

    class SocketClient {
        constructor() {
            this.socket = null;
            this.connected = false;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 10;
            this.handlers = new Map();  // Event handlers para cleanup

            this.init();
        }

        /**
         * Inicializar conexión
         */
        async init() {
            // Obtener token de autenticación
            const token = this.getAuthToken();

            if (!token) {
                console.warn('[Socket Client] No auth token found. Socket connection disabled.');
                return;
            }

            // Configurar Socket.IO client
            const serverUrl = window.location.origin;

            this.socket = io(serverUrl, {
                auth: {
                    token: token
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts,
                timeout: 20000
            });

            this.setupEventListeners();
            console.log('[Socket Client] Initialized');
        }

        /**
         * Obtener token JWT del storage
         */
        getAuthToken() {
            // Intentar desde sessionStorage primero
            let token = sessionStorage.getItem('authToken');

            // Fallback a localStorage
            if (!token) {
                token = localStorage.getItem('authToken');
            }

            return token;
        }

        /**
         * Setup de event listeners
         */
        setupEventListeners() {
            // Connection events
            this.socket.on('connect', () => this.handleConnect());
            this.socket.on('disconnect', (reason) => this.handleDisconnect(reason));
            this.socket.on('connect_error', (error) => this.handleConnectError(error));

            // Notification events
            this.socket.on('notification', (data) => this.handleNotification(data));
            this.socket.on('notifications_history', (data) => this.handleNotificationsHistory(data));

            // Presence events
            this.socket.on('user_presence', (data) => this.handleUserPresence(data));
            this.socket.on('online_users', (data) => this.handleOnlineUsers(data));

            // Typing events
            this.socket.on('user_typing', (data) => this.handleUserTyping(data));
            this.socket.on('user_stopped_typing', (data) => this.handleUserStoppedTyping(data));

            // Room events
            this.socket.on('room_joined', (data) => this.handleRoomJoined(data));
            this.socket.on('room_left', (data) => this.handleRoomLeft(data));

            // Error events
            this.socket.on('error', (data) => this.handleError(data));
        }

        /**
         * Manejo de conexión exitosa
         */
        handleConnect() {
            this.connected = true;
            this.reconnectAttempts = 0;

            console.log('[Socket Client] Connected to server:', this.socket.id);

            // Mostrar indicador de conexión en UI
            this.updateConnectionStatus('connected');

            // Disparar evento personalizado
            document.dispatchEvent(new CustomEvent('socketConnected', {
                detail: { socketId: this.socket.id }
            }));
        }

        /**
         * Manejo de desconexión
         */
        handleDisconnect(reason) {
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
        handleConnectError(error) {
            this.reconnectAttempts++;

            console.error(`[Socket Client] Connection error (attempt ${this.reconnectAttempts}):`, error.message);

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[Socket Client] Max reconnection attempts reached. Giving up.');
                this.updateConnectionStatus('failed');
            } else {
                this.updateConnectionStatus('reconnecting');
            }
        }

        /**
         * Actualizar indicador visual de conexión
         */
        updateConnectionStatus(status) {
            const indicator = document.getElementById('socket-connection-status');

            if (indicator) {
                indicator.className = `socket-status socket-status-${status}`;
                indicator.textContent = {
                    connected: '● Online',
                    disconnected: '● Offline',
                    reconnecting: '● Reconnecting...',
                    failed: '● Connection Failed'
                }[status] || '● Unknown';
            }
        }

        /**
         * Manejo de notificación recibida
         */
        handleNotification(notification) {
            console.log('[Socket Client] Notification received:', notification);

            // Mostrar notificación en UI
            this.displayNotification(notification);

            // Disparar evento personalizado
            document.dispatchEvent(new CustomEvent('notificationReceived', {
                detail: notification
            }));

            // Reproducir sonido (opcional)
            this.playNotificationSound();
        }

        /**
         * Mostrar notificación en UI
         */
        displayNotification(notification) {
            const { message, type, from, timestamp } = notification;

            // Crear elemento de notificación
            const notifEl = document.createElement('div');
            notifEl.className = `notification notification-${type || 'info'} slide-in`;
            notifEl.innerHTML = `
                <div class="notification-header">
                    <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                    <span class="notification-from">${from?.email || 'System'}</span>
                    <span class="notification-time">${this.formatTime(timestamp)}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="notification-body">
                    ${message}
                </div>
            `;

            // Agregar a container
            let container = document.getElementById('notifications-container');

            if (!container) {
                container = document.createElement('div');
                container.id = 'notifications-container';
                container.className = 'notifications-container';
                document.body.appendChild(container);
            }

            container.appendChild(notifEl);

            // Auto-remove después de 8 segundos
            setTimeout(() => {
                notifEl.classList.add('slide-out');
                setTimeout(() => notifEl.remove(), 300);
            }, 8000);
        }

        /**
         * Obtener ícono para tipo de notificación
         */
        getNotificationIcon(type) {
            const icons = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌',
                message: '💬'
            };

            return icons[type] || 'ℹ️';
        }

        /**
         * Formatear timestamp
         */
        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = (now - date) / 1000;  // segundos

            if (diff < 60) {
                return 'Ahora';
            } else if (diff < 3600) {
                return `Hace ${Math.floor(diff / 60)}m`;
            } else if (diff < 86400) {
                return `Hace ${Math.floor(diff / 3600)}h`;
            } else {
                return date.toLocaleDateString();
            }
        }

        /**
         * Reproducir sonido de notificación
         */
        playNotificationSound() {
            // Solo si el usuario ha interactuado con la página (Chrome policy)
            if (document.hasFocus()) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(err => {
                    // Silently fail si no puede reproducir
                });
            }
        }

        /**
         * Manejo de historial de notificaciones
         */
        handleNotificationsHistory(notifications) {
            console.log(`[Socket Client] Received ${notifications.length} historical notifications`);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('notificationsHistory', {
                detail: { notifications }
            }));
        }

        /**
         * Manejo de presencia de usuario
         */
        handleUserPresence(data) {
            console.log(`[Socket Client] User ${data.userId} is now ${data.status}`);

            // Actualizar UI de presencia
            this.updateUserPresenceUI(data);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('userPresence', {
                detail: data
            }));
        }

        /**
         * Actualizar UI de presencia
         */
        updateUserPresenceUI(data) {
            const { userId, status } = data;

            // Buscar todos los elementos con data-user-id
            const elements = document.querySelectorAll(`[data-user-id="${userId}"] .presence-indicator`);

            elements.forEach(el => {
                el.className = `presence-indicator presence-${status}`;
            });
        }

        /**
         * Manejo de lista de usuarios online
         */
        handleOnlineUsers(userIds) {
            console.log(`[Socket Client] ${userIds.length} users online`);

            // Disparar evento
            document.dispatchEvent(new CustomEvent('onlineUsers', {
                detail: { userIds, count: userIds.length }
            }));
        }

        /**
         * Manejo de typing indicator
         */
        handleUserTyping(data) {
            console.log(`[Socket Client] ${data.email} is typing in ${data.room}`);

            document.dispatchEvent(new CustomEvent('userTyping', {
                detail: data
            }));
        }

        /**
         * Manejo de stop typing
         */
        handleUserStoppedTyping(data) {
            document.dispatchEvent(new CustomEvent('userStoppedTyping', {
                detail: data
            }));
        }

        /**
         * Manejo de room joined
         */
        handleRoomJoined(data) {
            console.log(`[Socket Client] Joined room: ${data.room}`);
        }

        /**
         * Manejo de room left
         */
        handleRoomLeft(data) {
            console.log(`[Socket Client] Left room: ${data.room}`);
        }

        /**
         * Manejo de errores
         */
        handleError(data) {
            console.error('[Socket Client] Server error:', data.message);

            // Mostrar error en UI
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
         * Enviar notificación
         */
        sendNotification(to, message, type = 'info', metadata = {}) {
            if (!this.connected) {
                console.warn('[Socket Client] Not connected. Cannot send notification.');
                return;
            }

            this.socket.emit('send_notification', {
                to,
                type,
                message,
                metadata
            });
        }

        /**
         * Join a room específico
         */
        joinRoom(room) {
            if (!this.connected) return;
            this.socket.emit('join_room', room);
        }

        /**
         * Leave room
         */
        leaveRoom(room) {
            if (!this.connected) return;
            this.socket.emit('leave_room', room);
        }

        /**
         * Indicar que estás escribiendo
         */
        typing(room) {
            if (!this.connected) return;
            this.socket.emit('typing', { room });
        }

        /**
         * Indicar que dejaste de escribir
         */
        stopTyping(room) {
            if (!this.connected) return;
            this.socket.emit('stop_typing', { room });
        }

        /**
         * Desconectar manualmente
         */
        disconnect() {
            if (this.socket) {
                this.socket.disconnect();
            }
        }

        /**
         * Reconectar manualmente
         */
        reconnect() {
            if (this.socket) {
                this.socket.connect();
            }
        }
    }

    // ============================================
    // ESTILOS CSS INLINE
    // ============================================

    const styles = document.createElement('style');
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
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-size: 12px;
            color: #666;
        }

        .notification-icon {
            font-size: 16px;
        }

        .notification-from {
            flex: 1;
            font-weight: 600;
        }

        .notification-time {
            font-size: 11px;
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
        }

        .notification-close:hover {
            color: #333;
        }

        .notification-body {
            font-size: 14px;
            color: #333;
        }

        .slide-in {
            animation: slideIn 0.3s ease-out;
        }

        .slide-out {
            animation: slideOut 0.3s ease-in;
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        .socket-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 9999;
        }

        .socket-status-connected {
            background: #d4edda;
            color: #155724;
        }

        .socket-status-disconnected {
            background: #f8d7da;
            color: #721c24;
        }

        .socket-status-reconnecting {
            background: #fff3cd;
            color: #856404;
        }

        .socket-status-failed {
            background: #f8d7da;
            color: #721c24;
        }

        .presence-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }

        .presence-online {
            background: #27ae60;
            box-shadow: 0 0 4px #27ae60;
        }

        .presence-offline {
            background: #95a5a6;
        }
    `;
    document.head.appendChild(styles);

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.socketClient = new SocketClient();
        });
    } else {
        window.socketClient = new SocketClient();
    }

})();
