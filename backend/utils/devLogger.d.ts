/**
 * 🔐 LOGGER SEGURO - Logging Condicional para Producción
 *
 * Propósito: Permite logging en desarrollo sin exponer credenciales en producción
 * GDPR Compliant: No registra emails, tokens, IDs de usuario o datos personales
 */
interface LogMetadata {
    [key: string]: any;
}
declare class DevLogger {
    /**
     * Log general (nivel: info)
     * @param message - Mensaje sin datos sensibles
     * @param args - Argumentos adicionales (sin credenciales)
     */
    log(message: string, ...args: any[]): void;
    /**
     * Info logging (nivel: info)
     * @param message - Mensaje informativo
     * @param args - Argumentos adicionales
     */
    info(message: string, ...args: any[]): void;
    /**
     * Warning logging (nivel: warning)
     * @param message - Mensaje de advertencia
     * @param args - Argumentos adicionales
     */
    warn(message: string, ...args: any[]): void;
    /**
     * Error logging (nivel: error)
     * @param message - Mensaje de error
     * @param error - Objeto error (sin datos sensibles en el mensaje)
     */
    error(message: string, error?: Error | any): void;
    /**
     * Debug logging (nivel: debug - solo desarrollo)
     * @param message - Mensaje de debug
     * @param args - Argumentos adicionales
     */
    debug(message: string, ...args: any[]): void;
    /**
     * Log con información de contexto (seguro)
     * Útil para registrar que algo sucedió sin exponer datos
     * @param action - Acción (ej: 'LOGIN_ATTEMPT', 'API_CALL')
     * @param status - Estado (ej: 'SUCCESS', 'FAILED')
     * @param metadata - Metadata segura (sin credenciales)
     */
    logAction(action: string, status: string, metadata?: LogMetadata): void;
    /**
     * NUNCA USAR: Método para recordar qué NO loguear
     */
    static printSecurityGuidelines(): void;
}
declare const devLogger: DevLogger;
export default devLogger;
//# sourceMappingURL=devLogger.d.ts.map