/**
 * 🚨 MANEJADOR GLOBAL DE ERRORES
 * Manejo centralizado y logging de errores
 */

/**
 * Middleware de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    
    // Log del error para debugging
    console.error(`🚨 [${timestamp}] ERROR - IP: ${ip} - URL: ${req.originalUrl}`);
    console.error(`    Message: ${err.message}`);
    console.error(`    Stack: ${err.stack}`);
    
    // Respuestas específicas por tipo de error
    let statusCode = err.statusCode || err.status || 500;
    let message = 'Error interno del servidor';
    let code = 'INTERNAL_ERROR';
    
    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token de autenticación inválido';
        code = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token de autenticación expirado';
        code = 'TOKEN_EXPIRED';
    }
    
    // Validation Errors
    else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Datos de entrada inválidos';
        code = 'VALIDATION_ERROR';
    }
    
    // CORS Errors
    else if (err.message.includes('CORS')) {
        statusCode = 403;
        message = 'Acceso CORS denegado';
        code = 'CORS_ERROR';
    }
    
    // Rate Limit Errors
    else if (err.message.includes('rate limit')) {
        statusCode = 429;
        message = 'Demasiadas solicitudes. Intenta de nuevo más tarde';
        code = 'RATE_LIMIT_EXCEEDED';
    }
    
    // bcrypt Errors
    else if (err.name === 'bcryptError') {
        statusCode = 500;
        message = 'Error de procesamiento de contraseña';
        code = 'BCRYPT_ERROR';
    }
    
    // Custom Application Errors
    else if (err.isOperational) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code || 'APPLICATION_ERROR';
    }
    
    // En desarrollo, incluir stack trace
    const errorResponse = {
        error: message,
        code: code,
        timestamp: timestamp,
        path: req.originalUrl,
        method: req.method
    };
    
    // En desarrollo, incluir detalles adicionales
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = {
            stack: err.stack,
            name: err.name,
            originalMessage: err.message
        };
    }
    
    // Security: No revelar información sensible en producción
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        errorResponse.error = 'Error interno del servidor';
        errorResponse.code = 'INTERNAL_ERROR';
    }
    
    res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper para capturar errores async
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Crear error personalizado
 */
const createError = (message, statusCode = 500, code = 'APPLICATION_ERROR') => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
    const error = createError(
        `Endpoint no encontrado: ${req.originalUrl}`,
        404,
        'NOT_FOUND'
    );
    next(error);
};

module.exports = {
    errorHandler,
    asyncHandler,
    createError,
    notFoundHandler
};