/**
 * Middleware completo de seguridad
 * 🔧 MODIFICADO: Se excluyen archivos estáticos de las validaciones de seguridad
 */
export function securityMiddleware(req: any, res: any, next: any): void;
/**
 * Headers de seguridad mejorados
 */
export function securityHeadersMiddleware(req: any, res: any, next: any): void;
/**
 * Sanitización de inputs para prevenir XSS e Inyección
 */
export function sanitizeInputs(req: any, res: any, next: any): void;
/**
 * Detección de ataques comunes
 */
export function attackDetectionMiddleware(req: any, res: any, next: any): any;
/**
 * Rate limiting por IP para prevenir ataques de fuerza bruta
 */
export const strictRateLimiter: any;
/**
 * Rate limiting estricto para autenticación
 */
export const authRateLimiter: any;
/**
 * Validación de Content-Type
 */
export function validateContentType(req: any, res: any, next: any): any;
/**
 * Logging de seguridad
 */
export function securityLoggingMiddleware(req: any, res: any, next: any): void;
//# sourceMappingURL=security.d.ts.map