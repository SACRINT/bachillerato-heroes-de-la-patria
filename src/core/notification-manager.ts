/**
 * 🔔 NOTIFICATION MANAGER - TypeScript
 * Sistema avanzado de notificaciones push para BGE
 *
 * Features:
 * - Push Notifications (Service Worker)
 * - Gestión de suscripciones VAPID
 * - Configuración de tipos y horarios
 * - Historial y cola offline
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 */

import { debugLog } from './debug-logger';
import { apiClient } from './api-client';

export type NotificationType = 'news' | 'events' | 'academic' | 'emergency' | 'announcements' | 'reminders';

export interface NotificationTypeConfig {
    enabled: boolean;
    title: string;
    icon: string;
}

export interface NotificationSchedule {
    quiet_hours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    weekend_notifications: boolean;
}

export interface NotificationPreferences {
    sound: boolean;
    vibration: boolean;
    badge: boolean;
    require_interaction: boolean;
}

export interface NotificationConfig {
    enabled: boolean;
    types: Record<NotificationType, NotificationTypeConfig>;
    schedule: NotificationSchedule;
    preferences: NotificationPreferences;
}

export interface QueuedNotification {
    type: NotificationType;
    title: string;
    options?: NotificationOptions;
    timestamp: number;
}

export interface NotificationHistoryItem {
    id: string;
    title: string;
    body: string;
    data: any;
    displayed_at: number;
    read: boolean;
    read_at?: number;
}

export class NotificationManager {
    private static instance: NotificationManager;

    public isSupported: boolean;
    public permission: NotificationPermission;
    public subscription: PushSubscription | null = null;
    public config: NotificationConfig;
    public swRegistration: ServiceWorkerRegistration | null = null;

    private notificationQueue: QueuedNotification[] = [];
    private readonly VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80NdPPfe5mwQdNbSIWSlJMJCUjVjsWXM8MF2Srd4C5U0TZ8KPeU4jq8g';

    private constructor() {
        this.isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
        this.permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
        this.config = this.loadConfiguration();

        // Cargar cola
        this.loadNotificationQueue();

        debugLog.log('NOTIFICATIONS', '🔔 Notification Manager initialized TS', {
            supported: this.isSupported,
            permission: this.permission
        });

        if (this.isSupported) {
            this.init();
        }
    }

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    private async init(): Promise<void> {
        await this.setupServiceWorker();
        await this.loadSubscription();
        this.setupEventListeners();
        this.setupPeriodicChecks();
    }

    private async setupServiceWorker(): Promise<void> {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                this.swRegistration = registration;

                navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
                debugLog.log('NOTIFICATIONS', '🔧 Service Worker connected for notifications');
            }
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Service Worker setup failed:', error);
        }
    }

    // === GESTIÓN DE PERMISOS ===

    public async requestPermission(): Promise<boolean> {
        if (!this.isSupported) {
            console.warn('Notifications not supported');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                debugLog.log('NOTIFICATIONS', '✅ Notification permission granted');
                await this.subscribe();
                this.saveConfiguration();
                return true;
            } else {
                debugLog.warn('NOTIFICATIONS', '⚠️ Notification permission denied');
                return false;
            }
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Permission request failed:', error);
            return false;
        }
    }

    // === SUSCRIPCIONES ===

    public async subscribe(): Promise<PushSubscription | null> {
        if (!this.swRegistration) {
            console.warn('Service Worker not available for subscription');
            return null;
        }

        try {
            const applicationServerKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY) as unknown as BufferSource;

            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            this.subscription = subscription;
            await this.sendSubscriptionToServer(subscription);

            debugLog.log('NOTIFICATIONS', '🔔 Push subscription successful');
            return subscription;
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Push subscription failed:', error);
            return null;
        }
    }

    private async loadSubscription(): Promise<void> {
        if (!this.swRegistration) return;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (subscription) {
                this.subscription = subscription;
                debugLog.log('NOTIFICATIONS', '📱 Existing subscription loaded');
            }
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Failed to load subscription:', error);
        }
    }

    public async unsubscribe(): Promise<void> {
        if (!this.subscription) return;

        try {
            const subscriptionId = this.extractSubscriptionId(this.subscription);
            await this.subscription.unsubscribe();

            if (subscriptionId) {
                await this.removeSubscriptionFromServer(subscriptionId);
            }

            this.subscription = null;
            debugLog.log('NOTIFICATIONS', '🚫 Push subscription removed');
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Unsubscribe failed:', error);
        }
    }

    private extractSubscriptionId(subscription: PushSubscription): string | null {
        // En algunos navegadores el endpoint contiene el ID al final
        if (subscription.endpoint) {
            const parts = subscription.endpoint.split('/');
            return parts[parts.length - 1];
        }
        return null;
    }

    // === CONFIGURACIÓN ===

    private loadConfiguration(): NotificationConfig {
        const defaultConfig: NotificationConfig = {
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
                quiet_hours: { enabled: true, start: '22:00', end: '07:00' },
                weekend_notifications: true
            },
            preferences: {
                sound: true,
                vibration: true,
                badge: true,
                require_interaction: false
            }
        };

        if (typeof localStorage === 'undefined') return defaultConfig;

        const saved = localStorage.getItem('heroesPatria_notificationConfig');
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    }

    private saveConfiguration(): void {
        localStorage.setItem('heroesPatria_notificationConfig', JSON.stringify(this.config));
    }

    public updateConfiguration(updates: Partial<NotificationConfig>): void {
        this.config = { ...this.config, ...updates };
        this.saveConfiguration();
        this.emit('configUpdated', this.config);
    }

    // === ENVÍO ===

    public async sendNotification(type: NotificationType, title: string, options: NotificationOptions = {}): Promise<void> {
        if (!this.isNotificationAllowed(type)) {
            debugLog.log('NOTIFICATIONS', `🔇 Notification blocked for type: ${type}`);
            return;
        }

        const notificationData = this.prepareNotificationData(type, title, options);

        if (this.isQuietHours() && type !== 'emergency') {
            debugLog.log('NOTIFICATIONS', '😴 Quiet hours - notification queued');
            this.queueNotification({ type, title, options, timestamp: Date.now() });
            return;
        }

        await this.displayNotification(notificationData);
    }

    private prepareNotificationData(type: NotificationType, title: string, options: any): any {
        const typeConfig = this.config.types[type] || { icon: '🔔', enabled: true, title: 'Notificación' };

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
            requireInteraction: options.requireInteraction || this.config.preferences.require_interaction,
            silent: !this.config.preferences.sound,
            vibrate: this.config.preferences.vibration ? [200, 100, 200] : [],
            tag: `heroes-${type}-${Date.now()}`,
            renotify: true
        };
    }

    private async displayNotification(data: any): Promise<void> {
        try {
            if (this.swRegistration) {
                await this.swRegistration.showNotification(data.title, data);
            } else {
                new Notification(data.title, data);
            }

            this.saveNotificationToHistory(data);
            debugLog.log('NOTIFICATIONS', '🔔 Notification displayed:', data.title);
        } catch (error) {
            debugLog.error('NOTIFICATIONS', '❌ Failed to display notification:', error);
        }
    }

    // === API BACKEND ===

    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            await apiClient.post('/api/notifications/subscribe', {
                subscription,
                config: this.config,
                timestamp: Date.now()
            });
            debugLog.log('NOTIFICATIONS', '📡 Subscription sent to server');
        } catch (error) {
            debugLog.warn('NOTIFICATIONS', 'ℹ️ [NOTIFICATIONS] Failed to send subscription to server (offline?)');
            localStorage.setItem('heroesPatria_pendingSubscription', JSON.stringify(subscription));
        }
    }

    private async removeSubscriptionFromServer(subscriptionId: string): Promise<void> {
        try {
            await apiClient.delete(`/api/notifications/unsubscribe/${subscriptionId}`);
            debugLog.log('NOTIFICATIONS', '📡 Unsubscribe sent to server');
        } catch (error) {
            debugLog.warn('NOTIFICATIONS', 'Server unsubscribe failed');
        }
    }

    private async checkForUpdates(): Promise<void> {
        try {
            // Updated endpoint based on backend routes
            const response = await apiClient.get<any>('/api/notifications');
            if (response.success && response.data && response.data.length > 0) {
                // Process manual notifications logic if implemented in backend 
                // Currently backend mock returns empty list, but this prepares for it
            }
        } catch (error) {
            // Silent fail
        }
    }

    // === UTILS & LOGIC ===

    private isQuietHours(): boolean {
        if (!this.config.schedule.quiet_hours.enabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startH, startM] = this.config.schedule.quiet_hours.start.split(':').map(Number);
        const [endH, endM] = this.config.schedule.quiet_hours.end.split(':').map(Number);

        const start = startH * 60 + startM;
        const end = endH * 60 + endM;

        if (start > end) { // Crosses midnight
            return currentTime >= start || currentTime <= end;
        } else {
            return currentTime >= start && currentTime <= end;
        }
    }

    private isNotificationAllowed(type: NotificationType): boolean {
        if (!this.config.enabled) return false;
        if (!this.config.types[type]?.enabled) return false;

        const day = new Date().getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend && !this.config.schedule.weekend_notifications && type !== 'emergency') return false;

        return true;
    }

    private queueNotification(data: QueuedNotification): void {
        this.notificationQueue.push(data);
        if (this.notificationQueue.length > 50) this.notificationQueue.shift();
        this.saveNotificationQueue();
    }

    private async processQueuedNotifications(): Promise<void> {
        if (this.notificationQueue.length === 0) return;

        const notifications = [...this.notificationQueue];
        this.notificationQueue = [];
        this.saveNotificationQueue();

        for (const note of notifications) {
            await this.sendNotification(note.type, note.title, note.options);
            // delay
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    private setupPeriodicChecks(): void {
        // Check queue every 10 min
        setInterval(() => {
            if (!this.isQuietHours()) {
                this.processQueuedNotifications();
            }
        }, 10 * 60 * 1000);

        // Check updates hourly
        setInterval(() => this.checkForUpdates(), 60 * 60 * 1000);
    }

    private saveNotificationQueue(): void {
        localStorage.setItem('heroesPatria_notificationQueue', JSON.stringify(this.notificationQueue));
    }

    private loadNotificationQueue(): void {
        const saved = localStorage.getItem('heroesPatria_notificationQueue');
        this.notificationQueue = saved ? JSON.parse(saved) : [];
    }

    // === HISTORY ===

    private saveNotificationToHistory(data: any): void {
        const history = this.getNotificationHistory();
        history.unshift({
            id: data.data.id,
            title: data.title,
            body: data.body,
            data: data.data,
            displayed_at: Date.now(),
            read: false
        });

        const trimmed = history.slice(0, 100);
        localStorage.setItem('heroesPatria_notificationHistory', JSON.stringify(trimmed));
    }

    public getNotificationHistory(): NotificationHistoryItem[] {
        const saved = localStorage.getItem('heroesPatria_notificationHistory');
        return saved ? JSON.parse(saved) : [];
    }

    // === HELPERS ===

    private urlBase64ToUint8Array(base64String: string): Uint8Array {
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

    private generateNotificationId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private handleServiceWorkerMessage(event: MessageEvent): void {
        const { data } = event;
        if (data.type === 'notificationClick') {
            debugLog.log('NOTIFICATIONS', '👆 Notification clicked from SW', data);
            // Logic to handle clicks
            if (data.notification.data.url) {
                window.open(data.notification.data.url, '_blank');
            }
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('online', () => this.processQueuedNotifications());
    }

    private emit(eventName: string, data: any): void {
        window.dispatchEvent(new CustomEvent(`notification:${eventName}`, { detail: data }));
    }
}

export const notificationManager = NotificationManager.getInstance();

// Compatibilidad Legacy
if (typeof window !== 'undefined') {
    (window as any).notificationManager = notificationManager;
    (window as any).NotificationManager = NotificationManager;
}
