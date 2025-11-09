/**
 * 🔐 LOGGER SEGURO - Logging Condicional para Producción
 *
 * Propósito: Permite logging en desarrollo sin exponer credenciales en producción
 * GDPR Compliant: No registra emails, tokens, IDs de usuario o datos personales
 *
 * Uso:
 *   const devLog = require('./devLogger');
 *   devLog.log('Usuario autenticado'); // ✅ Seguro - sin datos sensibles
 *   devLog.info('Operación completada');
 *   devLog.warn('Límite de reintentos alcanzado');
 *   devLog.error('Error en la consulta', error);
 *
 * Ejemplo INCORRECTO (que evitar):
 *   console.log('Usuario:', user.email); // ❌ EXPONE EMAIL
 *   devLog.log('Usuario:', user.email); // ❌ SIGUE SIENDO INSEGURO
 *
 * Ejemplo CORRECTO:
 *   devLog.log('Usuario autenticado exitosamente'); // ✅ Sin datos sensibles
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

class DevLogger {
    /**
     * Log general (nivel: info)
     * @param {string} message - Mensaje sin datos sensibles
     * @param {...any} args - Argumentos adicionales (sin credenciales)
     */
    log(message, ...args) {
        if (isDevelopment) {
            console.log(`[LOG] ${message}`, ...args);
        }
        // En producción: NO loguea nada
    }

    /**
     * Info logging (nivel: info)
     * @param {string} message - Mensaje informativo
     * @param {...any} args - Argumentos adicionales
     */
    info(message, ...args) {
        if (isDevelopment) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    /**
     * Warning logging (nivel: warning)
     * @param {string} message - Mensaje de advertencia
     * @param {...any} args - Argumentos adicionales
     */
    warn(message, ...args) {
        // ⚠️ IMPORTANTE: Warnings se loguean en AMBOS (desarrollo y producción)
        // Pero SIN información sensible
        console.warn(`[WARN] ${message}`, ...args);
    }

    /**
     * Error logging (nivel: error)
     * @param {string} message - Mensaje de error
     * @param {Error} error - Objeto error (sin datos sensibles en el mensaje)
     */
    error(message, error) {
        // ⚠️ IMPORTANTE: Errors se loguean siempre
        // Pero SIN credenciales en el objeto error
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error);
        } else {
            // En producción: Solo loguea el mensaje, no el stack trace
            console.error(`[ERROR] ${message}`);
        }
    }

    /**
     * Debug logging (nivel: debug - solo desarrollo)
     * @param {string} message - Mensaje de debug
     * @param {...any} args - Argumentos adicionales
     */
    debug(message, ...args) {
        if (isDevelopment) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log con información de contexto (seguro)
     * Útil para registrar que algo sucedió sin exponer datos
     * @param {string} action - Acción (ej: 'LOGIN_ATTEMPT', 'API_CALL')
     * @param {string} status - Estado (ej: 'SUCCESS', 'FAILED')
     * @param {object} metadata - Metadata segura (sin credenciales)
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
     *
     * CREDENCIALES PROHIBIDAS EN LOGS:
     * ❌ user.email
     * ❌ user.password
     * ❌ user.id (sin contexto seguro)
     * ❌ token (JWT, API keys, etc)
     * ❌ creditCard numbers
     * ❌ SSN (números de seguridad social)
     * ❌ phone numbers
     * ❌ personal addresses
     *
     * SEGURO EN LOGS:
     * ✅ "Usuario autenticado"
     * ✅ "Operación completada"
     * ✅ "Error en consulta a BD"
     * ✅ "Límite de intentos alcanzado"
     * ✅ Contadores anónimos (number of users, etc)
     * ✅ Tiempos de ejecución
     * ✅ Estados de operaciones
     */
    static printSecurityGuidelines() {
        console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   🔐 DIRECTRICES DE LOGGING SEGURO                         ║
╚════════════════════════════════════════════════════════════════════════════╝

PROHIBIDO EN LOGS (GDPR VIOLATION):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Emails: console.log('Email:', user.email)
❌ Tokens: console.log('JWT:', token)
❌ Contraseñas: console.log('Password:', password)
❌ IDs de Usuario: console.log('User ID:', user.id)
❌ Números de Tarjeta: console.log('Card:', cardNumber)
❌ Números Telefónicos: console.log('Phone:', phone)
❌ Direcciones: console.log('Address:', address)

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
const devLog = new DevLogger();
module.exports = devLog;
