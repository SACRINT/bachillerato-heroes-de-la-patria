/**
 * 🔔 PWA NOTIFICATIONS SYSTEM - FASE 3
 * Sistema completo de notificaciones push para PWA
 */

class PWANotificationManager {
    constructor() {
        this.pushSubscription = null;
        this.isSupported = this.checkSupport();
        this.permission = Notification.permission;
        this.vapidPublicKey = this.getVapidKey();
        this.settings = this.loadSettings();
        
        this.notificationQueue = [];
        this.analytics = {
            sent: 0,
            clicked: 0,
            dismissed: 0,
            subscriptions: 0
        };
        
        this.init();
    }

    init() {
        //console.log('🔔 Inicializando PWA Notification Manager...');
        
        if (!this.isSupported) {
            console.warn('Push notifications no soportadas');
            return;
        }
        
        this.setupEventListeners();
        this.checkExistingSubscription();
        this.setupNotificationStyles();
        this.loadAnalytics();
        
        //console.log('✅ PWA Notification Manager inicializado');
    }

    checkSupport() {
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window &&
               'showNotification' in ServiceWorkerRegistration.prototype;
    }

    getVapidKey() {
        // En producción, esto debería venir del servidor
        return 'BEl62iUYgUivxIkv69yViEuiBIa40HI80YmqRcWG6SLRBSXFYs4_QmALbOINmVMNcPg5FD5C3Bb-F6XcWq8pK8Y';
    }

    loadSettings() {
        const defaultSettings = {
            enabled: true,
            types: {
                updates: true,
                announcements: true,
                reminders: true,
                emergencies: true
            },
            timing: {
                quiet_hours: { start: 22, end: 7 },
                enabled: false
            },
            frequency: 'normal' // low, normal, high
        };

        try {
            const stored = localStorage.getItem('pwa-notification-settings');
            return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('pwa-notification-settings', JSON.stringify(this.settings));
    }

    async checkExistingSubscription() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            this.pushSubscription = await registration.pushManager.getSubscription();
            
            if (this.pushSubscription) {
                //console.log('✅ Push subscription activa');
                await this.syncSubscriptionWithServer();
            }
        }
    }

    setupEventListeners() {
        // Listen for SW messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'NOTIFICATION_CLICKED') {
                    this.handleNotificationClick(event.data);
                }
            });
        }

        // Listen for visibility change to handle notifications
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.clearQueuedNotifications();
            }
        });
    }

    setupNotificationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pwa-notification-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 10000;
                transform: translateY(-100%);
                transition: transform 0.3s ease;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .pwa-notification-banner.show {
                transform: translateY(0);
            }
            
            .pwa-notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .pwa-notification-text {
                flex: 1;
                margin-right: 15px;
            }
            
            .pwa-notification-actions {
                display: flex;
                gap: 10px;
            }
            
            .pwa-notification-btn {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s ease;
            }
            
            .pwa-notification-btn:hover {
                background: rgba(255,255,255,0.3);
            }
            
            .pwa-notification-btn.primary {
                background: rgba(255,255,255,0.9);
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }

    // === SUBSCRIPTION MANAGEMENT ===
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Notifications not supported');
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            this.showPermissionDeniedMessage();
            return false;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        this.permission = permission;

        if (permission === 'granted') {
            await this.subscribe();
            return true;
        } else {
            this.showPermissionDeniedMessage();
            return false;
        }
    }

    async subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });

            this.pushSubscription = subscription;
            //console.log('✅ Push subscription creada');

            await this.sendSubscriptionToServer(subscription);
            this.analytics.subscriptions++;
            this.saveAnalytics();

            this.showSubscriptionSuccessMessage();
            return subscription;

        } catch (error) {
            console.error('Error en subscription:', error);
            throw error;
        }
    }

    async unsubscribe() {
        if (!this.pushSubscription) return;

        try {
            await this.pushSubscription.unsubscribe();
            await this.removeSubscriptionFromServer();
            
            this.pushSubscription = null;
            //console.log('✅ Push subscription eliminada');
            
            this.showUnsubscriptionMessage();
        } catch (error) {
            console.error('Error unsubscribing:', error);
        }
    }

    // === SERVER COMMUNICATION ===
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription,
                    settings: this.settings,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error('Server subscription failed');
            }

            //console.log('✅ Subscription enviada al servidor');
        } catch (error) {
            console.warn('Error enviando subscription al servidor:', error);
            // Store locally for retry
            this.storeSubscriptionLocally(subscription);
        }
    }

    async removeSubscriptionFromServer() {
        try {
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: this.pushSubscription.endpoint
                })
            });
        } catch (error) {
            console.warn('Error removing subscription from server:', error);
        }
    }

    async syncSubscriptionWithServer() {
        // Verify subscription is still valid on server
        try {
            const response = await fetch('/api/notifications/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: this.pushSubscription.endpoint
                })
            });

            if (!response.ok) {
                // Re-subscribe if not found on server
                await this.sendSubscriptionToServer(this.pushSubscription);
            }
        } catch (error) {
            console.warn('Error verifying subscription:', error);
        }
    }

    // === LOCAL NOTIFICATIONS ===
    async showLocalNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('No permission for notifications');
            return;
        }

        if (!this.shouldShowNotification(options.type)) {
            //console.log('Notification filtered by settings');
            return;
        }

        const defaultOptions = {
            body: '',
            icon: './images/app_icons/icon-192x192.webp',
            badge: './images/app_icons/icon-192x192.webp',
            data: { timestamp: Date.now() },
            tag: 'heroes-patria',
            renotify: true,
            requireInteraction: false,
            actions: []
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, finalOptions);
            } else {
                // Fallback to regular notification
                new Notification(title, finalOptions);
            }

            this.analytics.sent++;
            this.saveAnalytics();
            
            //console.log('🔔 Notification shown:', title);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // === NOTIFICATION TYPES ===
    async showUpdateNotification(version) {
        await this.showLocalNotification(
            'Nueva versión disponible',
            {
                body: `La versión ${version} está lista. ¡Toca para actualizar!`,
                type: 'updates',
                data: { action: 'update', version },
                actions: [
                    { action: 'update', title: 'Actualizar', icon: './images/icons/update.png' },
                    { action: 'dismiss', title: 'Más tarde', icon: './images/icons/dismiss.png' }
                ],
                requireInteraction: true
            }
        );
    }

    async showAnnouncementNotification(message, url = null) {
        await this.showLocalNotification(
            'Héroes de la Patria',
            {
                body: message,
                type: 'announcements',
                data: { action: 'open', url: url || './' },
                actions: url ? [
                    { action: 'open', title: 'Ver más', icon: './images/icons/open.png' }
                ] : []
            }
        );
    }

    async showReminderNotification(message, actionUrl = null) {
        await this.showLocalNotification(
            'Recordatorio',
            {
                body: message,
                type: 'reminders',
                data: { action: 'reminder', url: actionUrl },
                actions: actionUrl ? [
                    { action: 'open', title: 'Ir', icon: './images/icons/calendar.png' }
                ] : []
            }
        );
    }

    async showEmergencyNotification(message) {
        await this.showLocalNotification(
            '⚠️ Aviso Importante',
            {
                body: message,
                type: 'emergencies',
                requireInteraction: true,
                silent: false,
                actions: [
                    { action: 'acknowledge', title: 'Entendido', icon: './images/icons/check.png' }
                ]
            }
        );
    }

    // === SMART NOTIFICATIONS ===
    async scheduleNotification(title, options, delay) {
        setTimeout(() => {
            this.showLocalNotification(title, options);
        }, delay);
    }

    async showInstallPrompt() {
        this.showInAppBanner(
            '📱 Instalar como App',
            'Instala Héroes de la Patria en tu dispositivo para un acceso más rápido',
            [
                { text: 'Instalar', action: 'install', primary: true },
                { text: 'Más tarde', action: 'dismiss' }
            ]
        );
    }

    async showNotificationPermissionPrompt() {
        this.showInAppBanner(
            '🔔 Mantente informado',
            'Activa las notificaciones para recibir avisos importantes del bachillerato',
            [
                { text: 'Activar', action: 'request-permission', primary: true },
                { text: 'No ahora', action: 'dismiss' }
            ]
        );
    }

    // === IN-APP BANNERS ===
    showInAppBanner(title, message, actions) {
        const banner = document.createElement('div');
        banner.className = 'pwa-notification-banner';
        banner.innerHTML = `
            <div class="pwa-notification-content">
                <div class="pwa-notification-text">
                    <strong>${title}</strong><br>
                    <small>${message}</small>
                </div>
                <div class="pwa-notification-actions">
                    ${actions.map(action => 
                        `<button class="pwa-notification-btn ${action.primary ? 'primary' : ''}" 
                                 data-action="${action.action}">${action.text}</button>`
                    ).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        banner.querySelectorAll('.pwa-notification-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleBannerAction(action, banner);
            });
        });

        document.body.appendChild(banner);
        
        // Show banner
        setTimeout(() => banner.classList.add('show'), 100);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                this.hideBanner(banner);
            }
        }, 10000);
    }

    hideBanner(banner) {
        banner.classList.remove('show');
        setTimeout(() => {
            if (banner.parentNode) {
                banner.remove();
            }
        }, 300);
    }

    async handleBannerAction(action, banner) {
        this.hideBanner(banner);

        switch (action) {
            case 'install':
                if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    const result = await window.deferredPrompt.userChoice;
                    //console.log('Install prompt result:', result);
                }
                break;
            case 'request-permission':
                await this.requestPermission();
                break;
            case 'dismiss':
                // Just dismiss
                break;
        }
    }

    // === SETTINGS AND PREFERENCES ===
    shouldShowNotification(type) {
        if (!this.settings.enabled) return false;
        if (type && !this.settings.types[type]) return false;
        
        // Check quiet hours
        if (this.settings.timing.enabled) {
            const now = new Date();
            const hour = now.getHours();
            const { start, end } = this.settings.timing.quiet_hours;
            
            if (start > end) {
                // Overnight quiet hours (e.g., 22:00 to 07:00)
                if (hour >= start || hour < end) return false;
            } else {
                // Same day quiet hours
                if (hour >= start && hour < end) return false;
            }
        }

        return true;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        //console.log('🔧 Notification settings updated');
    }

    // === ANALYTICS ===
    loadAnalytics() {
        try {
            const stored = localStorage.getItem('pwa-notification-analytics');
            if (stored) {
                this.analytics = { ...this.analytics, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('Error loading analytics:', error);
        }
    }

    saveAnalytics() {
        localStorage.setItem('pwa-notification-analytics', JSON.stringify(this.analytics));
    }

    getAnalytics() {
        return {
            ...this.analytics,
            clickRate: this.analytics.sent > 0 ? (this.analytics.clicked / this.analytics.sent) * 100 : 0,
            isSubscribed: !!this.pushSubscription,
            permission: this.permission,
            lastUpdate: Date.now()
        };
    }

    // === EVENT HANDLERS ===
    handleNotificationClick(data) {
        this.analytics.clicked++;
        this.saveAnalytics();
        
        //console.log('🔔 Notification clicked:', data);
        
        if (data.url && data.url !== './') {
            window.location.href = data.url;
        }
    }

    clearQueuedNotifications() {
        this.notificationQueue = [];
    }

    // === UTILITY FUNCTIONS ===
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    storeSubscriptionLocally(subscription) {
        localStorage.setItem('pwa-push-subscription-pending', JSON.stringify(subscription));
    }

    // === MESSAGES ===
    showPermissionDeniedMessage() {
        this.showInAppBanner(
            'Notificaciones bloqueadas',
            'Para recibir avisos importantes, puedes activar las notificaciones en la configuración del navegador',
            [{ text: 'Entendido', action: 'dismiss' }]
        );
    }

    showSubscriptionSuccessMessage() {
        this.showInAppBanner(
            '✅ ¡Notificaciones activadas!',
            'Ahora recibirás avisos importantes del bachillerato',
            [{ text: 'Perfecto', action: 'dismiss' }]
        );
    }

    showUnsubscriptionMessage() {
        this.showInAppBanner(
            'Notificaciones desactivadas',
            'Ya no recibirás notificaciones push. Puedes reactivarlas en cualquier momento',
            [{ text: 'Entendido', action: 'dismiss' }]
        );
    }

    // === PUBLIC API ===
    isSubscribed() {
        return !!this.pushSubscription && this.permission === 'granted';
    }

    getSettings() {
        return { ...this.settings };
    }

    async testNotification() {
        await this.showLocalNotification(
            'Notificación de prueba',
            {
                body: 'Si ves esto, las notificaciones funcionan correctamente',
                type: 'test',
                actions: [
                    { action: 'test-ok', title: '✓ Funciona', icon: './images/icons/check.png' }
                ]
            }
        );
    }
}

// Initialize notification manager
let pwaNotificationManager;

document.addEventListener('DOMContentLoaded', () => {
    pwaNotificationManager = new PWANotificationManager();
    
    // Make globally accessible
    window.pwaNotifications = pwaNotificationManager;
    
    // Auto-prompt for notifications if not decided yet
    if (Notification.permission === 'default') {
        // Show prompt after user interaction
        setTimeout(() => {
            if (Notification.permission === 'default') {
                pwaNotificationManager.showNotificationPermissionPrompt();
            }
        }, 30000); // 30 seconds after load
    }
});

// Handle beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Show install prompt after delay
    setTimeout(() => {
        if (pwaNotificationManager) {
            pwaNotificationManager.showInstallPrompt();
        }
    }, 60000); // 1 minute after page load
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWANotificationManager;
}