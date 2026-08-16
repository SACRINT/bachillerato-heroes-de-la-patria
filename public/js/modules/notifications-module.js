/**
 * NOTIFICATIONS MODULE - Módulo de Notificaciones
 * Versión: 1.0.0 | SEMANA 1 - Refactorización
 */
class NotificationsModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.notifications = [];
        this.apiEndpoint = '/api/notifications';
        void 0;
    }

    async init() {
        this.subscribeToEvents();
        await this.loadNotifications();
        void 0;
    }

    subscribeToEvents() {
        this.eventBus.on('dashboard.initialized', () => this.loadNotifications());
        this.eventBus.on('notifications.load', () => this.loadNotifications());
        this.eventBus.on('notifications.send', async (e) => await this.sendNotification(e.data));
        this.eventBus.on('notifications.markRead', async (e) => await this.markAsRead(e.data.id));
    }

    async loadNotifications() {
        try {
            const response = await fetch(this.apiEndpoint, { headers: this.getAuthHeaders() });
            const data = await response.json();
            this.notifications = data.notifications || data || [];
            this.eventBus.emit('notifications.loaded', { notifications: this.notifications });
            void 0;
        } catch (error) {
            console.error('[NOTIFICATIONS-MODULE] ❌ Error:', error);
            this.eventBus.emit('notifications.error', { operation: 'load', error: error.message });
        }
    }

    async sendNotification(notificationData) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(notificationData)
            });
            const notification = await response.json();
            this.notifications.unshift(notification);
            this.eventBus.emit('notifications.sent', { notification });
            return notification;
        } catch (error) {
            this.eventBus.emit('notifications.error', { operation: 'send', error: error.message });
            throw error;
        }
    }

    async markAsRead(id) {
        try {
            await fetch(`${this.apiEndpoint}/${id}/read`, { method: 'PUT', headers: this.getAuthHeaders() });
            const notification = this.notifications.find(n => n.id === id);
            if (notification) notification.read = true;
            this.eventBus.emit('notifications.marked', { id });
        } catch (error) {
            this.eventBus.emit('notifications.error', { operation: 'markRead', error: error.message });
        }
    }

    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('bge_auth_token') || 
                      sessionStorage.getItem('bge_auth_token') || 
                      localStorage.getItem('authToken') || 
                      sessionStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            return headers;
        }
        try {
            const session = JSON.parse(localStorage.getItem('secure_admin_session') || '{}');
            if (session.token) headers['Authorization'] = `Bearer ${session.token}`;
        } catch (e) {}
        return headers;
    }

    destroy() { this.notifications = []; void 0; }
}
window.NotificationsModule = NotificationsModule;
