/**
 * 🔒 MIDDLEWARE DE SEGURIDAD AVANZADO
 * Protección contra vulnerabilidades OWASP Top 10
 * Fecha: 18 de Octubre, 2025
 */

const rateLimit = require('express-rate-limit');
const devLogger = require('../utils/devLogger');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Headers de seguridad mejorados
 */
function securityHeadersMiddleware(req, res, next) {
    // Prevención de XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Protección contra Clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Content Security Policy (CSP) - ROBUSTA Y CORREGIDA
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud *.tiny.cloud https://vercel.live https://*.vercel.live blob:; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://accounts.google.com https://cdn.tiny.cloud *.tiny.cloud; " +
        "connect-src 'self' http://localhost:3000 ws: wss: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com https://www.googleapis.com https://cdn.tiny.cloud *.tiny.cloud https://sp.tinymce.com https://vercel.live https://*.vercel.live; " +
        "img-src 'self' data: blob: https: https://cdn.tiny.cloud *.tiny.cloud https://sp.tinymce.com; " +
        "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com https://cdn.tiny.cloud *.tiny.cloud; " +
        "frame-src 'self' https://cdn.tiny.cloud *.tiny.cloud https://www.google.com https://accounts.google.com https://maps.google.com https://forms.gle https://vercel.live https://*.vercel.live;"
    );

    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Protección contra MIME sniffing
    res.setHeader('X-Download-Options', 'noopen');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (Feature Policy) - CORREGIDO
    res.setHeader(
        'Permissions-Policy',
        'camera=(self), geolocation=(), microphone=(), payment=()'
    );

    next();
}

/**
 * Sanitización de inputs para prevenir XSS e Inyección
 */
function sanitizeInputs(req, res, next) {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }

    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params);
    }

    next();
}

/**
 * Sanitizar objeto recursivamente
 */
function sanitizeObject(obj) {
    const sanitized = {};

    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];

            if (typeof value === 'string') {
                // Remover caracteres peligrosos
                sanitized[key] = value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover <script>
                    .replace(/javascript:/gi, '') // Remover javascript:
                    .replace(/on\w+\s*=/gi, '') // Remover event handlers
                    .trim();
            } else if (typeof value === 'object' && value !== null) {
                // Recursión para objetos anidados
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
}

/**
 * Detección de ataques comunes
 */
function attackDetectionMiddleware(req, res, next) {
    const suspiciousPatterns = [
        // SQL Injection
        /(\bOR\b|\bAND\b).*?=.*?/i,
        /UNION.*?SELECT/i,
        /DROP.*?TABLE/i,
        /INSERT.*?INTO/i,
        /DELETE.*?FROM/i,

        // XSS
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /onerror=/gi,
        /onclick=/gi,

        // Path Traversal
        /\.\.\//g,
        /\.\.\\/g
    ];

    const checkString = JSON.stringify({
        body: req.body,
        query: req.query,
        params: req.params
    });

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(checkString)) {
            devLogger.warn(`🚨 Ataque detectado desde IP ${req.ip}: ${pattern}`);
            devLogger.warn(`Request: ${req.method} ${req.originalUrl}`);

            return res.status(403).json({
                success: false,
                error: 'Solicitud bloqueada por razones de seguridad',
                code: 'SECURITY_VIOLATION'
            });
        }
    }

    next();
}

/**
 * Rate limiting por IP para prevenir ataques de fuerza bruta
 */
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    skip: (req) => {
        // Skip rate limiting para health checks
        return req.path === '/api/health' || req.path === '/api/health/simple';
    }
});

/**
 * Rate limiting estricto para autenticación
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos
    skipSuccessfulRequests: true,
    message: {
        success: false,
        error: 'Demasiados intentos de autenticación, cuenta bloqueada temporalmente',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

/**
 * Validación de Content-Type
 */
function validateContentType(req, res, next) {
    // Solo validar para POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.get('Content-Type');

        if (!contentType) {
            return res.status(400).json({
                success: false,
                error: 'Content-Type header es requerido',
                code: 'MISSING_CONTENT_TYPE'
            });
        }

        // Permitir JSON y multipart/form-data
        const allowedTypes = ['application/json', 'multipart/form-data'];
        const isAllowed = allowedTypes.some(type => contentType.includes(type));

        if (!isAllowed) {
            return res.status(415).json({
                success: false,
                error: 'Content-Type no soportado',
                code: 'UNSUPPORTED_CONTENT_TYPE'
            });
        }
    }

    next();
}

/**
 * Logging de seguridad
 */
function securityLoggingMiddleware(req, res, next) {
    // Log de requests sospechosas
    const suspiciousUserAgents = [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan',
        'metasploit'
    ];

    const userAgent = (req.get('User-Agent') || '').toLowerCase();

    if (suspiciousUserAgents.some(agent => userAgent.includes(agent))) {
        devLogger.warn(`🚨 User-Agent sospechoso detectado:`);
        devLogger.warn(`  IP: ${req.ip}`);
        devLogger.warn(`  User-Agent: ${req.get('User-Agent')}`);
        devLogger.warn(`  Request: ${req.method} ${req.originalUrl}`);
    }

    // Log de intentos de acceso a paths administrativos
    if (req.path.includes('admin') && !req.path.includes('api')) {
        devLogger.log(`🔐 Acceso a ruta administrativa: ${req.method} ${req.originalUrl} desde ${req.ip}`);
    }

    next();
}

/**
 * Middleware completo de seguridad
 * 🔧 MODIFICADO: Se excluyen archivos estáticos de las validaciones de seguridad
 */
function securityMiddleware(req, res, next) {
    // ✅ SOLUCIÓN: NO aplicar validaciones de seguridad a archivos estáticos
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml'];
    const isStaticFile = staticExtensions.some(ext => req.path.toLowerCase().endsWith(ext));

    if (isStaticFile) {
        // Para archivos estáticos, solo aplicar headers de seguridad básicos
        securityHeadersMiddleware(req, res, next);
    } else {
        // Para rutas dinámicas y API, aplicar toda la seguridad
        securityHeadersMiddleware(req, res, () => {
            sanitizeInputs(req, res, () => {
                attackDetectionMiddleware(req, res, () => {
                    securityLoggingMiddleware(req, res, next);
                });
            });
        });
    }
}

/**
 * Exportar middlewares
 */
module.exports = {
    securityMiddleware,
    securityHeadersMiddleware,
    sanitizeInputs,
    attackDetectionMiddleware,
    strictRateLimiter,
    authRateLimiter,
    validateContentType,
    securityLoggingMiddleware
};
