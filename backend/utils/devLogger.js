"use strict";
/**
 * 🔐 LOGGER SEGURO - Logging Condicional para Producción
 *
 * Propósito: Permite logging en desarrollo sin exponer credenciales en producción
 * GDPR Compliant: No registra emails, tokens, IDs de usuario o datos personales
 */
Object.defineProperty(exports, "__esModule", { value: true });
const isDevelopment = process.env.NODE_ENV !== 'production';
class DevLogger {
    /**
     * Log general (nivel: info)
     * @param message - Mensaje sin datos sensibles
     * @param args - Argumentos adicionales (sin credenciales)
     */
    log(message, ...args) {
        if (isDevelopment) {
            console.log(`[LOG] ${message}`, ...args);
        }
        // En producción: NO loguea nada
    }
    /**
     * Info logging (nivel: info)
     * @param message - Mensaje informativo
     * @param args - Argumentos adicionales
     */
    info(message, ...args) {
        if (isDevelopment) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    /**
     * Warning logging (nivel: warning)
     * @param message - Mensaje de advertencia
     * @param args - Argumentos adicionales
     */
    warn(message, ...args) {
        // ⚠️ IMPORTANTE: Warnings se loguean en AMBOS (desarrollo y producción)
        // Pero SIN información sensible
        console.warn(`[WARN] ${message}`, ...args);
    }
    /**
     * Error logging (nivel: error)
     * @param message - Mensaje de error
     * @param error - Objeto error (sin datos sensibles en el mensaje)
     */
    error(message, error) {
        // ⚠️ IMPORTANTE: Errors se loguean siempre
        // Pero SIN credenciales en el objeto error
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error);
        }
        else {
            // En producción: Solo loguea el mensaje, no el stack trace
            console.error(`[ERROR] ${message}`);
        }
    }
    /**
     * Debug logging (nivel: debug - solo desarrollo)
     * @param message - Mensaje de debug
     * @param args - Argumentos adicionales
     */
    debug(message, ...args) {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
    /**
     * Log con información de contexto (seguro)
     * Útil para registrar que algo sucedió sin exponer datos
     * @param action - Acción (ej: 'LOGIN_ATTEMPT', 'API_CALL')
     * @param status - Estado (ej: 'SUCCESS', 'FAILED')
     * @param metadata - Metadata segura (sin credenciales)
     */
    logAction(action, status, metadata = {}) {
        const timestamp = new Date().toISOString();
        const log = {
            timestamp,
            action,
            status,
            ...metadata
        };
        if (isDevelopment) {
            console.log(`[ACTION] ${action}:${status}`, log);
        }
        // En producción: puede opcional loguear a un servicio externo (no a console)
    }
    /**
     * NUNCA USAR: Método para recordar qué NO loguear
     */
    static printSecurityGuidelines() {
        console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   🔐 DIRECTRICES DE LOGGING SEGURO                         ║
╚════════════════════════════════════════════════════════════════════════════╝

PROHIBIDO EN LOGS (GDPR VIOLATION):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Emails: devLogger.log('Email:', user.email)
❌ Tokens: devLogger.log('JWT:', token)
❌ Contraseñas: devLogger.log('Password:', password)
❌ IDs de Usuario: devLogger.log('User ID:', user.id)
❌ Números de Tarjeta: devLogger.log('Card:', cardNumber)
❌ Números Telefónicos: devLogger.log('Phone:', phone)
❌ Direcciones: devLogger.log('Address:', address)

PERMITIDO EN LOGS (SEGURO):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ devLog.log('Usuario autenticado exitosamente')
✅ devLog.info('Operación completada')
✅ devLog.warn('Límite de reintentos alcanzado')
✅ devLog.error('Error conectando a BD')
✅ devLog.logAction('LOGIN_ATTEMPT', 'SUCCESS')
✅ devLog.logAction('API_CALL', 'FAILED')
        `);
    }
}
// Exportar como singleton
const devLogger = new DevLogger();
exports.default = devLogger;
module.exports = devLogger; // For backward compatibility with JS files
//# sourceMappingURL=devLogger.js.map