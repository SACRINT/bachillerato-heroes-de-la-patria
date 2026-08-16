/**
 * ✅ LOGGER-MANAGER.JS
 *
 * Sistema de logging condicional para BGE
 * Reemplaza console.log con niveles controlables (DEBUG, INFO, WARN, ERROR)
 *
 * Propósito:
 * - Controlar output de logs por nivel
 * - Facilitar debugging sin logs en producción
 * - Centralizar prefijos y formatos de log
 * - Reducir verbosidad de 5,966 console.log obsoletos
 *
 * Uso:
 *   logger.debug('[MODULO]', 'Mensaje de debug');
 *   logger.info('[MODULO]', 'Información');
 *   logger.warn('[MODULO]', 'Advertencia');
 *   logger.error('[MODULO]', 'Error crítico');
 *
 * Configuración:
 *   // Establecer nivel mínimo (desarrollo)
 *   logger.setLevel('DEBUG');  // Mostrar todo
 *
 *   // Para producción
 *   logger.setLevel('ERROR');  // Solo errores
 */

(function() {
  'use strict';

  // Niveles de logging
  const LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
  };

  // Patrones de datos sensibles (PII) a sanitizar
  const SENSITIVE_PATTERNS = [
    { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, replacement: '[JWT_REDACTED]' },
    { name: 'Email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL_REDACTED]' },
    { name: 'Password field', pattern: /"password"\s*:\s*"[^"]+"/gi, replacement: '"password": "[REDACTED]"' },
    { name: 'Password hash', pattern: /\$2[aby]?\$\d+\$[./A-Za-z0-9]+/g, replacement: '[HASH_REDACTED]' },
    { name: 'API Key', pattern: /[a-zA-Z0-9_-]{32,}/g, replacement: '[API_KEY_REDACTED]' },
    { name: 'Phone MX', pattern: /\+?52\s?\d{2,3}\s?\d{3,4}\s?\d{4}/g, replacement: '[PHONE_REDACTED]' },
    { name: 'CURP', pattern: /[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d/g, replacement: '[CURP_REDACTED]' },
    { name: 'Credit Card', pattern: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, replacement: '[CC_REDACTED]' }
  ];

  // Bandera para habilitar/deshabilitar sanitización
  let sanitizationEnabled = true;

  /**
   * Sanitiza datos sensibles de un string o objeto
   * @param {any} data - Datos a sanitizar
   * @returns {any} - Datos sanitizados
   */
  function sanitize(data) {
    if (!sanitizationEnabled) return data;

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
        return data; // Si falla la serialización, devolver original
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

  /**
   * Habilitar/deshabilitar sanitización
   * @param {boolean} enabled - Estado
   */
  function setSanitization(enabled) {
    sanitizationEnabled = enabled;
    info('[LOGGER]', `Sanitización de PII ${enabled ? 'habilitada' : 'deshabilitada'}`);
  }

  // Estado global del logger
  let currentLevel = LEVELS.DEBUG; // Por defecto en desarrollo
  let isProduction = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
                     (window && window.location && window.location.hostname !== 'localhost');

  // Ajustar nivel automático según ambiente
  if (isProduction) {
    currentLevel = LEVELS.WARN; // En producción, solo warnings y errors
  }

  /**
   * Logger de nivel DEBUG (sanitiza automáticamente datos sensibles)
   * @param {string} prefix - Prefijo del módulo (ej: '[ADMIN-DASHBOARD]')
   * @param {...any} args - Argumentos para log
   */
  function debug(prefix, ...args) {
    if (currentLevel <= LEVELS.DEBUG) {
      const sanitizedArgs = isProduction ? sanitizeArgs(args) : args;
      void 0;
    }
  }

  /**
   * Logger de nivel INFO (sanitiza automáticamente datos sensibles)
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function info(prefix, ...args) {
    if (currentLevel <= LEVELS.INFO) {
      const sanitizedArgs = isProduction ? sanitizeArgs(args) : args;
      void 0;
    }
  }

  /**
   * Logger de nivel WARN (sanitiza automáticamente datos sensibles)
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function warn(prefix, ...args) {
    if (currentLevel <= LEVELS.WARN) {
      const sanitizedArgs = sanitizeArgs(args); // Siempre sanitizar warnings
      void 0;
    }
  }

  /**
   * Logger de nivel ERROR (sanitiza automáticamente datos sensibles)
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function error(prefix, ...args) {
    if (currentLevel <= LEVELS.ERROR) {
      const sanitizedArgs = sanitizeArgs(args); // Siempre sanitizar errores
      console.error(`%c${prefix}`, 'color: #d32f2f; font-weight: bold;', ...sanitizedArgs);
    }
  }

  /**
   * Establecer el nivel mínimo de logging
   * @param {string} level - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'
   */
  function setLevel(level) {
    const levelUpper = level.toUpperCase();
    if (LEVELS.hasOwnProperty(levelUpper)) {
      currentLevel = LEVELS[levelUpper];
      info('[LOGGER]', `Nivel de logging establecido a: ${levelUpper}`);
    } else {
      error('[LOGGER]', `Nivel desconocido: ${level}`);
    }
  }

  /**
   * Obtener el nivel actual
   * @returns {string} Nivel actual
   */
  function getLevel() {
    for (const [key, value] of Object.entries(LEVELS)) {
      if (value === currentLevel) {
        return key;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Información del logger
   */
  function info_logger() {
    return {
      currentLevel: getLevel(),
      isProduction: isProduction,
      availableLevels: Object.keys(LEVELS),
      description: 'Logger centralizado para BGE - Controla output de console.log'
    };
  }

  /**
   * Log con marca de tiempo
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos
   */
  function timestampedLog(prefix, ...args) {
    const timestamp = new Date().toISOString();
    info(`[${timestamp}] ${prefix}`, ...args);
  }

  /**
   * Log con información de contexto
   * @param {string} prefix - Prefijo
   * @param {object} context - Contexto (URL, usuario, etc)
   * @param {...any} args - Argumentos
   */
  function contextLog(prefix, context, ...args) {
    const contextStr = JSON.stringify(context, null, 2);
    info(prefix, 'Contexto:', contextStr, ...args);
  }

  /**
   * Grupo de logs (para mejor organización)
   * @param {string} groupName - Nombre del grupo
   * @param {function} fn - Función que contiene los logs
   */
  function group(groupName, fn) {
    console.group(`%c${groupName}`, 'color: #9c27b0; font-weight: bold; font-size: 12px;');
    fn();
    console.groupEnd();
  }

  /**
   * Performance tracking
   * @param {string} label - Etiqueta para medir
   * @param {function} fn - Función a medir
   */
  async function performance(label, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      info(`[PERF] ${label}`, `${duration.toFixed(2)}ms`);
      return result;
    } catch (err) {
      const duration = performance.now() - start;
      error(`[PERF] ${label}`, `Error después de ${duration.toFixed(2)}ms:`, err);
      throw err;
    }
  }

  /**
   * Tabla de datos para visualización
   * @param {string} prefix - Prefijo
   * @param {array} data - Datos para mostrar en tabla
   */
  function table(prefix, data) {
    if (currentLevel <= LEVELS.DEBUG) {
      void 0;
      console.table(data);
    }
  }

  // Objeto público del logger
  const logger = {
    debug,
    info,
    warn,
    error,
    setLevel,
    getLevel,
    getInfo: info_logger,
    timestampedLog,
    contextLog,
    group,
    performance,
    table,
    sanitize,
    setSanitization,
    LEVELS: Object.keys(LEVELS),
    SENSITIVE_PATTERNS: SENSITIVE_PATTERNS.map(p => p.name) // Exponer nombres de patrones
  };

  // Exponerlo globalmente
  window.logger = logger;

  // Log inicial
  if (typeof window !== 'undefined') {
    info('[LOGGER]', `Logger-Manager inicializado en modo ${getLevel()}`);
  }

})();
