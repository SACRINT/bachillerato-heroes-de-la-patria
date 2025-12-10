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
export class ApiResponse {
    /**
     * Respuesta exitosa
     * @param {Object} res - Express response
     * @param {*} data - Datos a enviar
     * @param {string} message - Mensaje opcional
     * @param {number} statusCode - Código HTTP
     */
    static success(res: any, data?: any, message?: string, statusCode?: number): any;
    /**
     * Respuesta creada (201)
     * @param {Object} res - Express response
     * @param {*} data - Datos creados
     * @param {string} message - Mensaje
     */
    static created(res: any, data: any, message?: string): any;
    /**
     * Respuesta con paginación
     * @param {Object} res - Express response
     * @param {Array} data - Array de datos
     * @param {Object} pagination - Metadata de paginación
     * @param {string} message - Mensaje
     */
    static paginated(res: any, data: any[], pagination: any, message?: string): any;
    /**
     * Respuesta de error
     * @param {Object} res - Express response
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código HTTP
     * @param {*} errors - Detalles de errores
     */
    static error(res: any, message?: string, statusCode?: number, errors?: any): any;
    /**
     * Error de validación (400)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     * @param {*} errors - Detalles de validación
     */
    static validationError(res: any, message?: string, errors?: any): any;
    /**
     * No autorizado (401)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static unauthorized(res: any, message?: string): any;
    /**
     * Prohibido (403)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static forbidden(res: any, message?: string): any;
    /**
     * No encontrado (404)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static notFound(res: any, message?: string): any;
    /**
     * Conflicto (409)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static conflict(res: any, message?: string): any;
    /**
     * Rate limit (429)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static tooManyRequests(res: any, message?: string): any;
    /**
     * Error interno (500)
     * @param {Object} res - Express response
     * @param {string} message - Mensaje
     */
    static serverError(res: any, message?: string): any;
    /**
     * Sin contenido (204)
     * @param {Object} res - Express response
     */
    static noContent(res: any): any;
}
/**
 * Middleware de manejo de errores estandarizado
 */
export function errorHandler(err: any, req: any, res: any, next: any): any;
/**
 * Wrapper para async handlers
 * Captura errores y los pasa al middleware de errores
 */
export function asyncHandler(fn: any): (req: any, res: any, next: any) => void;
//# sourceMappingURL=apiResponse.d.ts.map