/**
 * API Response Standardization Utility
 * Utilidad para estandarizar respuestas API en todo el sistema
 *
 * @version 1.0.0
 * @author Claude Code - Arquitecto IA
 */

// ============================================
// ERROR CODES
// ============================================

const ERROR_CODES = {
    // Authentication errors (401)
    UNAUTHORIZED: 'UNAUTHORIZED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Authorization errors (403)
    FORBIDDEN: 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    ROLE_REQUIRED: 'ROLE_REQUIRED',

    // Validation errors (400)
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',

    // Resource errors (404)
    NOT_FOUND: 'NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

    // Conflict errors (409)
    CONFLICT: 'CONFLICT',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    ALREADY_EXISTS: 'ALREADY_EXISTS',

    // Rate limiting (429)
    RATE_LIMITED: 'RATE_LIMITED',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

    // Server errors (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

// ============================================
// RESPONSE BUILDERS
// ============================================

/**
 * Construye respuesta de éxito
 */
function success(data, options = {}) {
    const { message = null, meta = null, statusCode = 200 } = options;

    const response = {
        success: true,
        data
    };

    if (message) {
        response.message = message;
    }

    if (meta) {
        response.meta = meta;
    }

    return {
        statusCode,
        body: response
    };
}

/**
 * Construye respuesta de error
 */
function error(code, message, options = {}) {
    const { details = null, statusCode = 500 } = options;

    const response = {
        success: false,
        error: {
            code,
            message
        }
    };

    if (details) {
        response.error.details = details;
    }

    return {
        statusCode,
        body: response
    };
}

/**
 * Construye respuesta de lista paginada
 */
function paginated(data, pagination, options = {}) {
    const { page = 1, limit = 20, total = 0 } = pagination;
    const totalPages = Math.ceil(total / limit);

    return success(data, {
        ...options,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        }
    });
}

/**
 * Construye respuesta de creación
 */
function created(data, options = {}) {
    return success(data, {
        ...options,
        statusCode: 201,
        message: options.message || 'Recurso creado exitosamente'
    });
}

/**
 * Construye respuesta de actualización
 */
function updated(data, options = {}) {
    return success(data, {
        ...options,
        statusCode: 200,
        message: options.message || 'Recurso actualizado exitosamente'
    });
}

/**
 * Construye respuesta de eliminación
 */
function deleted(options = {}) {
    return success(null, {
        ...options,
        statusCode: 200,
        message: options.message || 'Recurso eliminado exitosamente'
    });
}

// ============================================
// ERROR RESPONSES
// ============================================

/**
 * Error de validación
 */
function validationError(details, message = 'Error de validación') {
    return error(ERROR_CODES.VALIDATION_ERROR, message, {
        details,
        statusCode: 400
    });
}

/**
 * Error de no autorizado
 */
function unauthorized(message = 'No autorizado') {
    return error(ERROR_CODES.UNAUTHORIZED, message, {
        statusCode: 401
    });
}

/**
 * Error de prohibido
 */
function forbidden(message = 'Acceso denegado') {
    return error(ERROR_CODES.FORBIDDEN, message, {
        statusCode: 403
    });
}

/**
 * Error de no encontrado
 */
function notFound(resource = 'Recurso') {
    return error(ERROR_CODES.NOT_FOUND, `${resource} no encontrado`, {
        statusCode: 404
    });
}

/**
 * Error de conflicto
 */
function conflict(message = 'Conflicto con el recurso existente') {
    return error(ERROR_CODES.CONFLICT, message, {
        statusCode: 409
    });
}

/**
 * Error de rate limiting
 */
function rateLimited(retryAfter = 60) {
    return error(ERROR_CODES.RATE_LIMITED, 'Demasiadas solicitudes', {
        statusCode: 429,
        details: { retryAfter }
    });
}

/**
 * Error interno del servidor
 */
function internalError(message = 'Error interno del servidor') {
    return error(ERROR_CODES.INTERNAL_ERROR, message, {
        statusCode: 500
    });
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Middleware para enviar respuesta estandarizada
 */
function sendResponse(res, response) {
    return res.status(response.statusCode).json(response.body);
}

/**
 * Middleware que agrega helpers al response
 */
function apiResponseMiddleware(req, res, next) {
    res.success = (data, options) => sendResponse(res, success(data, options));
    res.error = (code, message, options) => sendResponse(res, error(code, message, options));
    res.paginated = (data, pagination, options) => sendResponse(res, paginated(data, pagination, options));
    res.created = (data, options) => sendResponse(res, created(data, options));
    res.updated = (data, options) => sendResponse(res, updated(data, options));
    res.deleted = (options) => sendResponse(res, deleted(options));

    res.validationError = (details, message) => sendResponse(res, validationError(details, message));
    res.unauthorized = (message) => sendResponse(res, unauthorized(message));
    res.forbidden = (message) => sendResponse(res, forbidden(message));
    res.notFound = (resource) => sendResponse(res, notFound(resource));
    res.conflict = (message) => sendResponse(res, conflict(message));
    res.rateLimited = (retryAfter) => sendResponse(res, rateLimited(retryAfter));
    res.internalError = (message) => sendResponse(res, internalError(message));

    next();
}

/**
 * Handler de errores estandarizado
 */
function errorHandler(err, req, res, next) {
    console.error('[API Error]', err);

    // Errores de validación de Joi
    if (err.isJoi) {
        const details = err.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return sendResponse(res, validationError(details));
    }

    // Errores de JWT
    if (err.name === 'JsonWebTokenError') {
        return sendResponse(res, unauthorized('Token inválido'));
    }

    if (err.name === 'TokenExpiredError') {
        return sendResponse(res, error(ERROR_CODES.TOKEN_EXPIRED, 'Token expirado', { statusCode: 401 }));
    }

    // Errores de PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                return sendResponse(res, conflict('El registro ya existe'));
            case '23503': // Foreign key violation
                return sendResponse(res, validationError([{ message: 'Referencia inválida' }]));
            case '23502': // Not null violation
                return sendResponse(res, validationError([{ message: 'Campo requerido faltante' }]));
        }
    }

    // Error genérico
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message;

    return sendResponse(res, error(ERROR_CODES.INTERNAL_ERROR, message, { statusCode }));
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
    // Error codes
    ERROR_CODES,

    // Response builders
    success,
    error,
    paginated,
    created,
    updated,
    deleted,

    // Error responses
    validationError,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    rateLimited,
    internalError,

    // Middleware
    sendResponse,
    apiResponseMiddleware,
    errorHandler
};
