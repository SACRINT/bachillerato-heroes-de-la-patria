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

  // Estado global del logger
  let currentLevel = LEVELS.DEBUG; // Por defecto en desarrollo
  let isProduction = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') ||
                     (window && window.location && window.location.hostname !== 'localhost');

  // Ajustar nivel automático según ambiente
  if (isProduction) {
    currentLevel = LEVELS.WARN; // En producción, solo warnings y errors
  }

  /**
   * Logger de nivel DEBUG
   * @param {string} prefix - Prefijo del módulo (ej: '[ADMIN-DASHBOARD]')
   * @param {...any} args - Argumentos para log
   */
  function debug(prefix, ...args) {
    if (currentLevel <= LEVELS.DEBUG) {
      console.log(`%c${prefix}`, 'color: #007bff; font-weight: bold;', ...args);
    }
  }

  /**
   * Logger de nivel INFO
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function info(prefix, ...args) {
    if (currentLevel <= LEVELS.INFO) {
      console.info(`%c${prefix}`, 'color: #28a745; font-weight: bold;', ...args);
    }
  }

  /**
   * Logger de nivel WARN
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function warn(prefix, ...args) {
    if (currentLevel <= LEVELS.WARN) {
      console.warn(`%c${prefix}`, 'color: #ff9800; font-weight: bold;', ...args);
    }
  }

  /**
   * Logger de nivel ERROR
   * @param {string} prefix - Prefijo del módulo
   * @param {...any} args - Argumentos para log
   */
  function error(prefix, ...args) {
    if (currentLevel <= LEVELS.ERROR) {
      console.error(`%c${prefix}`, 'color: #d32f2f; font-weight: bold;', ...args);
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
      console.log(`%c${prefix}`, 'color: #007bff; font-weight: bold;');
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
    info: info_logger,
    timestampedLog,
    contextLog,
    group,
    performance,
    table,
    LEVELS: Object.keys(LEVELS)
  };

  // Exponerlo globalmente
  window.logger = logger;

  // Log inicial
  if (typeof window !== 'undefined') {
    info('[LOGGER]', `Logger-Manager inicializado en modo ${getLevel()}`);
  }

})();
