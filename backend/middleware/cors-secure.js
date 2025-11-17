/**
 * 🌐 CORS SECURE - Cross-Origin Resource Sharing
 *
 * Configuración segura de CORS con whitelist de dominios
 * OWASP: A05:2021 - Security Misconfiguration
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const cors = require('cors');

// ============================================
// WHITELIST DE DOMINIOS PERMITIDOS
// ============================================

const ALLOWED_ORIGINS = {
    development: [
        'http://localhost:3000',
        'http://localhost:5500', // Live Server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://localhost:4200'
    ],
    production: [
        'https://bachillerato-heroes-de-la-patria.vercel.app',
        'https://bge-heroes.vercel.app',
        'https://www.bachilleratoheroesdelapatria.edu.mx',
        'https://bachilleratoheroesdelapatria.edu.mx',
        // Agregar más dominios de producción según sea necesario
    ]
};

/**
 * Obtener lista de orígenes permitidos según ambiente
 */
function getAllowedOrigins() {
    const env = process.env.NODE_ENV || 'development';
    const origins = ALLOWED_ORIGINS[env] || ALLOWED_ORIGINS.development;

    // Agregar orígenes adicionales desde variable de entorno
    const customOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

    return [...origins, ...customOrigins];
}

/**
 * Verificar si un origen está permitido
 */
function isOriginAllowed(origin) {
    if (!origin) return false; // Rechazar si no hay origen

    const allowedOrigins = getAllowedOrigins();

    // Verificación exacta
    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Verificación por wildcard (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
        // Permitir localhost en cualquier puerto
        if (origin.match(/^http:\/\/localhost:\d+$/)) {
            return true;
        }
        // Permitir 127.0.0.1 en cualquier puerto
        if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
            return true;
        }
    }

    // Verificación por dominio principal (producción)
    if (process.env.NODE_ENV === 'production') {
        // Permitir subdominios de vercel.app
        if (origin.match(/^https:\/\/[\w-]+\.vercel\.app$/)) {
            return true;
        }
    }

    return false;
}

// ============================================
// OPCIONES DE CORS
// ============================================

const corsOptions = {
    /**
     * Función para verificar el origen
     */
    origin: function (origin, callback) {
        // Permitir requests sin origen (Postman, curl, etc.)
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 [CORS] Origen rechazado: ${origin}`);
            callback(new Error('No permitido por CORS - Origen no autorizado'));
        }
    },

    /**
     * Credenciales (cookies, auth headers)
     */
    credentials: true,

    /**
     * Métodos HTTP permitidos
     */
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    /**
     * Headers permitidos
     */
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key',
        'Accept',
        'Origin'
    ],

    /**
     * Headers expuestos al cliente
     */
    exposedHeaders: [
        'X-Total-Count',
        'X-Page-Number',
        'X-Page-Size',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset'
    ],

    /**
     * Preflight cache (segundos)
     */
    maxAge: 86400, // 24 horas

    /**
     * Status code para OPTIONS
     */
    optionsSuccessStatus: 204,

    /**
     * Preflight continue
     */
    preflightContinue: false
};

/**
 * CORS middleware estricto para endpoints sensibles
 * Solo permite orígenes exactos, NO wildcards
 */
const strictCorsOptions = {
    ...corsOptions,
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();

        // Rechazar si no hay origen
        if (!origin) {
            return callback(new Error('Origen requerido para este endpoint'));
        }

        // Solo permitir orígenes exactos en la whitelist
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚫 [CORS-STRICT] Origen rechazado: ${origin}`);
            callback(new Error('No permitido por CORS - Endpoint sensible'));
        }
    }
};

/**
 * CORS middleware para API pública (menos restrictivo)
 */
const publicCorsOptions = {
    ...corsOptions,
    origin: function (origin, callback) {
        // API pública permite todos los orígenes
        callback(null, true);
    },
    credentials: false // Sin credenciales para API pública
};

// ============================================
// MIDDLEWARES CORS
// ============================================

/**
 * CORS estándar para la aplicación
 */
const corsMiddleware = cors(corsOptions);

/**
 * CORS estricto para endpoints sensibles (auth, admin)
 */
const strictCorsMiddleware = cors(strictCorsOptions);

/**
 * CORS público para endpoints read-only
 */
const publicCorsMiddleware = cors(publicCorsOptions);

/**
 * Middleware personalizado con logging
 */
function corsWithLogging(req, res, next) {
    const origin = req.headers.origin;

    cors(corsOptions)(req, res, (err) => {
        if (err) {
            console.error(`❌ [CORS] Error: ${err.message} - Origen: ${origin}`);
            return res.status(403).json({
                success: false,
                error: 'CORS policy violation',
                message: 'Este origen no está autorizado para acceder a este recurso'
            });
        }

        // Log de orígenes permitidos (solo en desarrollo)
        if (process.env.NODE_ENV === 'development' && origin) {
            console.log(`✅ [CORS] Origen permitido: ${origin}`);
        }

        next();
    });
}

/**
 * Agregar origen a whitelist dinámicamente (solo en desarrollo)
 */
function addOriginToWhitelist(origin) {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('No se pueden agregar orígenes dinámicamente en producción');
    }

    if (!ALLOWED_ORIGINS.development.includes(origin)) {
        ALLOWED_ORIGINS.development.push(origin);
        console.log(`✅ [CORS] Origen agregado a whitelist: ${origin}`);
    }
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Middlewares
    corsMiddleware,
    strictCorsMiddleware,
    publicCorsMiddleware,
    corsWithLogging,

    // Utilidades
    getAllowedOrigins,
    isOriginAllowed,
    addOriginToWhitelist,

    // Configuraciones
    corsOptions,
    strictCorsOptions,
    publicCorsOptions
};
