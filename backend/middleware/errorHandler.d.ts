/**
 * Middleware principal de manejo de errores
 */
export function errorHandler(error: any, req: any, res: any, next: any): Promise<void>;
/**
 * Middleware para capturar rutas no encontradas (404)
 */
export function notFoundHandler(req: any, res: any, next: any): void;
/**
 * Función para crear errores personalizados
 */
export function createError(message: any, statusCode?: number, details?: any): Error;
/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export function asyncHandler(fn: any): (req: any, res: any, next: any) => void;
//# sourceMappingURL=errorHandler.d.ts.map