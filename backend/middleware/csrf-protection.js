/**
 * 🛡️ CSRF PROTECTION - Cross-Site Request Forgery
 *
 * Protección contra ataques CSRF con tokens
 * OWASP: A01:2021 - Broken Access Control
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN
// ============================================

const CSRF_CONFIG = {
    tokenLength: 32,
    cookieName: '_csrf',
    headerName: 'x-csrf-token',
    bodyField: '_csrf',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    },
    // Métodos seguros (idempotentes) - no requieren CSRF
    safeMethods: ['GET', 'HEAD', 'OPTIONS'],
    // Rutas excluidas de CSRF (webhooks externos)
    excludedPaths: [
        '/api/webhooks',
        '/health',
        '/api/auth/google' // OAuth callbacks
    ]
};

// ============================================
// GENERACIÓN Y VALIDACIÓN DE TOKENS
// ============================================

/**
 * Generar token CSRF criptográficamente seguro
 */
function generateToken() {
    return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
}

/**
 * Generar secret para el usuario (basado en session ID)
 */
function generateSecret(sessionId) {
    const hash = crypto.createHash('sha256');
    hash.update(sessionId + process.env.CSRF_SECRET || 'default-secret');
    return hash.digest('hex');
}

/**
 * Crear token CSRF firmado
 */
function createToken(secret) {
    const token = generateToken();
    const hash = crypto.createHmac('sha256', secret);
    hash.update(token);
    const signature = hash.digest('hex');

    return `${token}.${signature}`;
}

/**
 * Verificar token CSRF
 */
function verifyToken(token, secret) {
    if (!token || typeof token !== 'string') {
        return false;
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
        return false;
    }

    const [tokenValue, signature] = parts;

    // Verificar firma
    const hash = crypto.createHmac('sha256', secret);
    hash.update(tokenValue);
    const expectedSignature = hash.digest('hex');

    // Comparación timing-safe
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Middleware para generar y proveer token CSRF
 */
function csrfMiddleware(req, res, next) {
    // Obtener o crear session ID
    const sessionId = req.sessionID || req.session?.id || req.cookies?.sessionId || generateToken();

    // Generar secret basado en session
    const secret = generateSecret(sessionId);

    // Si ya existe un token válido en cookie, reutilizarlo
    const existingToken = req.cookies?.[CSRF_CONFIG.cookieName];
    let csrfToken;

    if (existingToken && verifyToken(existingToken, secret)) {
        csrfToken = existingToken;
    } else {
        // Generar nuevo token
        csrfToken = createToken(secret);

        // Guardar en cookie
        res.cookie(CSRF_CONFIG.cookieName, csrfToken, CSRF_CONFIG.cookieOptions);
    }

    // Hacer disponible en request y locals (para templates)
    req.csrfToken = () => csrfToken;
    res.locals.csrfToken = csrfToken;

    next();
}

/**
 * Middleware para validar token CSRF
 */
function validateCsrfMiddleware(req, res, next) {
    // Skip para métodos seguros
    if (CSRF_CONFIG.safeMethods.includes(req.method)) {
        return next();
    }

    // Skip para rutas excluidas
    if (CSRF_CONFIG.excludedPaths.some(path => req.path.startsWith(path))) {
        return next();
    }

    // Obtener token del request
    const token = req.headers[CSRF_CONFIG.headerName] ||
                  req.body?.[CSRF_CONFIG.bodyField] ||
                  req.query?.[CSRF_CONFIG.bodyField];

    // Obtener token esperado de la cookie
    const expectedToken = req.cookies?.[CSRF_CONFIG.cookieName];

    if (!token) {
        console.warn(`🚫 [CSRF] Token faltante - ${req.method} ${req.path} - IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            error: 'CSRF token missing',
            message: 'Token CSRF faltante. Por favor recarga la página.'
        });
    }

    if (!expectedToken) {
        console.warn(`🚫 [CSRF] Cookie faltante - ${req.method} ${req.path} - IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            error: 'CSRF cookie missing',
            message: 'Sesión expirada. Por favor recarga la página.'
        });
    }

    // Verificar que coincidan
    const sessionId = req.sessionID || req.session?.id || req.cookies?.sessionId;
    const secret = generateSecret(sessionId);

    if (!verifyToken(token, secret) || token !== expectedToken) {
        console.warn(`🚫 [CSRF] Token inválido - ${req.method} ${req.path} - IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            error: 'CSRF token invalid',
            message: 'Token CSRF inválido. Posible ataque CSRF detectado.'
        });
    }

    // Token válido
    next();
}

/**
 * Middleware combinado (generar + validar)
 */
function csrfProtection(req, res, next) {
    // Primero generar/proveer token
    csrfMiddleware(req, res, (err) => {
        if (err) return next(err);

        // Luego validar solo para métodos no seguros
        if (!CSRF_CONFIG.safeMethods.includes(req.method)) {
            return validateCsrfMiddleware(req, res, next);
        }

        next();
    });
}

// ============================================
// HELPERS
// ============================================

/**
 * Agregar token CSRF a formularios HTML (helper para templates)
 */
function csrfHiddenInput(token) {
    return `<input type="hidden" name="${CSRF_CONFIG.bodyField}" value="${token}">`;
}

/**
 * Agregar token CSRF a meta tag (para AJAX)
 */
function csrfMetaTag(token) {
    return `<meta name="csrf-token" content="${token}">`;
}

/**
 * Obtener token desde meta tag en cliente
 */
const clientSideHelper = `
// Cliente: Obtener token CSRF desde meta tag
function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : null;
}

// Cliente: Agregar token a fetch requests
function fetchWithCSRF(url, options = {}) {
    const token = getCSRFToken();

    if (!token) {
        console.error('CSRF token not found');
        return Promise.reject(new Error('CSRF token not found'));
    }

    const headers = options.headers || {};
    headers['X-CSRF-Token'] = token;

    return fetch(url, {
        ...options,
        headers: headers
    });
}

// Cliente: Agregar token a todos los formularios
document.addEventListener('DOMContentLoaded', function() {
    const token = getCSRFToken();
    if (!token) return;

    // Agregar a todos los forms que no tengan el token
    document.querySelectorAll('form').forEach(form => {
        if (form.method.toLowerCase() === 'post' && !form.querySelector('[name="_csrf"]')) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = '_csrf';
            input.value = token;
            form.appendChild(input);
        }
    });
});
`;

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Middlewares
    csrfProtection,
    csrfMiddleware,
    validateCsrfMiddleware,

    // Helpers
    csrfHiddenInput,
    csrfMetaTag,
    clientSideHelper,

    // Utilidades
    generateToken,
    verifyToken,

    // Configuración
    CSRF_CONFIG
};
