/**
 * NOTIFICATION CLIENT - Cliente WebSocket para Notificaciones en Tiempo Real
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

class NotificationClient {
    constructor(options = {}) {
        this.wsUrl = options.wsUrl || `ws://${window.location.host}/ws/notifications`;
        this.autoReconnect = options.autoReconnect !== false;
        this.reconnectDelay = options.reconnectDelay || 3000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 5;

        this.ws = null;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.userId = null;
        this.token = null;
        this.listeners = new Map();
        this.pendingNotifications = [];

        this.init();
    }

    init() {
        // Intentar obtener userId y token de localStorage
        this.userId = localStorage.getItem('userId');
        this.token = localStorage.getItem('authToken');

        if (this.userId && this.token) {
            this.connect();
        } else {
            console.warn('⚠️ Sin credenciales de autenticación para WebSocket');
        }
    }

    /**
     * Conectar al servidor WebSocket
     */
    connect() {
        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = (event) => this.handleClose(event);
            this.ws.onerror = (error) => this.handleError(error);

            console.log(`🔌 Conectando a WebSocket: ${this.wsUrl}`);

        } catch (error) {
            console.error('❌ Error conectando a WebSocket:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Manejar apertura de conexión
     */
    handleOpen() {
        console.log('✅ Conexión WebSocket establecida');
        this.reconnectAttempts = 0;

        // Autenticar
        this.authenticate();

        // Iniciar heartbeat
        this.startHeartbeat();

        // Emit evento de conexión
        this.emit('connected');

        // Mostrar notificación de conexión
        this.showSystemNotification('Conectado', 'Notificaciones en tiempo real activadas');
    }

    /**
     * Autenticar con el servidor
     */
    authenticate() {
        this.send({
            type: 'auth',
            userId: this.userId,
            token: this.token
        });
    }

    /**
     * Manejar mensajes del servidor
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'connection':
                    console.log('📡 Conexión confirmada');
                    break;

                case 'auth':
                    if (data.status === 'authenticated') {
                        console.log(`✅ Autenticado como User ${data.userId}`);
                        this.emit('authenticated', data);
                    }
                    break;

                case 'notification':
                    this.handleNotification(data.data);
                    break;

                case 'pending_notifications':
                    this.handlePendingNotifications(data.data);
                    break;

                case 'room_joined':
                    console.log(`👥 Unido a sala: ${data.roomId}`);
                    this.emit('room_joined', data);
                    break;

                case 'room_notification':
                    this.handleRoomNotification(data);
                    break;

                case 'broadcast':
                    this.handleBroadcast(data.data);
                    break;

                case 'pong':
                    // Respuesta a ping
                    break;

                case 'error':
                    console.error('❌ Error del servidor:', data.message);
                    this.emit('error', data);
                    break;

                default:
                    console.warn('Tipo de mensaje desconocido:', data.type);
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    }

    /**
     * Manejar notificación individual
     */
    handleNotification(notification) {
        console.log('📨 Nueva notificación:', notification);

        // Agregar a pendientes
        this.pendingNotifications.push(notification);

        // Mostrar notificación visual
        this.showNotification(notification);

        // Emit evento
        this.emit('notification', notification);

        // Actualizar badge de contador
        this.updateNotificationBadge();
    }

    /**
     * Manejar notificaciones pendientes
     */
    handlePendingNotifications(notifications) {
        console.log(`📬 ${notifications.length} notificaciones pendientes recibidas`);

        this.pendingNotifications = notifications;

        // Emit evento
        this.emit('pending_notifications', notifications);

        // Actualizar UI
        this.updateNotificationBadge();
        this.renderNotificationsList();
    }

    /**
     * Manejar notificación de sala
     */
    handleRoomNotification(data) {
        console.log(`👥 Notificación de sala ${data.roomId}:`, data.data);
        this.emit('room_notification', data);
        this.showNotification(data.data);
    }

    /**
     * Manejar broadcast global
     */
    handleBroadcast(notification) {
        console.log('📡 Broadcast recibido:', notification);
        this.emit('broadcast', notification);
        this.showNotification(notification, { priority: 'high' });
    }

    /**
     * Mostrar notificación visual
     */
    showNotification(notification, options = {}) {
        // Notificación del navegador (si está permitido)
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotif = new Notification(notification.titulo || 'Nueva notificación', {
                body: notification.mensaje,
                icon: '/images/logo.png',
                badge: '/images/badge.png',
                tag: notification.id,
                requireInteraction: options.priority === 'high'
            });

            browserNotif.onclick = () => {
                if (notification.url) {
                    window.location.href = notification.url;
                }
                browserNotif.close();
            };
        }

        // Notificación in-app (toast)
        this.showToast(notification);
    }

    /**
     * Mostrar toast notification
     */
    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.tipo || 'info'}`;
        toast.innerHTML = `
            <div class="notification-icon">
                ${this.getIconForType(notification.tipo)}
            </div>
            <div class="notification-content">
                <h4>${notification.titulo || 'Notificación'}</h4>
                <p>${notification.mensaje}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                &times;
            </button>
        `;

        // Agregar al contenedor
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Click para ir a URL
        if (notification.url) {
            toast.style.cursor = 'pointer';
            toast.onclick = () => {
                window.location.href = notification.url;
                this.markAsRead(notification.id);
            };
        }
    }

    /**
     * Obtener icono según tipo de notificación
     */
    getIconForType(type) {
        const icons = {
            info: '&#9432;',
            success: '&#10004;',
            warning: '&#9888;',
            error: '&#10008;',
            message: '&#9993;'
        };
        return icons[type] || icons.info;
    }

    /**
     * Actualizar badge de contador de notificaciones
     */
    updateNotificationBadge() {
        const count = this.pendingNotifications.filter(n => !n.leida).length;
        const badge = document.querySelector('.notification-badge');

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    /**
     * Renderizar lista de notificaciones
     */
    renderNotificationsList() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (this.pendingNotifications.length === 0) {
            container.innerHTML = '<p class="no-notifications">No hay notificaciones</p>';
            return;
        }

        container.innerHTML = this.pendingNotifications.map(notif => `
            <div class="notification-item ${notif.leida ? 'read' : 'unread'}">
                <div class="notification-content">
                    <h5>${notif.titulo}</h5>
                    <p>${notif.mensaje}</p>
                    <span class="notification-time">${this.formatTime(notif.created_at)}</span>
                </div>
                ${!notif.leida ? `
                    <button onclick="window.notificationClient.markAsRead(${notif.id})">
                        Marcar leída
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    /**
     * Marcar notificación como leída
     */
    markAsRead(notificationId) {
        this.send({
            type: 'mark_read',
            notificationId,
            userId: this.userId
        });

        // Actualizar localmente
        const notif = this.pendingNotifications.find(n => n.id === notificationId);
        if (notif) {
            notif.leida = true;
            this.updateNotificationBadge();
            this.renderNotificationsList();
        }
    }

    /**
     * Unirse a una sala
     */
    joinRoom(roomId) {
        this.send({
            type: 'join_room',
            roomId
        });
    }

    /**
     * Salir de una sala
     */
    leaveRoom(roomId) {
        this.send({
            type: 'leave_room',
            roomId
        });
    }

    /**
     * Solicitar permiso para notificaciones del navegador
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    /**
     * Mostrar notificación del sistema
     */
    showSystemNotification(title, message) {
        this.showToast({
            tipo: 'info',
            titulo: title,
            mensaje: message
        });
    }

    /**
     * Enviar mensaje al servidor
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket no está conectado');
        }
    }

    /**
     * Manejar cierre de conexión
     */
    handleClose(event) {
        console.log(`🔌 Conexión WebSocket cerrada (${event.code})`);
        this.stopHeartbeat();
        this.emit('disconnected', event);

        if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.showSystemNotification(
                'Desconectado',
                'No se pudo mantener la conexión con el servidor'
            );
        }
    }

    /**
     * Manejar errores
     */
    handleError(error) {
        console.error('❌ Error de WebSocket:', error);
        this.emit('error', error);
    }

    /**
     * Programar reconexión
     */
    scheduleReconnect() {
        if (this.reconnectTimeout) return;

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`🔄 Reconectando en ${delay / 1000} segundos (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    /**
     * Iniciar heartbeat
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 30000);
    }

    /**
     * Detener heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Registrar listener para eventos
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Emitir evento
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    /**
     * Formatear tiempo relativo
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours}h`;

        const days = Math.floor(hours / 24);
        return `Hace ${days}d`;
    }

    /**
     * Desconectar
     */
    disconnect() {
        this.autoReconnect = false;
        if (this.ws) {
            this.ws.close();
        }
        this.stopHeartbeat();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
    }

    /**
     * Destruir cliente
     */
    destroy() {
        this.disconnect();
        this.listeners.clear();
        this.pendingNotifications = [];
        console.log('🗑️ NotificationClient destruido');
    }
}

// Auto-inicializar
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.notificationClient = new NotificationClient();

        // Solicitar permiso de notificaciones
        window.notificationClient.requestNotificationPermission();
    });
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationClient;
}
