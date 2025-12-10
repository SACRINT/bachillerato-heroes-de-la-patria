export namespace ERROR_CODES {
    let UNAUTHORIZED: string;
    let TOKEN_EXPIRED: string;
    let TOKEN_INVALID: string;
    let SESSION_EXPIRED: string;
    let FORBIDDEN: string;
    let INSUFFICIENT_PERMISSIONS: string;
    let ROLE_REQUIRED: string;
    let VALIDATION_ERROR: string;
    let INVALID_INPUT: string;
    let MISSING_FIELD: string;
    let INVALID_FORMAT: string;
    let NOT_FOUND: string;
    let USER_NOT_FOUND: string;
    let RESOURCE_NOT_FOUND: string;
    let CONFLICT: string;
    let DUPLICATE_ENTRY: string;
    let ALREADY_EXISTS: string;
    let RATE_LIMITED: string;
    let TOO_MANY_REQUESTS: string;
    let INTERNAL_ERROR: string;
    let DATABASE_ERROR: string;
    let SERVICE_UNAVAILABLE: string;
}
/**
 * Construye respuesta de éxito
 */
export function success(data: any, options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        data: any;
    };
};
/**
 * Construye respuesta de error
 */
export function error(code: any, message: any, options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Construye respuesta de lista paginada
 */
export function paginated(data: any, pagination: any, options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        data: any;
    };
};
/**
 * Construye respuesta de creación
 */
export function created(data: any, options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        data: any;
    };
};
/**
 * Construye respuesta de actualización
 */
export function updated(data: any, options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        data: any;
    };
};
/**
 * Construye respuesta de eliminación
 */
export function deleted(options?: {}): {
    statusCode: any;
    body: {
        success: boolean;
        data: any;
    };
};
/**
 * Error de validación
 */
export function validationError(details: any, message?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error de no autorizado
 */
export function unauthorized(message?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error de prohibido
 */
export function forbidden(message?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error de no encontrado
 */
export function notFound(resource?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error de conflicto
 */
export function conflict(message?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error de rate limiting
 */
export function rateLimited(retryAfter?: number): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Error interno del servidor
 */
export function internalError(message?: string): {
    statusCode: any;
    body: {
        success: boolean;
        error: {
            code: any;
            message: any;
        };
    };
};
/**
 * Middleware para enviar respuesta estandarizada
 */
export function sendResponse(res: any, response: any): any;
/**
 * Middleware que agrega helpers al response
 */
export function apiResponseMiddleware(req: any, res: any, next: any): void;
/**
 * Handler de errores estandarizado
 */
export function errorHandler(err: any, req: any, res: any, next: any): any;
//# sourceMappingURL=api-response.d.ts.map