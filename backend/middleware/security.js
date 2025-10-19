/**
 * 🔒 MIDDLEWARE DE SEGURIDAD AVANZADO
 * Protección contra vulnerabilidades OWASP Top 10
 * Fecha: 18 de Octubre, 2025
 */

const rateLimit = require('express-rate-limit');
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

    // Content Security Policy (CSP) - Estricto
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.tiny.cloud; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data: https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "connect-src 'self';"
    );

    // Strict Transport Security (HSTS)
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Protección contra MIME sniffing
    res.setHeader('X-Download-Options', 'noopen');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (Feature Policy)
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=()'
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
            console.warn(`🚨 Ataque detectado desde IP ${req.ip}: ${pattern}`);
            console.warn(`Request: ${req.method} ${req.originalUrl}`);

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
        console.warn(`🚨 User-Agent sospechoso detectado:`);
        console.warn(`  IP: ${req.ip}`);
        console.warn(`  User-Agent: ${req.get('User-Agent')}`);
        console.warn(`  Request: ${req.method} ${req.originalUrl}`);
    }

    // Log de intentos de acceso a paths administrativos
    if (req.path.includes('admin') && !req.path.includes('api')) {
        console.log(`🔐 Acceso a ruta administrativa: ${req.method} ${req.originalUrl} desde ${req.ip}`);
    }

    next();
}

/**
 * Middleware completo de seguridad
 */
function securityMiddleware(req, res, next) {
    securityHeadersMiddleware(req, res, () => {
        sanitizeInputs(req, res, () => {
            attackDetectionMiddleware(req, res, () => {
                securityLoggingMiddleware(req, res, next);
            });
        });
    });
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
