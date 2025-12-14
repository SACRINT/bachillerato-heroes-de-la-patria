/**
 * ✅ DATA-EVENT-EMITTER.JS
 *
 * Desacopla dependencia circular entre data-service.js y dashboard.js
 * Emite eventos en lugar de actualizar directamente
 *
 * Problema Original:
 * - dashboard.js requería data-service.js para obtener datos
 * - data-service.js requería dashboard.js para actualizar UI
 * - Circular: A → B → A
 * - Acoplamiento fuerte: cambios en data-service rompen todos los dashboards
 *
 * Solución:
 * - data-service emite eventos cuando los datos cambian
 * - dashboard escucha eventos en lugar de ser actualizado directamente
 * - Patrón Observer: Desacoplamiento completo
 *
 * Patrón: Event Emitter + Observer Pattern
 */

(function() {
  'use strict';

  /**
   * EventEmitter para datos
   * Permite que data-service emita eventos sin conocer quién escucha
   */
  const dataEventEmitter = {
    listeners: {},

    /**
     * Escuchar cambios en datos
     * @param {string} dataType - Tipo de dato (students, grades, calendar, etc)
     * @param {function} callback - Función a ejecutar cuando cambian los datos
     */
    on(dataType, callback) {
      if (!this.listeners[dataType]) {
        this.listeners[dataType] = [];
      }
      this.listeners[dataType].push(callback);
      if (typeof logger !== 'undefined') {
        logger.debug('[DATA-EMITTER]', `Listener agregado para: ${dataType}`);
      }
    },

    /**
     * data-service EMITE cuando los datos cambian
     * @param {string} dataType - Tipo de dato
     * @param {any} data - Datos nuevos
     * @param {object} metadata - Metadata (action, timestamp, etc)
     */
    emit(dataType, data, metadata = {}) {
      if (!this.listeners[dataType]) return;

      const event = {
        type: dataType,
        data: data,
        timestamp: new Date().toISOString(),
        ...metadata
      };

      this.listeners[dataType].forEach(callback => {
        try {
          callback(event);
        } catch (err) {
          if (typeof logger !== 'undefined') {
            logger.error('[DATA-EMITTER]', `Error en listener de ${dataType}:`, err);
          }
        }
      });

      if (typeof logger !== 'undefined') {
        logger.debug('[DATA-EMITTER]', `Evento emitido: ${dataType}`);
      }
    },

    /**
     * Remover listener específico
     * @param {string} dataType - Tipo de dato
     * @param {function} callback - Función a remover
     */
    off(dataType, callback) {
      if (!this.listeners[dataType]) return;
      this.listeners[dataType] = this.listeners[dataType].filter(cb => cb !== callback);
    },

    /**
     * Remover todos los listeners de un tipo
     * @param {string} dataType - Tipo de dato
     */
    removeAllListeners(dataType) {
      if (dataType) {
        delete this.listeners[dataType];
      } else {
        this.listeners = {};
      }
    },

    /**
     * Obtener información del emitter
     */
    getInfo() {
      return {
        totalDataTypes: Object.keys(this.listeners).length,
        dataTypes: Object.keys(this.listeners),
        countByType: Object.entries(this.listeners).reduce((acc, [type, cbs]) => {
          acc[type] = cbs.length;
          return acc;
        }, {})
      };
    }
  };

  /**
   * Eventos predefinidos que data-service DEBE emitir
   * Estándares para comunicación consistente
   */
  const eventTypes = {
    STUDENTS_LOADED: 'students:loaded',
    STUDENTS_UPDATED: 'students:updated',
    STUDENTS_DELETED: 'students:deleted',

    GRADES_LOADED: 'grades:loaded',
    GRADES_UPDATED: 'grades:updated',

    CALENDAR_LOADED: 'calendar:loaded',
    CALENDAR_UPDATED: 'calendar:updated',

    NOTIFICATIONS_LOADED: 'notifications:loaded',
    NOTIFICATIONS_NEW: 'notifications:new',

    ALERTS_NEW: 'alerts:new',

    DATA_ERROR: 'data:error',
    DATA_LOADING: 'data:loading'
  };

  /**
   * Helper: Emitir evento estándar desde data-service
   * @param {string} eventType - Tipo de evento (usar eventTypes)
   * @param {any} data - Datos
   */
  function emitDataEvent(eventType, data) {
    dataEventEmitter.emit(eventType, data, {
      source: 'data-service',
      action: eventType.split(':')[1]
    });
  }

  // ✅ Exponer globalmente
  window.dataEventEmitter = dataEventEmitter;
  window.dataEventTypes = eventTypes;
  window.emitDataEvent = emitDataEvent;

  // ✅ Info para debugging
  window.dataEmitterInfo = function() {
    return {
      status: 'Active',
      emitterInfo: dataEventEmitter.getInfo(),
      availableEventTypes: Object.keys(eventTypes),
      description: 'Event Emitter para desacoplar data-service de dashboard'
    };
  };

  // ✅ Log inicial
  if (typeof logger !== 'undefined') {
    logger.info('[DATA-EVENT-EMITTER]', 'Emitter inicializado y listo para usar');
  }

})();
