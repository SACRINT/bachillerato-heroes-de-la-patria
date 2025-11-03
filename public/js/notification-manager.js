/**
 * NOTIFICATION MANAGER - Sistema Avanzado de Notificaciones Push
 * Bachillerato General Estatal "Héroes de la Patria"
 * Versión 1.0 - Septiembre 2025
 *
 * Sistema completo para gestión de notificaciones push con:
 * - Suscripciones personalizables
 * - Configuración de alertas por tipo
 * - Programación de notificaciones
 * - Historial y seguimiento
 */

class NotificationManager {
    constructor() {
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        this.permission = Notification.permission;
        this.subscription = null;
        this.config = this.loadConfiguration();
        this.notificationQueue = [];

        console.log('🔔 Notification Manager initialized', {
            supported: this.isSupported,
            permission: this.permission,
            config: this.config
        });

        this.init();
    }

    // === INICIALIZACIÓN ===
    async init() {
        if (!this.isSupported) {
            console.warn('⚠️ Notifications not supported in this browser');
            return;
        }

        await this.setupServiceWorker();
        await this.loadSubscription();
        this.setupEventListeners();
        this.setupPeriodicChecks();

        console.log('✅ Notification Manager ready');
    }

    async setupServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                this.swRegistration = registration;

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

                console.log('🔧 Service Worker connected for notifications');
            }
        } catch (error) {
            console.error('❌ Service Worker setup failed:', error);
        }
    }

    // === GESTIÓN DE PERMISOS ===
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Notifications not supported');
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                await this.subscribe();
                this.saveConfiguration();
                return true;
            } else {
                console.warn('⚠️ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('❌ Permission request failed:', error);
            return false;
        }
    }

    // === SUSCRIPCIONES ===
    async subscribe() {
        if (!this.swRegistration) {
            throw new Error('Service Worker not available');
        }

        try {
            // VAPID keys - En producción usar claves reales del servidor
            const applicationServerKey = this.urlBase64ToUint8Array(
                'BEl62iUYgUivxIkv69yViEuiBIa40HI80NdPPfe5mwQdNbSIWSlJMJCUjVjsWXM8MF2Srd4C5U0TZ8KPeU4jq8g'
            );

            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            this.subscription = subscription;
            await this.sendSubscriptionToServer(subscription);

            console.log('🔔 Push subscription successful:', subscription);
            return subscription;

        } catch (error) {
            console.error('❌ Push subscription failed:', error);
            throw error;
        }
    }

    async loadSubscription() {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();

            if (subscription) {
                this.subscription = subscription;
                console.log('📱 Existing subscription loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load subscription:', error);
        }
    }

    async unsubscribe() {
        if (!this.subscription) return;

        try {
            await this.subscription.unsubscribe();
            await this.removeSubscriptionFromServer(this.subscription);
            this.subscription = null;

            console.log('🚫 Push subscription removed');
        } catch (error) {
            console.error('❌ Unsubscribe failed:', error);
        }
    }

    // === CONFIGURACIÓN DE TIPOS DE NOTIFICACIÓN ===
    loadConfiguration() {
        const defaultConfig = {
            enabled: false,
            types: {
                news: { enabled: true, title: 'Noticias', icon: '📰' },
                events: { enabled: true, title: 'Eventos', icon: '📅' },
                academic: { enabled: true, title: 'Académico', icon: '🎓' },
                emergency: { enabled: true, title: 'Emergencias', icon: '🚨' },
                announcements: { enabled: true, title: 'Avisos', icon: '📢' },
                reminders: { enabled: true, title: 'Recordatorios', icon: '⏰' }
            },
            schedule: {
                quiet_hours: {
                    enabled: true,
                    start: '22:00',
                    end: '07:00'
                },
                weekend_notifications: true
            },
            preferences: {
                sound: true,
                vibration: true,
                badge: true,
                require_interaction: false
            }
        };

        const saved = localStorage.getItem('heroesPatria_notificationConfig');
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    }

    saveConfiguration() {
        localStorage.setItem('heroesPatria_notificationConfig', JSON.stringify(this.config));
        console.log('💾 Notification configuration saved');
    }

    updateConfiguration(updates) {
        this.config = { ...this.config, ...updates };
        this.saveConfiguration();

        // Emit event for UI updates
        this.emit('configUpdated', this.config);
    }

    // === ENVÍO DE NOTIFICACIONES ===
    async sendNotification(type, title, options = {}) {
        if (!this.isNotificationAllowed(type)) {
            console.log(`🔇 Notification blocked for type: ${type}`);
            return;
        }

        const notificationData = this.prepareNotificationData(type, title, options);

        if (this.isQuietHours() && !options.emergency) {
            console.log('😴 Quiet hours - notification queued');
            this.queueNotification(notificationData);
            return;
        }

        await this.displayNotification(notificationData);
    }

    prepareNotificationData(type, title, options) {
        const typeConfig = this.config.types[type] || {};

        return {
            title: `${typeConfig.icon || '🔔'} ${title}`,
            body: options.body || '',
            icon: options.icon || './images/app_icons/icon-192x192.png',
            badge: './images/app_icons/icon-96x96.png',
            image: options.image,
            data: {
                type: type,
                url: options.url,
                timestamp: Date.now(),
                id: this.generateNotificationId()
            },
            actions: options.actions || this.getDefaultActions(type),
            requireInteraction: options.requireInteraction || this.config.preferences.require_interaction,
            silent: !this.config.preferences.sound,
            vibrate: this.config.preferences.vibration ? [200, 100, 200] : [],
            tag: `heroes-${type}-${Date.now()}`,
            renotify: true
        };
    }

    async displayNotification(notificationData) {
        try {
            if (this.swRegistration) {
                // Use service worker for better reliability
                await this.swRegistration.showNotification(notificationData.title, notificationData);
            } else {
                // Fallback to direct API
                new Notification(notificationData.title, notificationData);
            }

            this.saveNotificationToHistory(notificationData);
            console.log('🔔 Notification displayed:', notificationData.title);

        } catch (error) {
            console.error('❌ Failed to display notification:', error);
        }
    }

    // === GESTIÓN DE HORARIOS ===
    isQuietHours() {
        if (!this.config.schedule.quiet_hours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const start = this.timeStringToMinutes(this.config.schedule.quiet_hours.start);
        const end = this.timeStringToMinutes(this.config.schedule.quiet_hours.end);

        if (start > end) {
            // Crosses midnight
            return currentTime >= start || currentTime <= end;
        } else {
            return currentTime >= start && currentTime <= end;
        }
    }

    isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6;
    }

    isNotificationAllowed(type) {
        if (!this.config.enabled) return false;
        if (!this.config.types[type]?.enabled) return false;
        if (this.isWeekend() && !this.config.schedule.weekend_notifications && type !== 'emergency') return false;

        return true;
    }

    // === COLA DE NOTIFICACIONES ===
    queueNotification(notificationData) {
        this.notificationQueue.push(notificationData);

        // Limit queue size
        if (this.notificationQueue.length > 50) {
            this.notificationQueue = this.notificationQueue.slice(-50);
        }

        this.saveNotificationQueue();
    }

    async processQueuedNotifications() {
        if (this.notificationQueue.length === 0) return;

        console.log(`📤 Processing ${this.notificationQueue.length} queued notifications`);

        const notifications = [...this.notificationQueue];
        this.notificationQueue = [];

        for (const notification of notifications) {
            await this.displayNotification(notification);
            await this.delay(1000); // 1 second between notifications
        }

        this.saveNotificationQueue();
    }

    setupPeriodicChecks() {
        // Check for queued notifications every 10 minutes
        setInterval(() => {
            if (!this.isQuietHours()) {
                this.processQueuedNotifications();
            }
        }, 10 * 60 * 1000);

        // Daily check for new content
        setInterval(() => {
            this.checkForUpdates();
        }, 60 * 60 * 1000); // Every hour
    }

    // === ACCIONES Y MANEJO DE EVENTOS ===
    getDefaultActions(type) {
        const actions = {
            news: [
                { action: 'read', title: 'Leer', icon: './images/icons/read.png' },
                { action: 'dismiss', title: 'Cerrar', icon: './images/icons/close.png' }
            ],
            events: [
                { action: 'view', title: 'Ver evento', icon: './images/icons/calendar.png' },
                { action: 'remind', title: 'Recordar', icon: './images/icons/reminder.png' }
            ],
            academic: [
                { action: 'open', title: 'Abrir', icon: './images/icons/open.png' },
                { action: 'later', title: 'Más tarde', icon: './images/icons/later.png' }
            ]
        };

        return actions[type] || [
            { action: 'view', title: 'Ver', icon: './images/icons/view.png' },
            { action: 'dismiss', title: 'Cerrar', icon: './images/icons/close.png' }
        ];
    }

    handleServiceWorkerMessage(event) {
        const { data } = event;

        if (data.type === 'notificationClick') {
            this.handleNotificationClick(data.notification, data.action);
        }
    }

    handleNotificationClick(notification, action) {
        console.log('👆 Notification clicked:', notification, action);

        switch (action) {
            case 'read':
            case 'view':
            case 'open':
                if (notification.data.url) {
                    window.open(notification.data.url, '_blank');
                }
                break;

            case 'remind':
                this.scheduleReminder(notification);
                break;

            case 'later':
                this.scheduleForLater(notification);
                break;

            default:
                console.log('📋 Notification acknowledged');
        }

        this.markNotificationAsRead(notification.data.id);
    }

    // === PROGRAMACIÓN DE NOTIFICACIONES ===
    scheduleReminder(notification, delayMinutes = 60) {
        setTimeout(() => {
            this.sendNotification(
                notification.data.type,
                `Recordatorio: ${notification.title}`,
                {
                    body: notification.body,
                    url: notification.data.url,
                    requireInteraction: true
                }
            );
        }, delayMinutes * 60 * 1000);

        console.log(`⏰ Reminder scheduled for ${delayMinutes} minutes`);
    }

    scheduleForLater(notification) {
        this.queueNotification({
            ...notification,
            title: `Pendiente: ${notification.title}`,
            data: {
                ...notification.data,
                scheduled: true,
                originalTime: notification.data.timestamp
            }
        });
    }

    // === HISTORIAL ===
    saveNotificationToHistory(notification) {
        const history = this.getNotificationHistory();
        history.unshift({
            ...notification,
            displayed_at: Date.now(),
            read: false
        });

        // Keep last 100 notifications
        const trimmed = history.slice(0, 100);
        localStorage.setItem('heroesPatria_notificationHistory', JSON.stringify(trimmed));
    }

    getNotificationHistory() {
        const saved = localStorage.getItem('heroesPatria_notificationHistory');
        return saved ? JSON.parse(saved) : [];
    }

    markNotificationAsRead(id) {
        const history = this.getNotificationHistory();
        const notification = history.find(n => n.data.id === id);

        if (notification) {
            notification.read = true;
            notification.read_at = Date.now();
            localStorage.setItem('heroesPatria_notificationHistory', JSON.stringify(history));
        }
    }

    clearHistory() {
        localStorage.removeItem('heroesPatria_notificationHistory');
        console.log('🗑️ Notification history cleared');
    }

    // === INTEGRACIÓN CON SERVIDOR ===
    async sendSubscriptionToServer(subscription) {
        try {
            // Solo enviar al servidor si está disponible
            if (window.location.hostname === 'localhost' && window.location.port === '3000') {
                const response = await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        subscription: subscription,
                        config: this.config,
                        timestamp: Date.now()
                    })
                });

                if (response.ok) {
                    console.log('📡 Subscription sent to server');
                }
            } else {
                console.log('ℹ️ [NOTIFICATIONS] Modo estático - Subscription almacenada localmente');
            }
        } catch (error) {
            console.log('ℹ️ [NOTIFICATIONS] Servidor no disponible, usando almacenamiento local');
            // Store locally for retry
            localStorage.setItem('heroesPatria_pendingSubscription', JSON.stringify(subscription));
        }
    }

    async removeSubscriptionFromServer(subscription) {
        try {
            // Solo enviar al servidor si está disponible
            if (window.location.hostname === 'localhost' && window.location.port === '3000') {
                await fetch('/api/notifications/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ subscription })
                });
                console.log('📡 Unsubscribe sent to server');
            } else {
                console.log('ℹ️ [NOTIFICATIONS] Modo estático - Unsubscribe local');
            }
        } catch (error) {
            console.log('ℹ️ [NOTIFICATIONS] Servidor no disponible para unsubscribe');
        }
    }

    async checkForUpdates() {
        try {
            // Solo verificar si estamos en modo desarrollo con backend
            if (window.location.hostname === 'localhost' && window.location.port === '3000') {
                try {
                    // Verificar con timeout corto para evitar bloqueos
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos

                    const response = await fetch('/api/notifications/check', {
                        signal: controller.signal,
                        cache: 'no-cache'
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.log('ℹ️ [NOTIFICATIONS] Backend API no disponible, usando modo offline');
                        return;
                    }

                    const data = await response.json();

                    if (data.notifications && data.notifications.length > 0) {
                        for (const notification of data.notifications) {
                            await this.sendNotification(
                                notification.type,
                                notification.title,
                                notification.options
                            );
                        }
                    }
                } catch (fetchError) {
                    console.log('ℹ️ [NOTIFICATIONS] Error conectando con API:', fetchError.message);
                    return;
                }
            } else {
                // En modo estático o producción, usar simulación local
                console.log('ℹ️ [NOTIFICATIONS] Modo estático - Sin verificación de backend');
            }
        } catch (error) {
            console.log('ℹ️ [NOTIFICATIONS] API no disponible, usando modo offline');
        }
    }

    // === UTILIDADES ===
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    generateNotificationId() {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveNotificationQueue() {
        localStorage.setItem('heroesPatria_notificationQueue', JSON.stringify(this.notificationQueue));
    }

    loadNotificationQueue() {
        const saved = localStorage.getItem('heroesPatria_notificationQueue');
        this.notificationQueue = saved ? JSON.parse(saved) : [];
    }

    // === EVENT SYSTEM ===
    emit(eventName, data) {
        window.dispatchEvent(new CustomEvent(`notification:${eventName}`, { detail: data }));
    }

    on(eventName, callback) {
        window.addEventListener(`notification:${eventName}`, callback);
    }

    setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.processQueuedNotifications();
        });

        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }

    // === API PÚBLICA ===
    async enable() {
        const granted = await this.requestPermission();
        if (granted) {
            this.config.enabled = true;
            this.saveConfiguration();
        }
        return granted;
    }

    disable() {
        this.config.enabled = false;
        this.saveConfiguration();
        this.unsubscribe();
    }

    isEnabled() {
        return this.config.enabled && this.permission === 'granted';
    }

    getConfig() {
        return { ...this.config };
    }

    getStats() {
        const history = this.getNotificationHistory();
        const unread = history.filter(n => !n.read).length;

        return {
            total: history.length,
            unread: unread,
            queued: this.notificationQueue.length,
            permission: this.permission,
            enabled: this.config.enabled,
            subscription: !!this.subscription
        };
    }
}

// === INICIALIZACIÓN GLOBAL ===
window.NotificationManager = NotificationManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.heroesNotifications = new NotificationManager();
    });
} else {
    window.heroesNotifications = new NotificationManager();
}

console.log('🔔 Notification Manager loaded successfully');