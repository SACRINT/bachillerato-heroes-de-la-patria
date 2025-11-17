/**
 * 🚀 HTTP CACHING HEADERS MIDDLEWARE - SEMANA 4
 * Middleware para agregar headers de caché óptimos
 * Soporta Cache-Control, ETag, Last-Modified, Vary
 *
 * Beneficios:
 * - Reduce transferencia de datos con 304 Not Modified
 * - Mejora performance del navegador con caché efectivo
 * - Soporta conditional requests (If-None-Match, If-Modified-Since)
 */

const crypto = require('crypto');

/**
 * Generar ETag de una respuesta
 * @param {*} body - Cuerpo de la respuesta
 * @returns {string} ETag hash
 */
function generateETag(body) {
    return crypto
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex');
}

/**
 * Middleware de caché HTTP para respuestas JSON
 * @param {Object} options - Opciones de configuración
 * @param {number} options.maxAge - Tiempo de caché en segundos (default: 300)
 * @param {boolean} options.private - Si es caché privado (default: false)
 * @param {boolean} options.immutable - Si el recurso es inmutable (default: false)
 * @param {boolean} options.mustRevalidate - Si debe revalidar al expirar (default: true)
 * @param {boolean} options.etag - Si usar ETag (default: true)
 * @param {string[]} options.vary - Headers que afectan el caché (default: ['Accept-Encoding'])
 */
function httpCacheMiddleware(options = {}) {
    const {
        maxAge = 300,  // 5 minutos por defecto
        private: isPrivate = false,
        immutable = false,
        mustRevalidate = true,
        etag: useETag = true,
        vary = ['Accept-Encoding']
    } = options;

    return (req, res, next) => {
        // Solo cachear GET y HEAD
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        // Interceptar res.json para agregar headers
        const originalJson = res.json.bind(res);
        res.json = function(data) {
            // Generar ETag si está habilitado
            if (useETag) {
                const etag = generateETag(data);
                res.setHeader('ETag', `"${etag}"`);

                // Verificar If-None-Match para conditional request
                const clientETag = req.headers['if-none-match'];
                if (clientETag && clientETag === `"${etag}"`) {
                    // 304 Not Modified - no enviar body
                    console.log(`[HTTP-CACHE] 304 Not Modified: ${req.originalUrl}`);
                    return res.status(304).end();
                }
            }

            // Cache-Control header
            const cacheControl = [];
            cacheControl.push(isPrivate ? 'private' : 'public');
            cacheControl.push(`max-age=${maxAge}`);

            if (mustRevalidate) {
                cacheControl.push('must-revalidate');
            }

            if (immutable) {
                cacheControl.push('immutable');
            }

            res.setHeader('Cache-Control', cacheControl.join(', '));

            // Vary header (importante para correctness)
            if (vary.length > 0) {
                res.setHeader('Vary', vary.join(', '));
            }

            // Last-Modified (current time para recursos dinámicos)
            if (!immutable) {
                res.setHeader('Last-Modified', new Date().toUTCString());
            }

            console.log(`[HTTP-CACHE] Cache headers agregados: ${req.originalUrl} (max-age: ${maxAge}s)`);

            return originalJson(data);
        };

        // Interceptar res.send para otros tipos de contenido
        const originalSend = res.send.bind(res);
        res.send = function(data) {
            // Solo aplicar a respuestas HTML/text
            const contentType = res.getHeader('Content-Type') || '';

            if (contentType.includes('text/html') || contentType.includes('text/plain')) {
                // Generar ETag
                if (useETag) {
                    const etag = generateETag(data);
                    res.setHeader('ETag', `"${etag}"`);

                    const clientETag = req.headers['if-none-match'];
                    if (clientETag && clientETag === `"${etag}"`) {
                        return res.status(304).end();
                    }
                }

                // Cache-Control
                const cacheControl = [];
                cacheControl.push(isPrivate ? 'private' : 'public');
                cacheControl.push(`max-age=${maxAge}`);

                if (mustRevalidate) {
                    cacheControl.push('must-revalidate');
                }

                res.setHeader('Cache-Control', cacheControl.join(', '));
                res.setHeader('Vary', vary.join(', '));
            }

            return originalSend(data);
        };

        next();
    };
}

/**
 * Middleware de caché para archivos estáticos
 * Más agresivo que el de API (TTL más largo)
 */
function staticCacheMiddleware(options = {}) {
    const {
        maxAge = 86400 * 30,  // 30 días por defecto
        immutable = true
    } = options;

    return httpCacheMiddleware({
        maxAge,
        private: false,
        immutable,
        mustRevalidate: false,  // No es necesario si es immutable
        etag: true,
        vary: ['Accept-Encoding']
    });
}

/**
 * Middleware de caché para API
 * TTL corto, must-revalidate
 */
function apiCacheMiddleware(options = {}) {
    const {
        maxAge = 60,  // 1 minuto por defecto
        private: isPrivate = false
    } = options;

    return httpCacheMiddleware({
        maxAge,
        private: isPrivate,
        immutable: false,
        mustRevalidate: true,
        etag: true,
        vary: ['Accept-Encoding', 'Authorization']  // Importante para APIs autenticadas
    });
}

/**
 * No-Cache Middleware
 * Para recursos que nunca deben cachearse
 */
function noCacheMiddleware() {
    return (req, res, next) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    };
}

/**
 * Presets comunes de cache
 */
const CACHE_PRESETS = {
    // Muy corto (1 minuto) - Datos en tiempo real
    REALTIME: { maxAge: 60 },

    // Corto (5 minutos) - API pública
    API_PUBLIC: { maxAge: 300, private: false },

    // Medio (30 minutos) - Contenido estático dinámico
    DYNAMIC: { maxAge: 1800, mustRevalidate: true },

    // Largo (1 hora) - Noticias, eventos
    CONTENT: { maxAge: 3600, mustRevalidate: true },

    // Muy largo (1 día) - Archivos versionados
    VERSIONED: { maxAge: 86400, immutable: true },

    // Máximo (1 año) - Assets inmutables con hash
    IMMUTABLE: { maxAge: 31536000, immutable: true },

    // Sin caché - Datos sensibles
    NO_CACHE: null  // Usar noCacheMiddleware() directamente
};

module.exports = {
    httpCacheMiddleware,
    staticCacheMiddleware,
    apiCacheMiddleware,
    noCacheMiddleware,
    CACHE_PRESETS,
    generateETag
};
