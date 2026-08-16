/**
 * 🚨 MIDDLEWARE DE MANEJO DE ERRORES
 * Captura y procesa errores de la aplicación
 */

const { executeQuery } = require('../config/database.js');
const devLogger = require('../utils/devLogger.js');

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = async (error, req, res, next) => {
    // Log del error
    devLogger.error('🚨 Error capturado:', {
        message: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        user: req.user?.id || 'anonymous',
        timestamp: new Date().toISOString()
    });
    
    // Registrar error en base de datos
    try {
        await executeQuery(
            `INSERT INTO logs_sistema (nivel, mensaje, contexto, usuario_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                'error',
                error.message,
                JSON.stringify({
                    stack: error.stack,
                    path: req.path,
                    method: req.method,
                    params: req.params,
                    query: req.query,
                    body: req.body
                }),
                req.user?.id || null,
                req.ip || req.connection.remoteAddress,
                req.get('User-Agent') || null
            ]
        );
    } catch (logError) {
        devLogger.error('Error guardando log en base de datos:', logError);
    }
    
    // Determinar tipo de error y respuesta
    let statusCode = 500;
    let message = 'Error interno del servidor';
    let details = null;
    
    // Errores de base de datos MySQL
    if (error.code) {
        switch (error.code) {
            case 'ER_NO_SUCH_TABLE':
                statusCode = 500;
                message = 'Error de configuración de base de datos';
                details = process.env.NODE_ENV === 'development' ? 'Tabla no encontrada' : null;
                break;
                
            case 'ER_DUP_ENTRY':
                statusCode = 409;
                message = 'El registro ya existe';
                details = 'Verifica que los datos no estén duplicados';
                break;
                
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_ROW_IS_REFERENCED':
                statusCode = 400;
                message = 'Error de integridad de datos';
                details = 'La operación viola restricciones de base de datos';
                break;
                
            case 'ER_BAD_FIELD_ERROR':
                statusCode = 400;
                message = 'Campo de base de datos inválido';
                details = process.env.NODE_ENV === 'development' ? error.message : null;
                break;
                
            case 'ECONNREFUSED':
                statusCode = 503;
                message = 'Servicio no disponible';
                details = 'No se puede conectar a la base de datos';
                break;
                
            default:
                statusCode = 500;
                message = 'Error de base de datos';
                details = process.env.NODE_ENV === 'development' ? error.message : null;
        }
    }
    
    // Errores de validación
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Datos de entrada inválidos';
        details = error.details || error.message;
    }
    
    // Errores de autenticación JWT
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token de autenticación inválido';
        details = 'Por favor, inicia sesión nuevamente';
    }
    
    if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Sesión expirada';
        details = 'Tu sesión ha expirado, por favor inicia sesión nuevamente';
    }
    
    // Errores personalizados
    if (error.statusCode) {
        statusCode = error.statusCode;
        message = error.message;
        details = error.details || null;
    }
    
    // Respuesta del error
    const errorResponse = {
        error: message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };
    
    // Agregar detalles en desarrollo
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = details || error.message;
        errorResponse.stack = error.stack;
    } else if (details) {
        errorResponse.details = details;
    }
    
    res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Ruta no encontrada: ${req.path}`);
    error.statusCode = 404;
    next(error);
};

/**
 * Función para crear errores personalizados
 */
const createError = (message, statusCode = 500, details = null) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.details = details;
    return error;
};

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    createError,
    asyncHandler
};