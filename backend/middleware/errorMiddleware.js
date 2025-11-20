/**
 * 🔴 ERROR MIDDLEWARE - SEMANA 26
 * Middleware para captura automática de errores en Express
 *
 * Features:
 * - Automatic error capture
 * - Error tracking integration
 * - Structured error responses
 * - Stack trace sanitization (producción)
 * - Error context extraction
 * - Custom error handlers por tipo
 * - Portable y modular
 *
 * Uso:
 * ```javascript
 * const errorMiddleware = require('./middleware/errorMiddleware');
 *
 * // Apply LAST (después de todas las rutas)
 * app.use(errorMiddleware.notFound);
 * app.use(errorMiddleware.errorHandler);
 * ```
 *
 * Fecha: 20 Noviembre 2025
 */

const errorTracker = require('../services/errorTracker');
const devLogger = require('../utils/devLogger');

/**
 * NOT FOUND HANDLER (404)
 */
function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
}

/**
 * GLOBAL ERROR HANDLER
 */
function errorHandler(err, req, res, next) {
    try {
        // Determine status code
        const statusCode = err.statusCode || err.status || 500;
        const isProduction = process.env.NODE_ENV === 'production';

        // Extract error context
        const context = {
            context: req.path || req.url,
            userId: req.user ? req.user.id : null,
            requestId: req.headers['x-request-id'] || null,
            endpoint: `${req.method} ${req.path || req.url}`,
            method: req.method,
            metadata: {
                ip: getClientIP(req),
                userAgent: req.headers['user-agent'],
                body: req.method !== 'GET' ? req.body : undefined,
                query: req.query
            }
        };

        // Track error
        errorTracker.trackError(err, context);

        // Build error response
        const errorResponse = {
            success: false,
            error: {
                message: err.message || 'Internal Server Error',
                code: err.code || 'INTERNAL_ERROR',
                statusCode: statusCode
            },
            timestamp: new Date().toISOString()
        };

        // Add stack trace only in development
        if (!isProduction && err.stack) {
            errorResponse.error.stack = err.stack;
        }

        // Add validation errors if present
        if (err.validationErrors) {
            errorResponse.error.validationErrors = err.validationErrors;
        }

        // Log error
        devLogger.error('ERROR-MW', `${statusCode} - ${err.message}`, {
            path: req.path,
            method: req.method,
            userId: context.userId
        });

        // Send response
        res.status(statusCode).json(errorResponse);

    } catch (handlerError) {
        // Fallback error response
        devLogger.error('ERROR-MW', 'Error en error handler:', handlerError);

        res.status(500).json({
            success: false,
            error: {
                message: 'Internal Server Error',
                code: 'HANDLER_ERROR'
            },
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * ASYNC ERROR WRAPPER
 * Wrapper para async route handlers que catch automáticamente errores
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * VALIDATION ERROR HANDLER
 */
function validationErrorHandler(err, req, res, next) {
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));

        const validationError = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.validationErrors = errors;

        return errorHandler(validationError, req, res, next);
    }

    next(err);
}

/**
 * DATABASE ERROR HANDLER
 */
function databaseErrorHandler(err, req, res, next) {
    // PostgreSQL errors
    if (err.code && err.code.startsWith('23')) {
        let message = 'Database error';

        if (err.code === '23505') {
            message = 'Duplicate entry. Record already exists.';
        } else if (err.code === '23503') {
            message = 'Foreign key constraint violation.';
        } else if (err.code === '23502') {
            message = 'Required field is missing.';
        }

        const dbError = new Error(message);
        dbError.statusCode = 400;
        dbError.code = err.code;

        return errorHandler(dbError, req, res, next);
    }

    next(err);
}

/**
 * AUTHENTICATION ERROR HANDLER
 */
function authErrorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError' || err.message.includes('token')) {
        const authError = new Error('Authentication required');
        authError.statusCode = 401;
        authError.code = 'UNAUTHORIZED';

        return errorHandler(authError, req, res, next);
    }

    if (err.name === 'ForbiddenError' || err.message.includes('permission')) {
        const forbiddenError = new Error('Insufficient permissions');
        forbiddenError.statusCode = 403;
        forbiddenError.code = 'FORBIDDEN';

        return errorHandler(forbiddenError, req, res, next);
    }

    next(err);
}

/**
 * GET CLIENT IP
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
}

/**
 * CREATE CUSTOM ERROR
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {
    notFound,
    errorHandler,
    asyncHandler,
    validationErrorHandler,
    databaseErrorHandler,
    authErrorHandler,
    AppError
};
