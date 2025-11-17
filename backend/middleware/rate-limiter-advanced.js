/**
 * 🛡️ RATE LIMITER ADVANCED - SEMANA 2
 *
 * Sistema de rate limiting global con diferentes límites por tipo de endpoint
 * Preparado para Redis distribuido en el futuro
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const rateLimit = require('express-rate-limit');

// ============================================
// CONFIGURACIÓN POR TIPO DE ENDPOINT
// ============================================

/**
 * Rate limiter para endpoints públicos (sin autenticación)
 * Ejemplo: /api/noticias, /api/calendar, /health
 */
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting para localhost en desarrollo
        if (process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1') {
            return true;
        }
        return false;
    },
    keyGenerator: (req) => {
        // Usar IP real (detrás de proxy/Vercel)
        return req.ip || req.connection.remoteAddress;
    }
});

/**
 * Rate limiter para endpoints de autenticación
 * Ejemplo: /api/auth/login, /api/auth/register
 * MÁS RESTRICTIVO para prevenir brute force
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Solo 5 intentos de login por IP
    skipSuccessfulRequests: true, // No contar requests exitosos
    message: {
        success: false,
        error: 'Demasiados intentos de autenticación. Tu IP ha sido bloqueada temporalmente por seguridad.',
        retryAfter: '15 minutos',
        blocked: true
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Rate limit por IP + email (más seguro)
        const email = req.body?.email || req.query?.email || '';
        return `${req.ip}:${email}`;
    },
    // Handler personalizado cuando se excede el límite
    handler: (req, res) => {
        // Log de seguridad
        console.warn(`🚨 [RATE-LIMIT] IP bloqueada por intentos excesivos: ${req.ip} - Email: ${req.body?.email || 'N/A'}`);

        res.status(429).json({
            success: false,
            error: 'Demasiados intentos de autenticación fallidos',
            retryAfter: '15 minutos',
            blocked: true,
            message: 'Por tu seguridad, esta IP ha sido bloqueada temporalmente. Si eres el usuario legítimo, espera 15 minutos o contacta al administrador.'
        });
    }
});

/**
 * Rate limiter para endpoints admin (requiere autenticación)
 * Ejemplo: /api/admin/*, /api/approvals/*
 * MENOS RESTRICTIVO porque ya están autenticados
 */
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // 200 requests por usuario autenticado
    message: {
        success: false,
        error: 'Has excedido el límite de solicitudes administrativas. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Rate limit por usuario autenticado (token JWT)
        const userId = req.user?.id || req.session?.userId || req.ip;
        return `admin:${userId}`;
    }
});

/**
 * Rate limiter para API keys (terceros integrados)
 * Ejemplo: /api/external/*, /api/webhooks/*
 */
const apiKeyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 1000, // 1000 requests por hora por API key
    message: {
        success: false,
        error: 'API key limit exceeded. Upgrade your plan or wait 1 hour.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const apiKey = req.headers['x-api-key'] || req.query.apiKey || 'unknown';
        return `apikey:${apiKey}`;
    }
});

/**
 * Rate limiter para uploads de archivos
 * MÁS RESTRICTIVO para prevenir abuso de storage
 */
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // Máximo 50 uploads por hora
    message: {
        success: false,
        error: 'Has excedido el límite de uploads. Máximo 50 archivos por hora.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip si es admin (pueden subir más)
        return req.user?.role === 'admin' || req.user?.role === 'administrativo';
    }
});

/**
 * Rate limiter para formularios de contacto/solicitudes
 * Prevenir spam
 */
const formLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // Máximo 10 envíos por hora
    message: {
        success: false,
        error: 'Has enviado demasiados formularios. Máximo 10 por hora.',
        retryAfter: '1 hora'
    },
    skipSuccessfulRequests: false,
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter para búsquedas
 * Prevenir scraping masivo
 */
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 búsquedas por minuto
    message: {
        success: false,
        error: 'Demasiadas búsquedas. Espera 1 minuto.',
        retryAfter: '1 minuto'
    }
});

// ============================================
// RATE LIMITER GLOBAL (todas las rutas)
// ============================================

/**
 * Rate limiter global muy permisivo
 * Última línea de defensa contra ataques DDoS
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // 500 requests totales por IP (muy permisivo)
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde tu IP. Límite global excedido.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip para rutas estáticas y health check
        const staticRoutes = ['/health', '/favicon.ico', '/robots.txt'];
        return staticRoutes.includes(req.path) || req.path.startsWith('/static');
    }
});

// ============================================
// HELPERS
// ============================================

/**
 * Middleware para logging de rate limit hits
 */
function rateLimitLogger(req, res, next) {
    // Solo log cuando el rate limit está cerca del límite
    const remaining = parseInt(res.getHeader('RateLimit-Remaining') || '999');
    const limit = parseInt(res.getHeader('RateLimit-Limit') || '1000');

    if (remaining < limit * 0.1) { // Menos del 10% restante
        console.warn(`⚠️ [RATE-LIMIT] IP ${req.ip} cerca del límite: ${remaining}/${limit} restantes`);
    }

    next();
}

/**
 * Crear rate limiter personalizado
 */
function createCustomLimiter(options) {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: options.message || { success: false, error: 'Rate limit exceeded' },
        standardHeaders: true,
        legacyHeaders: false,
        ...options
    });
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Limiters predefinidos
    publicLimiter,
    authLimiter,
    adminLimiter,
    apiKeyLimiter,
    uploadLimiter,
    formLimiter,
    searchLimiter,
    globalLimiter,

    // Helpers
    rateLimitLogger,
    createCustomLimiter,

    // Factory para rate limiters personalizados por ruta
    createRateLimiter: createCustomLimiter
};
