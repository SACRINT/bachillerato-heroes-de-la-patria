/**
 * 🔒 CSP STRICT MODE - Content Security Policy
 *
 * Implementación de CSP restrictivo para prevenir XSS, clickjacking y code injection
 * SIN unsafe-inline, SIN unsafe-eval
 *
 * Versión: 2.0.0
 * Fecha: 17 Noviembre 2025
 * OWASP: A03:2021 - Injection Prevention
 */

/**
 * CSP Headers por ambiente
 */
const CSP_POLICIES = {
    /**
     * DESARROLLO - Más permisivo para debugging
     */
    development: {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            "'unsafe-eval'", // Solo en dev para hot reload
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "https://accounts.google.com",
            "https://www.gstatic.com",
            "https://vercel.live"
        ],
        'script-src-elem': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "https://accounts.google.com",
            "https://www.gstatic.com",
            "https://vercel.live"
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'", // Bootstrap inline styles
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.googleapis.com"
        ],
        'style-src-elem': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.googleapis.com"
        ],
        'font-src': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.gstatic.com",
            "data:"
        ],
        'img-src': [
            "'self'",
            "data:",
            "blob:",
            "https:",
            "http://localhost:*"
        ],
        'connect-src': [
            "'self'",
            "https://accounts.google.com",
            "https://*.googleapis.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "http://localhost:*",
            "ws://localhost:*",
            "wss://*"
        ],
        'frame-src': [
            "'self'",
            "https://accounts.google.com",
            "https://www.google.com"
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'upgrade-insecure-requests': []
    },

    /**
     * PRODUCCIÓN - STRICT MODE
     * SIN unsafe-inline, SIN unsafe-eval
     */
    production: {
        'default-src': ["'self'"],
        'script-src': [
            "'self'",
            // CDNs confiables
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "https://accounts.google.com",
            "https://www.gstatic.com",
            // Nonce se agregará dinámicamente
            "'nonce-{{nonce}}'"
        ],
        'script-src-elem': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud",
            "https://accounts.google.com",
            "https://www.gstatic.com"
        ],
        'style-src': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.googleapis.com",
            // SHA256 de estilos inline críticos
            "'sha256-HASH_PLACEHOLDER'"
        ],
        'style-src-elem': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.googleapis.com"
        ],
        'font-src': [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://fonts.gstatic.com",
            "data:"
        ],
        'img-src': [
            "'self'",
            "data:",
            "blob:",
            "https:"
        ],
        'connect-src': [
            "'self'",
            "https://accounts.google.com",
            "https://*.googleapis.com",
            "https://cdn.tiny.cloud",
            "https://*.tiny.cloud"
        ],
        'frame-src': [
            "'self'",
            "https://accounts.google.com",
            "https://www.google.com"
        ],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'self'"],
        'upgrade-insecure-requests': [],
        'block-all-mixed-content': [],
        'require-trusted-types-for': ["'script'"]
    }
};

/**
 * Generar CSP header string
 */
function generateCSPHeader(policy) {
    return Object.entries(policy)
        .map(([directive, values]) => {
            if (values.length === 0) {
                return directive;
            }
            return `${directive} ${values.join(' ')}`;
        })
        .join('; ');
}

/**
 * Generar nonce criptográficamente seguro
 */
function generateNonce() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
}

/**
 * Middleware CSP principal
 */
function cspMiddleware(options = {}) {
    const env = process.env.NODE_ENV || 'development';
    const strictMode = options.strict !== false; // Strict por defecto en producción

    return (req, res, next) => {
        // Generar nonce para scripts inline
        const nonce = generateNonce();
        res.locals.cspNonce = nonce;

        // Seleccionar política según ambiente
        let policy = env === 'production' && strictMode
            ? CSP_POLICIES.production
            : CSP_POLICIES.development;

        // Reemplazar placeholder de nonce
        let cspHeader = generateCSPHeader(policy);
        cspHeader = cspHeader.replace('{{nonce}}', nonce);

        // Headers de seguridad adicionales
        res.setHeader('Content-Security-Policy', cspHeader);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // HSTS (solo en producción con HTTPS)
        if (env === 'production' && req.secure) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
    };
}

/**
 * Middleware CSP para modo report-only (testing)
 */
function cspReportOnlyMiddleware(options = {}) {
    const env = process.env.NODE_ENV || 'development';

    return (req, res, next) => {
        const nonce = generateNonce();
        res.locals.cspNonce = nonce;

        const policy = CSP_POLICIES[env === 'production' ? 'production' : 'development'];
        let cspHeader = generateCSPHeader(policy);
        cspHeader = cspHeader.replace('{{nonce}}', nonce);

        // Report-Only mode (no bloquea, solo reporta)
        res.setHeader('Content-Security-Policy-Report-Only', cspHeader);

        // Endpoint para reportes CSP
        if (options.reportUri) {
            cspHeader += `; report-uri ${options.reportUri}`;
        }

        next();
    };
}

/**
 * Middleware para agregar nonce a scripts inline
 */
function injectNonceToScripts(html, nonce) {
    // Agregar nonce a todos los <script> inline
    return html.replace(
        /<script(?![^>]*\ssrc=)/g,
        `<script nonce="${nonce}"`
    );
}

/**
 * Helper para usar en templates EJS/Handlebars
 */
function getNonceForTemplate(res) {
    return res.locals.cspNonce || '';
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    cspMiddleware,
    cspReportOnlyMiddleware,
    injectNonceToScripts,
    getNonceForTemplate,
    generateNonce,
    CSP_POLICIES
};
