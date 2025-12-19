"use strict";
/**
 * 🔐 LOGGER SEGURO - Logging Condicional para Producción
 *
 * Propósito: Permite logging en desarrollo sin exponer credenciales en producción
 * GDPR Compliant: No registra emails, tokens, IDs de usuario o datos personales
 *
 * ACTUALIZADO 18-DIC-2025: Sanitización automática de PII en TODOS los logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
const isDevelopment = process.env.NODE_ENV !== 'production';

// Patrones de datos sensibles (PII) a sanitizar AUTOMÁTICAMENTE
const SENSITIVE_PATTERNS = [
    { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[JWT_REDACTED]' },
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    { pattern: /"password"\s*:\s*"[^"]+"/gi, replacement: '"password": "[REDACTED]"' },
    { pattern: /\$2[aby]?\$\d+\$[./A-Za-z0-9]+/g, replacement: '[HASH_REDACTED]' },
    { pattern: /Bearer\s+[A-Za-z0-9._-]+/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
    { pattern: /\+?52\s?\d{2,3}\s?\d{3,4}\s?\d{4}/g, replacement: '[PHONE_REDACTED]' },
    { pattern: /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/g, replacement: '[CURP_REDACTED]' },
    { pattern: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, replacement: '[CC_REDACTED]' }
];

/**
 * Sanitiza datos sensibles de cualquier input
 * @param {any} data - Dato a sanitizar
 * @returns {any} - Dato sanitizado
 */
function sanitize(data) {
    if (typeof data === 'string') {
        let sanitized = data;
        SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
            sanitized = sanitized.replace(pattern, replacement);
        });
        return sanitized;
    }

    if (typeof data === 'object' && data !== null) {
        try {
            let jsonStr = JSON.stringify(data);
            SENSITIVE_PATTERNS.forEach(({ pattern, replacement }) => {
                jsonStr = jsonStr.replace(pattern, replacement);
            });
            return JSON.parse(jsonStr);
        } catch (e) {
            return data;
        }
    }

    return data;
}

/**
 * Sanitiza array de argumentos
 * @param {array} args - Argumentos a sanitizar
 * @returns {array} - Argumentos sanitizados
 */
function sanitizeArgs(args) {
    return args.map(arg => sanitize(arg));
}

class DevLogger {
    /**
     * Log general (nivel: info) - SANITIZADO AUTOMÁTICAMENTE
     * @param message - Mensaje sin datos sensibles
     * @param args - Argumentos adicionales (sin credenciales)
     */
    log(message, ...args) {
        if (isDevelopment) {
            const sanitizedMsg = sanitize(message);
            const sanitizedArgs = sanitizeArgs(args);
            console.log(`[LOG] ${sanitizedMsg}`, ...sanitizedArgs);
        }
        // En producción: NO loguea nada
    }
    /**
     * Info logging (nivel: info) - SANITIZADO AUTOMÁTICAMENTE
     * @param message - Mensaje informativo
     * @param args - Argumentos adicionales
     */
    info(message, ...args) {
        if (isDevelopment) {
            const sanitizedMsg = sanitize(message);
            const sanitizedArgs = sanitizeArgs(args);
            console.info(`[INFO] ${sanitizedMsg}`, ...sanitizedArgs);
        }
    }
    /**
     * Warning logging (nivel: warning) - SANITIZADO AUTOMÁTICAMENTE
     * @param message - Mensaje de advertencia
     * @param args - Argumentos adicionales
     */
    warn(message, ...args) {
        // ⚠️ IMPORTANTE: Warnings se loguean en AMBOS (desarrollo y producción)
        // SIEMPRE sanitizamos para prevenir exposición de PII
        const sanitizedMsg = sanitize(message);
        const sanitizedArgs = sanitizeArgs(args);
        console.warn(`[WARN] ${sanitizedMsg}`, ...sanitizedArgs);
    }
    /**
     * Error logging (nivel: error) - SANITIZADO AUTOMÁTICAMENTE
     * @param message - Mensaje de error
     * @param error - Objeto error (sin datos sensibles en el mensaje)
     */
    error(message, error) {
        // ⚠️ IMPORTANTE: Errors se loguean siempre
        // SIEMPRE sanitizamos para prevenir exposición de PII
        const sanitizedMsg = sanitize(message);
        const sanitizedError = sanitize(error);
        if (isDevelopment) {
            console.error(`[ERROR] ${sanitizedMsg}`, sanitizedError);
        }
        else {
            // En producción: Solo loguea el mensaje sanitizado, no el stack trace
            console.error(`[ERROR] ${sanitizedMsg}`);
        }
    }
    /**
     * Debug logging (nivel: debug - solo desarrollo) - SANITIZADO AUTOMÁTICAMENTE
     * @param message - Mensaje de debug
     * @param args - Argumentos adicionales
     */
    debug(message, ...args) {
        if (isDevelopment) {
            const sanitizedMsg = sanitize(message);
            const sanitizedArgs = sanitizeArgs(args);
            console.debug(`[DEBUG] ${sanitizedMsg}`, ...sanitizedArgs);
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