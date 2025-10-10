/**
 * CONFIGURACIÓN DE APIs Y SERVICIOS EXTERNOS
 * Bachillerato General Estatal "Héroes de la Patria"
 * 
 * INSTRUCCIONES:
 * 1. Copia este archivo como 'config-local.js' para desarrollo
 * 2. Nunca subas las API keys reales a GitHub
 * 3. Configura las variables de producción en tu servidor
 */

window.AppConfig = {
    // Configuración del entorno
    environment: 'development', // 'development' | 'production'
    debug: true,

    // URLs del backend
    api: {
        baseURL: 'http://localhost:3000', // Cambia por tu URL de producción
        timeout: 10000,
        retries: 3
    },

    // Google OAuth 2.0 Configuration
    google: {
        // 🔑 Client ID para Google Sign-In
        // Para obtenerlo:
        // 1. Ve a https://console.cloud.google.com/apis/credentials
        // 2. Crea "ID de cliente de OAuth 2.0"
        // 3. Configura los orígenes autorizados:
        //    - http://localhost:3000
        //    - http://127.0.0.1:8080
        //    - https://tu-dominio-produccion.com
        clientId: null, // Ejemplo: '123456-abc.apps.googleusercontent.com'

        apiKey: null,   // 'TU_GOOGLE_API_KEY' (opcional para otras APIs)
        enabled: false, // Cambiar a true cuando configures el clientId

        // Configuración avanzada de OAuth
        oauth: {
            scope: 'email profile',
            cookiePolicy: 'single_host_origin',
            fetchBasicProfile: true,
            uxMode: 'popup', // 'popup' o 'redirect'
            redirectUri: window.location.origin
        }
    },

    // Facebook Pixel
    facebook: {
        pixelId: null,  // 'TU_FACEBOOK_PIXEL_ID'
        enabled: false  // Cambiar a true cuando configures el pixel
    },

    // Stripe (Pagos)
    stripe: {
        publishableKey: null, // 'pk_test_TU_STRIPE_KEY'
        enabled: false        // Cambiar a true cuando configures Stripe
    },

    // PayPal
    paypal: {
        clientId: null, // 'TU_PAYPAL_CLIENT_ID'
        enabled: false  // Cambiar a true cuando configures PayPal
    },

    // Notificaciones Push
    notifications: {
        vapidKey: null, // 'TU_VAPID_PUBLIC_KEY'
        enabled: true   // Las notificaciones locales están habilitadas
    },

    // Analytics personalizados
    analytics: {
        enabled: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutos
        trackingEnabled: true
    },

    // Funcionalidades de la PWA
    pwa: {
        enableQRScanner: true,
        enableGeolocation: true,
        enablePushNotifications: true,
        enableShake: true,
        enableWebShare: true
    },

    // Configuración del chatbot
    chatbot: {
        apiEndpoint: '/api/chatbot/message',
        fallbackMode: true, // Usar respuestas predefinidas si la API no está disponible
        maxMessages: 50,
        sessionTimeout: 60 * 60 * 1000 // 1 hora
    },

    // Configuración de caché
    cache: {
        version: '3.0.0',
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        maxItems: 1000
    }
};

// Función para verificar si una integración está configurada
window.AppConfig.isEnabled = function(service) {
    switch (service) {
        case 'google':
            // Para Google OAuth, solo necesitamos el clientId
            return this.google.enabled &&
                   this.google.clientId &&
                   this.google.clientId.includes('.apps.googleusercontent.com');
        case 'facebook':
            return this.facebook.enabled && this.facebook.pixelId;
        case 'stripe':
            return this.stripe.enabled && this.stripe.publishableKey;
        case 'paypal':
            return this.paypal.enabled && this.paypal.clientId;
        case 'notifications':
            return this.notifications.enabled;
        case 'analytics':
            return this.analytics.enabled;
        default:
            return false;
    }
};

// Función para obtener el Client ID de Google
window.AppConfig.getGoogleClientId = function() {
    if (!this.isEnabled('google')) {
        console.warn(`
⚠️ ============================================
   GOOGLE OAUTH NO CONFIGURADO
   ============================================

   Para habilitar Google Sign-In:

   1. Ve a https://console.cloud.google.com/apis/credentials
   2. Crea "ID de cliente de OAuth 2.0"
   3. Configura los orígenes autorizados
   4. Pega el Client ID en js/config.js:

      window.AppConfig.google.clientId = 'TU_CLIENT_ID';
      window.AppConfig.google.enabled = true;

   Mientras tanto, el sistema usará modo DEMO.
   ============================================
        `);
        return null;
    }
    return this.google.clientId;
};

// Función para obtener la configuración de un servicio
window.AppConfig.getServiceConfig = function(service) {
    return this[service] || {};
};

// Logging para debug
if (window.AppConfig.debug) {
    console.log('🔧 App Config loaded:', {
        environment: window.AppConfig.environment,
        enabledServices: {
            google: window.AppConfig.isEnabled('google'),
            facebook: window.AppConfig.isEnabled('facebook'),
            stripe: window.AppConfig.isEnabled('stripe'),
            paypal: window.AppConfig.isEnabled('paypal'),
            notifications: window.AppConfig.isEnabled('notifications'),
            analytics: window.AppConfig.isEnabled('analytics')
        }
    });
}

/**
 * EJEMPLO DE CONFIGURACIÓN PARA PRODUCCIÓN:
 * 
 * window.AppConfig.google.clientId = '123456789-abcdef.googleusercontent.com';
 * window.AppConfig.google.apiKey = 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q';
 * window.AppConfig.google.enabled = true;
 * 
 * window.AppConfig.facebook.pixelId = '123456789012345';
 * window.AppConfig.facebook.enabled = true;
 * 
 * window.AppConfig.stripe.publishableKey = 'pk_live_1234567890abcdef';
 * window.AppConfig.stripe.enabled = true;
 */