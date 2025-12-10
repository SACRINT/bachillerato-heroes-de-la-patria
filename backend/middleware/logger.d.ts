/**
 * Middleware para registrar requests
 */
export function requestLogger(req: any, res: any, next: any): Promise<void>;
export namespace logger {
    function info(message: any, context?: {}, userId?: any): Promise<void>;
    function warning(message: any, context?: {}, userId?: any): Promise<void>;
    function error(message: any, context?: {}, userId?: any): Promise<void>;
    function debug(message: any, context?: {}, userId?: any): Promise<void>;
}
/**
 * Middleware para limpiar logs antiguos (ejecutar periódicamente)
 */
export function cleanOldLogs(): Promise<void>;
//# sourceMappingURL=logger.d.ts.map