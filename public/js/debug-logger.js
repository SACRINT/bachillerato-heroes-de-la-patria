/**
 * Debug Logger - Logging condicional para desarrollo
 * Solo loguea si DEBUG_MODE está activado
 */

const debugLog = {
  /**
   * @param {string} tag - Prefijo del log (ej: 'AUTH', 'API', 'FORM')
   * @param {string} message - Mensaje
   * @param {any} data - Datos adicionales (opcional)
   */
  log: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #0066cc; font-weight: bold;',
      data || ''
    );
  },

  warn: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.warn(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #ff9900; font-weight: bold;',
      data || ''
    );
  },

  error: (tag, message, data = null) => {
    if (typeof window === 'undefined' || !window.DEBUG_MODE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.error(
      `%c[${timestamp}] [${tag}] ${message}`,
      'color: #ff3333; font-weight: bold;',
      data || ''
    );
  }
};

// Exportar para Node.js si aplica
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugLog };
}
