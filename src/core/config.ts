/**
 * @fileoverview Configuration for APIs and external services.
 * Migrated from public/js/config.js
 */

export interface ServiceConfig {
    enabled: boolean;
    [key: string]: any;
}

export interface GoogleConfig extends ServiceConfig {
    clientId: string | null;
    apiKey: string | null;
    oauth: {
        scope: string;
        cookiePolicy: string;
        fetchBasicProfile: boolean;
        uxMode: 'popup' | 'redirect';
        redirectUri: string;
    }
}

export interface AppConfig {
    environment: 'production' | 'development';
    debug: boolean;
    api: {
        baseURL: string;
        timeout: number;
        retries: number;
    };
    google: GoogleConfig;
    facebook: {
        pixelId: string | null;
        enabled: boolean;
    };
    stripe: {
        publishableKey: string | null;
        enabled: boolean;
    };
    paypal: {
        clientId: string | null;
        enabled: boolean;
    };
    notifications: {
        vapidKey: string | null;
        enabled: boolean;
    };
    analytics: {
        enabled: boolean;
        sessionTimeout: number;
        trackingEnabled: boolean;
    };
    pwa: {
        enableQRScanner: boolean;
        enableGeolocation: boolean;
        enablePushNotifications: boolean;
        enableShake: boolean;
        enableWebShare: boolean;
    };
    chatbot: {
        apiEndpoint: string;
        fallbackMode: boolean;
        maxMessages: number;
        sessionTimeout: number;
    };
    cache: {
        version: string;
        maxAge: number;
        maxItems: number;
    };
    // Utility methods
    isEnabled: (service: string) => boolean;
    getGoogleClientId: () => string | null;
    getServiceConfig: (service: string) => any;
}

const isProduction = window.location.hostname.includes('vercel.app');

export const appConfig: AppConfig = {
    environment: isProduction ? 'production' : 'development',
    debug: !isProduction,

    api: {
        baseURL: isProduction
            ? `${window.location.protocol}//${window.location.host}`
            : '',
        timeout: 10000,
        retries: 3
    },

    google: {
        clientId: null,
        apiKey: null,
        enabled: false,
        oauth: {
            scope: 'email profile',
            cookiePolicy: 'single_host_origin',
            fetchBasicProfile: true,
            uxMode: 'popup',
            redirectUri: window.location.origin
        }
    },

    facebook: {
        pixelId: null,
        enabled: false
    },

    stripe: {
        publishableKey: null,
        enabled: false
    },

    paypal: {
        clientId: null,
        enabled: false
    },

    notifications: {
        vapidKey: null,
        enabled: true
    },

    analytics: {
        enabled: true,
        sessionTimeout: 30 * 60 * 1000,
        trackingEnabled: true
    },

    pwa: {
        enableQRScanner: true,
        enableGeolocation: true,
        enablePushNotifications: true,
        enableShake: true,
        enableWebShare: true
    },

    chatbot: {
        apiEndpoint: '/api/chatbot/message',
        fallbackMode: true,
        maxMessages: 50,
        sessionTimeout: 60 * 60 * 1000
    },

    cache: {
        version: '3.0.0',
        maxAge: 24 * 60 * 60 * 1000,
        maxItems: 1000
    },

    isEnabled(service: string): boolean {
        switch (service) {
            case 'google':
                return this.google.enabled &&
                    !!this.google.clientId &&
                    this.google.clientId.includes('.apps.googleusercontent.com');
            case 'facebook':
                return this.facebook.enabled && !!this.facebook.pixelId;
            case 'stripe':
                return this.stripe.enabled && !!this.stripe.publishableKey;
            case 'paypal':
                return this.paypal.enabled && !!this.paypal.clientId;
            case 'notifications':
                return this.notifications.enabled;
            case 'analytics':
                return this.analytics.enabled;
            default:
                return false;
        }
    },

    getGoogleClientId(): string | null {
        if (!this.isEnabled('google')) {
            console.warn('Google OAuth not configured in config.ts');
            return null;
        }
        return this.google.clientId;
    },

    getServiceConfig(service: string): any {
        return (this as any)[service] || {};
    }
};

// Dynamic configuration loader
export async function loadRemoteConfig(): Promise<void> {
    try {
        const response = await fetch(`${appConfig.api.baseURL}/api/config/public-keys`);
        if (!response.ok) {
            throw new Error(`Error loading remote config: ${response.statusText}`);
        }
        const config = await response.json();

        if (config.success && config.keys) {
            if (config.keys.google_oauth_client_id) {
                appConfig.google.clientId = config.keys.google_oauth_client_id;
                appConfig.google.enabled = true;
                console.log('✅ Google OAuth configured dynamically');
            } else {
                console.warn('⚠️ No Google Client ID received from backend');
            }

            if (config.keys.tinymce) {
                // Assuming we might eventually move tinymce to appConfig, but keeping global for compatibility
                (window as any).TINYMCE_API_KEY = config.keys.tinymce;
                console.log('✅ TinyMCE API Key configured dynamically');
            } else {
                console.warn('⚠️ No TinyMCE API Key received');
                (window as any).TINYMCE_API_KEY = 'no-key-configured';
            }
        }
    } catch (error) {
        console.error('❌ Error loading remote config:', error);
        appConfig.google.enabled = false;
        (window as any).TINYMCE_API_KEY = 'no-key-configured';
    }
}
