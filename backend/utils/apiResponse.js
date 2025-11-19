/**
 * 📨 API RESPONSE UTILITIES - v1.0.0
 * Estandarización de respuestas API
 *
 * SEMANA 4 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Response envelope consistente
 * - Error handling estandarizado
 * - Pagination helpers
 * - HTTP status codes correctos
 */

/**
 * Clase para respuestas estandarizadas
 */
class ApiResponse {
  /**
   * Respuesta exitosa
   * @param {Object} res - Express response
   * @param {*} data - Datos a enviar
   * @param {string} message - Mensaje opcional
   * @param {number} statusCode - Código HTTP
   */
  static success(res, data = null, message = 'Operación exitosa', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta creada (201)
   * @param {Object} res - Express response
   * @param {*} data - Datos creados
   * @param {string} message - Mensaje
   */
  static created(res, data, message = 'Recurso creado exitosamente') {
    return this.success(res, data, message, 201);
  }

  /**
   * Respuesta con paginación
   * @param {Object} res - Express response
   * @param {Array} data - Array de datos
   * @param {Object} pagination - Metadata de paginación
   * @param {string} message - Mensaje
   */
  static paginated(res, data, pagination, message = 'Datos obtenidos exitosamente') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 50,
        total: pagination.total || 0,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / (pagination.limit || 50)),
        hasMore: pagination.hasMore || (pagination.page * pagination.limit < pagination.total)
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Respuesta de error
   * @param {Object} res - Express response
   * @param {string} message - Mensaje de error
   * @param {number} statusCode - Código HTTP
   * @param {*} errors - Detalles de errores
   */
  static error(res, message = 'Error en la operación', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Error de validación (400)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   * @param {*} errors - Detalles de validación
   */
  static validationError(res, message = 'Error de validación', errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * No autorizado (401)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static unauthorized(res, message = 'No autorizado') {
    return this.error(res, message, 401);
  }

  /**
   * Prohibido (403)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static forbidden(res, message = 'Acceso prohibido') {
    return this.error(res, message, 403);
  }

  /**
   * No encontrado (404)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return this.error(res, message, 404);
  }

  /**
   * Conflicto (409)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static conflict(res, message = 'Conflicto con recurso existente') {
    return this.error(res, message, 409);
  }

  /**
   * Rate limit (429)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static tooManyRequests(res, message = 'Demasiadas solicitudes') {
    return this.error(res, message, 429);
  }

  /**
   * Error interno (500)
   * @param {Object} res - Express response
   * @param {string} message - Mensaje
   */
  static serverError(res, message = 'Error interno del servidor') {
    return this.error(res, message, 500);
  }

  /**
   * Sin contenido (204)
   * @param {Object} res - Express response
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

/**
 * Middleware de manejo de errores estandarizado
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  console.error('[API Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method
  });

  // Errores de ServiceError
  if (err.name === 'ServiceError') {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  // Errores de validación de Joi
  if (err.name === 'ValidationError' || err.isJoi) {
    const errors = err.details?.map(d => ({
      field: d.path?.join('.'),
      message: d.message
    }));
    return ApiResponse.validationError(res, 'Error de validación', errors);
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expirado');
  }

  // Errores de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return ApiResponse.conflict(res, 'Ya existe un registro con estos datos');
      case '23503': // Foreign key violation
        return ApiResponse.validationError(res, 'Referencia a registro inexistente');
      case '23502': // Not null violation
        return ApiResponse.validationError(res, 'Campo requerido faltante');
      case '42P01': // Table not found
        return ApiResponse.serverError(res, 'Error de configuración de base de datos');
    }
  }

  // Error genérico
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Error interno del servidor';

  return ApiResponse.serverError(res, message);
};

/**
 * Wrapper para async handlers
 * Captura errores y los pasa al middleware de errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiResponse,
  errorHandler,
  asyncHandler
};
