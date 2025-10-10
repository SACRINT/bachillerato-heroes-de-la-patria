/**
 * 📱 SISTEMA DE NOTIFICACIONES PUSH EN TIEMPO REAL
 * Sistema completo de notificaciones web push con WebSocket y Service Worker
 */

class RealTimeNotifications {
    constructor() {
        console.log('📱 [NOTIFICATIONS] Inicializando sistema de notificaciones...');
        this.apiBase = 'http://localhost:3005/api/notifications/';
        this.wsUrl = 'ws://localhost:3005/ws';
        this.authToken = localStorage.getItem('student_auth_token') || localStorage.getItem('admin_auth_token');
        this.currentUser = JSON.parse(localStorage.getItem('current_student') || localStorage.getItem('current_admin') || 'null');

        this.ws = null;
        this.vapidPublicKey = null;
        this.subscription = null;
        this.permissionGranted = false;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;

        this.init();
    }

    async init() {
        try {
            // Verificar soporte de notificaciones
            if (!this.checkNotificationSupport()) {
                console.warn('⚠️ Notificaciones no soportadas en este navegador');
                return;
            }

            // Inicializar Service Worker
            await this.initServiceWorker();

            // Solicitar permisos
            await this.requestPermission();

            // Conectar WebSocket
            await this.initWebSocket();

            // Configurar Push Notifications
            await this.setupPushNotifications();

            // Configurar event listeners
            this.setupEventListeners();

            // Cargar notificaciones existentes
            await this.loadExistingNotifications();

            console.log('✅ Sistema de notificaciones inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando notificaciones:', error);
        }
    }

    checkNotificationSupport() {
        return 'Notification' in window &&
               'serviceWorker' in navigator &&
               'PushManager' in window;
    }

    async initServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw-notifications.js');
                console.log('📱 Service Worker registrado:', registration.scope);

                // Actualizar SW si hay una nueva versión
                registration.addEventListener('updatefound', () => {
                    console.log('📱 Nueva versión del Service Worker disponible');
                });

                return registration;
            }
        } catch (error) {
            console.error('❌ Error registrando Service Worker:', error);
            throw error;
        }
    }

    async requestPermission() {
        try {
            if (Notification.permission === 'granted') {
                this.permissionGranted = true;
                return true;
            }

            if (Notification.permission === 'denied') {
                this.showPermissionDeniedMessage();
                return false;
            }

            // Solicitar permiso con mensaje personalizado
            this.showPermissionRequest();

            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';

            if (this.permissionGranted) {
                this.showPermissionGrantedMessage();
            } else {
                this.showPermissionDeniedMessage();
            }

            return this.permissionGranted;

        } catch (error) {
            console.error('❌ Error solicitando permisos:', error);
            return false;
        }
    }

    async initWebSocket() {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                return;
            }

            console.log('🔌 Conectando WebSocket...');
            this.ws = new WebSocket(`${this.wsUrl}?token=${this.authToken}&user=${this.currentUser?.id}`);

            this.ws.onopen = () => {
                console.log('✅ WebSocket conectado');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.showConnectionStatus(true);
            };

            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket desconectado');
                this.isConnected = false;
                this.showConnectionStatus(false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ Error WebSocket:', error);
                this.isConnected = false;
            };

        } catch (error) {
            console.error('❌ Error inicializando WebSocket:', error);
        }
    }

    handleWebSocketMessage(event) {
        try {
            const message = JSON.parse(event.data);
            console.log('📱 Mensaje WebSocket recibido:', message);

            switch (message.type) {
                case 'notification':
                    this.displayNotification(message.data);
                    break;
                case 'alert':
                    this.displayAlert(message.data);
                    break;
                case 'ping':
                    this.sendPong();
                    break;
                case 'system':
                    this.handleSystemMessage(message.data);
                    break;
                default:
                    console.log('📱 Tipo de mensaje no reconocido:', message.type);
            }

        } catch (error) {
            console.error('❌ Error procesando mensaje WebSocket:', error);
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo número de intentos de reconexión alcanzado');
            this.showReconnectionFailed();
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            this.initWebSocket();
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    async setupPushNotifications() {
        try {
            if (!this.permissionGranted) {
                console.log('⚠️ Permisos no concedidos para push notifications');
                return;
            }

            // Obtener VAPID key del servidor
            const vapidResponse = await this.apiCall('vapid-key');
            if (vapidResponse.success) {
                this.vapidPublicKey = vapidResponse.data.publicKey;
            }

            // Obtener Service Worker registration
            const registration = await navigator.serviceWorker.ready;

            // Verificar suscripción existente
            this.subscription = await registration.pushManager.getSubscription();

            if (!this.subscription) {
                // Crear nueva suscripción
                await this.subscribeToPush(registration);
            } else {
                // Verificar que la suscripción esté activa en el servidor
                await this.validateSubscription();
            }

        } catch (error) {
            console.error('❌ Error configurando push notifications:', error);
        }
    }

    async subscribeToPush(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey)
            });

            this.subscription = subscription;

            // Enviar suscripción al servidor
            const response = await this.apiCall('subscribe', {
                method: 'POST',
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    user_id: this.currentUser?.id,
                    user_type: this.currentUser?.type || 'student'
                })
            });

            if (response.success) {
                console.log('✅ Suscripción a push notifications exitosa');
                this.showSubscriptionSuccess();
            } else {
                console.error('❌ Error enviando suscripción al servidor');
            }

        } catch (error) {
            console.error('❌ Error suscribiendo a push notifications:', error);
        }
    }

    async validateSubscription() {
        try {
            const response = await this.apiCall('validate-subscription', {
                method: 'POST',
                body: JSON.stringify({
                    endpoint: this.subscription.endpoint,
                    user_id: this.currentUser?.id
                })
            });

            if (!response.success) {
                console.log('🔄 Suscripción no válida, reactivando...');
                const registration = await navigator.serviceWorker.ready;
                await this.subscribeToPush(registration);
            }

        } catch (error) {
            console.error('❌ Error validando suscripción:', error);
        }
    }

    urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async displayNotification(data) {
        try {
            // Mostrar notificación en pantalla
            this.showInAppNotification(data);

            // Mostrar notificación nativa si el usuario no está en la página
            if (document.hidden && this.permissionGranted) {
                const notification = new Notification(data.title, {
                    body: data.message,
                    icon: data.icon || '/images/notification-icon.png',
                    badge: '/images/badge-icon.png',
                    tag: data.id,
                    data: data,
                    requireInteraction: data.priority === 'high',
                    actions: data.actions || []
                });

                notification.onclick = () => {
                    window.focus();
                    this.handleNotificationClick(data);
                    notification.close();
                };
            }

            // Reproducir sonido si está habilitado
            if (data.sound !== false) {
                this.playNotificationSound(data.priority);
            }

            // Actualizar contador de notificaciones
            this.updateNotificationCounter();

        } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
        }
    }

    showInAppNotification(data) {
        const notificationHtml = `
            <div class="notification-item ${data.priority || 'normal'}" data-id="${data.id}">
                <div class="notification-header">
                    <div class="notification-icon">
                        <i class="fas ${this.getNotificationIcon(data.type)}"></i>
                    </div>
                    <div class="notification-meta">
                        <span class="notification-time">${this.formatTime(data.timestamp)}</span>
                        <button class="notification-close" onclick="window.notificationSystem.dismissNotification('${data.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="notification-content">
                    <h6 class="notification-title">${data.title}</h6>
                    <p class="notification-message">${data.message}</p>
                    ${data.actions ? this.renderNotificationActions(data.actions, data.id) : ''}
                </div>
            </div>
        `;

        // Agregar a la cola de notificaciones
        this.addToNotificationQueue(notificationHtml, data.priority);

        // Mostrar en el panel de notificaciones si está abierto
        this.updateNotificationPanel();
    }

    addToNotificationQueue(html, priority = 'normal') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = this.createNotificationContainer();
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const notification = tempDiv.firstElementChild;

        // Insertar según prioridad
        if (priority === 'high' || priority === 'critical') {
            container.insertBefore(notification, container.firstChild);
        } else {
            container.appendChild(notification);
        }

        // Animación de entrada
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 100);

        // Auto-dismiss para notificaciones normales
        if (priority === 'normal') {
            setTimeout(() => {
                this.dismissNotification(notification.dataset.id);
            }, 5000);
        }
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container position-fixed';
        container.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            width: 100%;
        `;

        document.body.appendChild(container);
        return container;
    }

    dismissNotification(notificationId) {
        const notification = document.querySelector(`[data-id="${notificationId}"]`);
        if (notification) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }

        // Marcar como leída en el servidor
        this.markAsRead(notificationId);
    }

    async markAsRead(notificationId) {
        try {
            await this.apiCall(`mark-read/${notificationId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('❌ Error marcando notificación como leída:', error);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'grade': 'fa-chart-line',
            'assignment': 'fa-tasks',
            'message': 'fa-envelope',
            'alert': 'fa-exclamation-triangle',
            'system': 'fa-cog',
            'achievement': 'fa-trophy',
            'reminder': 'fa-bell',
            'news': 'fa-newspaper'
        };
        return icons[type] || 'fa-bell';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Ahora';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString();
    }

    renderNotificationActions(actions, notificationId) {
        return `
            <div class="notification-actions mt-2">
                ${actions.map(action => `
                    <button class="btn btn-sm btn-outline-primary me-2"
                            onclick="window.notificationSystem.handleNotificationAction('${action.action}', '${notificationId}')">
                        ${action.title}
                    </button>
                `).join('')}
            </div>
        `;
    }

    async handleNotificationAction(action, notificationId) {
        try {
            const response = await this.apiCall('action', {
                method: 'POST',
                body: JSON.stringify({
                    notification_id: notificationId,
                    action: action
                })
            });

            if (response.success) {
                this.dismissNotification(notificationId);

                // Ejecutar acción local si es necesaria
                this.executeLocalAction(action, response.data);
            }

        } catch (error) {
            console.error('❌ Error ejecutando acción de notificación:', error);
        }
    }

    executeLocalAction(action, data) {
        const actions = {
            'view_grade': () => window.location.href = '/calificaciones.html',
            'view_assignment': () => window.location.href = '/tareas.html',
            'open_chat': () => this.openChat(data?.chat_id),
            'schedule_meeting': () => window.location.href = '/citas.html',
            'download_file': () => this.downloadFile(data?.file_url)
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    playNotificationSound(priority = 'normal') {
        try {
            const soundFiles = {
                'critical': '/sounds/critical-notification.mp3',
                'high': '/sounds/high-notification.mp3',
                'normal': '/sounds/normal-notification.mp3'
            };

            const audio = new Audio(soundFiles[priority] || soundFiles.normal);
            audio.volume = 0.3;
            audio.play().catch(e => {
                console.log('⚠️ No se pudo reproducir sonido de notificación:', e);
            });

        } catch (error) {
            console.log('⚠️ Error reproduciendo sonido:', error);
        }
    }

    setupEventListeners() {
        // Listener para visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isConnected) {
                this.sendPresenceUpdate('online');
            } else if (this.isConnected) {
                this.sendPresenceUpdate('away');
            }
        });

        // Listener para cierre de ventana
        window.addEventListener('beforeunload', () => {
            if (this.isConnected) {
                this.sendPresenceUpdate('offline');
            }
        });

        // Listener para eventos de notificación
        document.addEventListener('notificationPermissionChanged', (e) => {
            this.permissionGranted = e.detail.granted;
        });
    }

    sendPresenceUpdate(status) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'presence',
                status: status,
                user_id: this.currentUser?.id,
                timestamp: new Date().toISOString()
            }));
        }
    }

    sendPong() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'pong' }));
        }
    }

    async loadExistingNotifications() {
        try {
            const response = await this.apiCall('recent');
            if (response.success) {
                response.data.forEach(notification => {
                    if (!notification.read) {
                        this.showInAppNotification(notification);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error cargando notificaciones existentes:', error);
        }
    }

    updateNotificationCounter() {
        const counter = document.querySelector('.notification-counter');
        if (counter) {
            const unreadCount = document.querySelectorAll('.notification-item:not(.read)').length;
            counter.textContent = unreadCount > 0 ? unreadCount : '';
            counter.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    async apiCall(endpoint, options = {}) {
        try {
            const url = this.apiBase + endpoint;
            const config = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            if (this.authToken) {
                config.headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const response = await fetch(url, config);
            return await response.json();

        } catch (error) {
            console.error('❌ Error en llamada API:', error);
            throw error;
        }
    }

    // Métodos de UI
    showPermissionRequest() {
        this.showToast('info', 'Activar Notificaciones', 'Permite las notificaciones para recibir actualizaciones importantes');
    }

    showPermissionGrantedMessage() {
        this.showToast('success', 'Notificaciones Activadas', 'Recibirás notificaciones de actualizaciones importantes');
    }

    showPermissionDeniedMessage() {
        this.showToast('warning', 'Notificaciones Desactivadas', 'Puedes activarlas desde la configuración del navegador');
    }

    showConnectionStatus(connected) {
        const status = connected ? 'Conectado' : 'Desconectado';
        const type = connected ? 'success' : 'danger';
        this.showToast(type, 'Estado de Conexión', `Sistema de notificaciones: ${status}`);
    }

    showSubscriptionSuccess() {
        this.showToast('success', 'Push Notifications', 'Configuración exitosa para notificaciones push');
    }

    showReconnectionFailed() {
        this.showToast('danger', 'Error de Conexión', 'No se pudo conectar al sistema de notificaciones');
    }

    showToast(type, title, message) {
        // Implementación básica de toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 10000; min-width: 300px;';
        toast.innerHTML = `
            <strong>${title}</strong><br>
            ${message}
            <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    // Métodos públicos para integración
    async sendNotification(recipientId, notification) {
        try {
            const response = await this.apiCall('send', {
                method: 'POST',
                body: JSON.stringify({
                    recipient_id: recipientId,
                    ...notification
                })
            });

            return response.success;
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            return false;
        }
    }

    async getNotificationHistory(filters = {}) {
        try {
            const queryString = new URLSearchParams(filters).toString();
            const response = await this.apiCall(`history?${queryString}`);
            return response.success ? response.data : [];
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    }

    async updateNotificationSettings(settings) {
        try {
            const response = await this.apiCall('settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            return response.success;
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            return false;
        }
    }

    // Limpieza
    destroy() {
        if (this.ws) {
            this.ws.close();
        }

        const container = document.getElementById('notification-container');
        if (container) {
            container.remove();
        }

        console.log('📱 Sistema de notificaciones terminado');
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new RealTimeNotifications();
});

// Exportar para uso global
window.RealTimeNotifications = RealTimeNotifications;