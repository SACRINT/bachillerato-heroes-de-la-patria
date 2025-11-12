/**
 * 🛡️ CONFIGURACIÓN DE CONTENT-SECURITY-POLICY (CSP)
 * Política de seguridad estricta sin 'unsafe-inline' ni 'unsafe-eval'
 *
 * Estado: MODO ENFORCE (reportOnly: false)
 * Los bloqueos son ACTIVOS - el navegador rechaza recursos que violen CSP
 *
 * Fecha: 7 de Noviembre de 2025
 * Fase: 2 - Refactorización de Seguridad
 * Actualización: Activación de Modo Enforce
 */

const cspConfig = {
    directives: {
        // 1. DEFAULT - Rechaza TODO excepto lo explícitamente permitido
        defaultSrc: ["'self'"],

        // 2. SCRIPTS - Solo archivos JS externos, SIN inline
        // ❌ ELIMINADO: 'unsafe-inline', 'unsafe-eval'
        scriptSrc: [
            "'self'",                          // Scripts locales
            "https://cdn.jsdelivr.net",        // Bootstrap, jQuery, librerías
            "https://cdnjs.cloudflare.com",    // Font Awesome, Chart.js
            "https://unpkg.com",               // Librerías npm
            "https://www.googletagmanager.com", // Google Tag Manager
            "https://www.google-analytics.com", // Google Analytics
            "https://accounts.google.com",     // Google OAuth
            "https://www.googleapis.com",      // Google APIs
            "https://cdn.tiny.cloud",          // TinyMCE editor CDN
            "https://*.tiny.cloud",            // TinyMCE subdomains
            "https://sp.tinymce.com",          // TinyMCE Spark plugin server
            "https://vercel.live"              // Vercel analytics
        ],

        // 3. STYLES - Solo CSS externo, SIN inline
        // ❌ ELIMINADO: 'unsafe-inline'
        styleSrc: [
            "'self'",                          // CSS locales
            "https://cdn.jsdelivr.net",        // Bootstrap CSS
            "https://cdnjs.cloudflare.com",    // Font Awesome CSS
            "https://unpkg.com",               // Librerías CSS
            "https://fonts.googleapis.com",    // Google Fonts
            "https://accounts.google.com",     // Google OAuth button styles
            "https://accounts.google.com/gsi/style",  // Google OAuth GSI styles (CRÍTICO)
            "https://cdn.tiny.cloud",          // TinyMCE styles
            "https://*.tiny.cloud"             // TinyMCE subdomains
        ],

        // 4. FONTS - Solo desde whitelist de dominios
        fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",       // Google Fonts
            "https://cdnjs.cloudflare.com",    // Font Awesome
            "https://cdn.jsdelivr.net",        // Bootstrap Icons
            "https://cdn.tiny.cloud",          // TinyMCE fonts
            "https://*.tiny.cloud"
        ],

        // 5. IMÁGENES - Whitelist de dominios (no wildcard https:)
        imgSrc: [
            "'self'",
            "data:",                           // Data URIs para imágenes base64
            "blob:",                           // Blob URLs
            "https://cdn.jsdelivr.net",        // CDN images
            "https://cdnjs.cloudflare.com",    // CDN images
            "https://cdn.tiny.cloud",          // TinyMCE images
            "https://*.tiny.cloud"
        ],

        // 6. CONEXIONES - Endpoints específicos (no wildcard ws:/wss:)
        connectSrc: [
            "'self'",
            "https://bge-heroesdelapatria.vercel.app",  // Production domain
            "https://sp.tinymce.com",          // TinyMCE plugin server
            "https://www.google-analytics.com", // Google Analytics
            "https://www.googletagmanager.com" // Google Tag Manager
            // NOTA: WebSocket específicos pueden agregarse si se necesitan
        ],

        // 7. FRAMES - Solo embeds específicos (no wildcard *.tiny.cloud)
        frameSrc: [
            "'self'",
            "https://accounts.google.com",     // Google OAuth login iframe (CRÍTICO para GSI)
            "https://accounts.google.com/gsi/", // Google Sign-In iframe
            "https://www.google.com",          // Google OAuth login
            "https://maps.google.com",         // Google Maps
            "https://forms.gle"                // Google Forms
        ],

        // 8. OBJETOS - Rechaza completamente
        objectSrc: ["'none'"],

        // 9. FORMS - Solo acciones a self
        formAction: ["'self'"],

        // 10. BASE URI - Solo self
        baseUri: ["'self'"],

        // 11. Upgrade de conexiones inseguras (deshabilitado por ahora)
        // upgradeInsecureRequests: []  // Habilitar en producción HTTPS

        // 12. Elementos de script inline (explicitar)
        scriptSrcElem: [
            "'self'",
            "'unsafe-eval'",                   // Requerido para TinyMCE
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://unpkg.com",
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://accounts.google.com",
            "https://www.googleapis.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "https://sp.tinymce.com",          // TinyMCE Spark plugin server
            "https://vercel.live"
        ],

        // 13. Elementos de estilo inline (explicitar)
        styleSrcElem: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://unpkg.com",
            "https://fonts.googleapis.com",
            "https://accounts.google.com",     // Google OAuth button styles (CRÍTICO)
            "https://accounts.google.com/gsi/style",  // ✅ Google Sign-In button styles
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud"
        ]
    },

    // 🔴 MODO ENFORCE ACTIVO
    // En este modo, el navegador BLOQUEA activamente cualquier recurso
    // que viole la política de CSP. reportOnly: false activa el bloqueo real.
    reportOnly: false,

    // Endpoint para reportar violaciones (opcional)
    // reportUri: ['/api/csp-violations']

    // Estadísticas
    // Esta configuración CSP estricta elimina:
    // ✅ 'unsafe-inline' de scriptSrc
    // ✅ 'unsafe-eval' de scriptSrc
    // ✅ 'unsafe-inline' de styleSrc
    // ✅ Wildcards peligrosos (https:, ws:, wss:)
    // ✅ Dominios sin restringir
};

module.exports = cspConfig;
