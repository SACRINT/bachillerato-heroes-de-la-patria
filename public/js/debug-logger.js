/**
 * Debug Logger - Logging condicional para desarrollo
 * Solo loguea si DEBUG_MODE está activado
 * Protegido contra carga duplicada
 */

// Patrón IIFE para proteger contra carga duplicada
(function() {
  // Si debugLog ya está definido globalmente, no hacer nada
  if (typeof window !== 'undefined' && window.debugLog) {
    return; // Ya está cargado, salir
  }

  // Definir debugLog solo si window existe (en navegador)
  if (typeof window !== 'undefined') {
    window.debugLog = {
      /**
       * @param {string} tag - Prefijo del log (ej: 'AUTH', 'API', 'FORM')
       * @param {string} message - Mensaje
       * @param {any} data - Datos adicionales (opcional)
       */
      log: (tag, message, data = null) => {
        if (!window.DEBUG_MODE) return;
        const timestamp = new Date().toLocaleTimeString();
        void 0;
      },

      /**
       * Log de warning
       * @param {string} tag - Prefijo del log
       * @param {string} message - Mensaje
       * @param {any} data - Datos adicionales (opcional)
       */
      warn: (tag, message, data = null) => {
        if (!window.DEBUG_MODE) return;
        const timestamp = new Date().toLocaleTimeString();
        void 0;
      },

      /**
       * Log de error
       * @param {string} tag - Prefijo del log
       * @param {string} message - Mensaje
       * @param {any} data - Datos adicionales (opcional)
       */
      error: (tag, message, data = null) => {
        if (!window.DEBUG_MODE) return;
        const timestamp = new Date().toLocaleTimeString();
        console.error(
          `%c[${timestamp}] [${tag}] ${message}`,
          'color: #ff3333; font-weight: bold;',
          data || ''
        );
      }
    };
  }

  // Exportar para Node.js si aplica (para testing)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debugLog: typeof window !== 'undefined' ? window.debugLog : null };
  }
})();
