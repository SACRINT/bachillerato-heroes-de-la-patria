/**
 * 🔔 PUSH NOTIFICATION CLIENT
 * Cliente para recibir notificaciones push del navegador
 * Creado: 19 Enero 2026
 */

class PushNotificationClient {
    constructor(options = {}) {
        this.apiBaseURL = options.apiBaseURL || '/api/push';
        this.vapidPublicKey = null;
        this.registration = null;
        this.subscription = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

        // Callbacks
        this.onPermissionGranted = options.onPermissionGranted || (() => { });
        this.onPermissionDenied = options.onPermissionDenied || (() => { });
        this.onSubscribed = options.onSubscribed || (() => { });
        this.onError = options.onError || (() => { });
    }

    /**
     * Initialize push notifications
     */
    async initialize() {
        if (!this.isSupported) {
            console.warn('[Push] Push notifications not supported in this browser');
            return false;
        }

        try {
            // Get VAPID public key
            await this.fetchVapidKey();

            // Register service worker
            this.registration = await navigator.serviceWorker.register('/sw-push.js');
            console.log('[Push] Service Worker registered');

            // Check existing subscription
            this.subscription = await this.registration.pushManager.getSubscription();

            if (this.subscription) {
                console.log('[Push] Already subscribed');
                return true;
            }

            return true;
        } catch (error) {
            console.error('[Push] Initialization error:', error);
            this.onError(error);
            return false;
        }
    }

    /**
     * Fetch VAPID public key from server
     */
    async fetchVapidKey() {
        try {
            const response = await fetch(`${this.apiBaseURL}/vapid-key`);
            const data = await response.json();

            if (data.success) {
                this.vapidPublicKey = data.publicKey;
            }
        } catch (error) {
            console.error('[Push] Error fetching VAPID key:', error);
            throw error;
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!this.isSupported) return 'not-supported';

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('[Push] Permission granted');
            this.onPermissionGranted();
            return 'granted';
        } else {
            console.log('[Push] Permission denied');
            this.onPermissionDenied();
            return permission;
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe() {
        if (!this.registration) {
            await this.initialize();
        }

        if (!this.registration) {
            throw new Error('Service Worker not registered');
        }

        const permission = await this.requestPermission();
        if (permission !== 'granted') {
            return null;
        }

        try {
            // Convert VAPID key to Uint8Array
            const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

            // Subscribe to push
            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            console.log('[Push] Subscribed:', this.subscription.endpoint);

            // Send subscription to server
            await this.sendSubscriptionToServer(this.subscription);

            this.onSubscribed(this.subscription);
            return this.subscription;

        } catch (error) {
            console.error('[Push] Subscription error:', error);
            this.onError(error);
            throw error;
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
        if (!this.subscription) {
            return true;
        }

        try {
            await this.subscription.unsubscribe();

            // Notify server
            await fetch(`${this.apiBaseURL}/unsubscribe`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ endpoint: this.subscription.endpoint })
            });

            this.subscription = null;
            console.log('[Push] Unsubscribed');
            return true;

        } catch (error) {
            console.error('[Push] Unsubscribe error:', error);
            throw error;
        }
    }

    /**
     * Send subscription to server
     */
    async sendSubscriptionToServer(subscription) {
        const response = await fetch(`${this.apiBaseURL}/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                device_name: this.getDeviceName(),
                device_type: this.getDeviceType()
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Error registering subscription');
        }

        return data;
    }

    /**
     * Check if subscribed
     */
    async isSubscribed() {
        if (!this.registration) return false;

        const subscription = await this.registration.pushManager.getSubscription();
        return subscription !== null;
    }

    /**
     * Get permission status
     */
    getPermissionStatus() {
        if (!this.isSupported) return 'not-supported';
        return Notification.permission;
    }

    // === UTILITY METHODS ===

    /**
     * Convert VAPID key to Uint8Array
     */
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

    /**
     * Get device name
     */
    getDeviceName() {
        const ua = navigator.userAgent;
        if (/iPhone/.test(ua)) return 'iPhone';
        if (/iPad/.test(ua)) return 'iPad';
        if (/Android/.test(ua)) return 'Android Device';
        if (/Windows/.test(ua)) return 'Windows PC';
        if (/Mac/.test(ua)) return 'Mac';
        if (/Linux/.test(ua)) return 'Linux PC';
        return 'Unknown Device';
    }

    /**
     * Get device type
     */
    getDeviceType() {
        if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    /**
     * Get auth token
     */
    getAuthToken() {
        return localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken');
    }
}

// Global instance
window.PushNotificationClient = PushNotificationClient;

// UI Helper for Push Notification Toggle
class PushNotificationToggle {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.client = new PushNotificationClient();

        if (this.container) {
            this.render();
        }
    }

    async render() {
        const isSupported = this.client.isSupported;
        const permission = this.client.getPermissionStatus();

        let isSubscribed = false;
        if (isSupported && permission === 'granted') {
            await this.client.initialize();
            isSubscribed = await this.client.isSubscribed();
        }

        this.container.innerHTML = `
            <div class="push-notification-toggle card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">
                                <i class="bi bi-bell me-2"></i>
                                Notificaciones Push
                            </h6>
                            <small class="text-muted">
                                ${!isSupported ? 'No soportado en este navegador' :
                permission === 'denied' ? 'Permisos denegados' :
                    isSubscribed ? 'Activas' : 'Desactivadas'}
                            </small>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" 
                                   id="pushToggle" 
                                   ${!isSupported || permission === 'denied' ? 'disabled' : ''}
                                   ${isSubscribed ? 'checked' : ''}>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event listener
        const toggle = document.getElementById('pushToggle');
        if (toggle) {
            toggle.addEventListener('change', async (e) => {
                if (e.target.checked) {
                    await this.enablePush();
                } else {
                    await this.disablePush();
                }
            });
        }
    }

    async enablePush() {
        try {
            await this.client.initialize();
            await this.client.subscribe();
            this.showToast('Notificaciones activadas', 'success');
            this.render();
        } catch (error) {
            console.error('[Push] Enable error:', error);
            this.showToast('Error al activar notificaciones', 'danger');
            this.render();
        }
    }

    async disablePush() {
        try {
            await this.client.unsubscribe();
            this.showToast('Notificaciones desactivadas', 'info');
            this.render();
        } catch (error) {
            console.error('[Push] Disable error:', error);
            this.showToast('Error al desactivar notificaciones', 'danger');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

window.PushNotificationToggle = PushNotificationToggle;
