/**
 * ✅ AUTH-CONTEXT-BRIDGE.JS
 *
 * Desacopla dependencia circular entre auth.js y context-manager.js
 * Comunica cambios de auth a través de eventos en lugar de imports
 *
 * Problema Original:
 * - context-manager.js requería auth.js para estado del usuario
 * - auth.js requería context-manager.js para guardar contexto
 * - Circular: A → B → A
 *
 * Solución:
 * - auth.js dispara eventos cuando cambia el estado
 * - context-manager escucha eventos en lugar de importar auth
 * - Bridge desacopla ambos módulos completamente
 *
 * Patrón: Event Emitter + Observer Pattern
 */

(function() {
  'use strict';

  /**
   * EventBus centralizado para comunicación auth ↔ context
   * Sin dependencias circulares
   */
  const authContextEventBus = {
    listeners: {},

    /**
     * Escuchar un evento
     * @param {string} event - Nombre del evento
     * @param {function} callback - Función a ejecutar
     */
    on(event, callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
      if (typeof logger !== 'undefined') {
        logger.debug('[AUTH-CONTEXT-BUS]', `Listener agregado: ${event}`);
      }
    },

    /**
     * Emitir un evento
     * @param {string} event - Nombre del evento
     * @param {any} data - Datos a pasar
     */
    emit(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(callback => callback(data));
      if (typeof logger !== 'undefined') {
        logger.debug('[AUTH-CONTEXT-BUS]', `Evento emitido: ${event}`);
      }
    },

    /**
     * Remover listener
     * @param {string} event - Nombre del evento
     * @param {function} callback - Función a remover
     */
    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Info del bus
     */
    getInfo() {
      return {
        totalListeners: Object.keys(this.listeners).length,
        events: Object.keys(this.listeners),
        countByEvent: Object.entries(this.listeners).reduce((acc, [event, cbs]) => {
          acc[event] = cbs.length;
          return acc;
        }, {})
      };
    }
  };

  /**
   * Handler: Cuando auth se carga
   * Escuchar cambios de estado del usuario
   */
  function setupAuthListeners() {
    // Evento: Usuario autenticado
    if (window.auth && window.auth.onUserAuthenticated) {
      window.auth.onUserAuthenticated(function(user) {
        authContextEventBus.emit('auth:user-authenticated', user);
      });
    }

    // Evento: Usuario cerró sesión
    if (window.auth && window.auth.onUserLoggedOut) {
      window.auth.onUserLoggedOut(function() {
        authContextEventBus.emit('auth:user-logged-out', null);
      });
    }

    // Evento: Token refrescado
    if (window.auth && window.auth.onTokenRefreshed) {
      window.auth.onTokenRefreshed(function(newToken) {
        authContextEventBus.emit('auth:token-refreshed', newToken);
      });
    }

    if (typeof logger !== 'undefined') {
      logger.info('[AUTH-CONTEXT-BRIDGE]', 'Auth listeners configurados');
    }
  }

  /**
   * Handler: Cuando context-manager se carga
   * Escuchar eventos de auth
   */
  function setupContextListeners() {
    // Context escucha cambios de auth
    authContextEventBus.on('auth:user-authenticated', function(user) {
      if (window.contextManager && window.contextManager.setCurrentUser) {
        window.contextManager.setCurrentUser(user);
      }
    });

    authContextEventBus.on('auth:user-logged-out', function() {
      if (window.contextManager && window.contextManager.clearContext) {
        window.contextManager.clearContext();
      }
    });

    authContextEventBus.on('auth:token-refreshed', function(newToken) {
      if (window.contextManager && window.contextManager.updateAuthToken) {
        window.contextManager.updateAuthToken(newToken);
      }
    });

    if (typeof logger !== 'undefined') {
      logger.info('[AUTH-CONTEXT-BRIDGE]', 'Context listeners configurados');
    }
  }

  /**
   * Inicializar el bridge
   */
  function initializeBridge() {
    // Esperar a que ambos módulos se carguen
    if (!window.auth && !window.contextManager) {
      setTimeout(initializeBridge, 100);
      return;
    }

    // Configurar listeners
    setupAuthListeners();
    setupContextListeners();

    if (typeof logger !== 'undefined') {
      logger.info('[AUTH-CONTEXT-BRIDGE]', 'Bridge auth ↔ context establecido');
    }
  }

  // ✅ Iniciar cuando DOM está listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBridge);
  } else {
    initializeBridge();
  }

  // ✅ Exponer EventBus globalmente para debugging
  window.authContextEventBus = authContextEventBus;

  // ✅ Función para inicializar manualmente
  window.initAuthContextBridge = initializeBridge;

  // ✅ Info del bridge
  window.authContextBridgeInfo = function() {
    return {
      busStatus: 'Active',
      totalListeners: authContextEventBus.listeners ? Object.keys(authContextEventBus.listeners).length : 0,
      eventBusInfo: authContextEventBus.getInfo(),
      authAvailable: typeof window.auth === 'object',
      contextAvailable: typeof window.contextManager === 'object',
      description: 'Bridge para desacoplar auth.js de context-manager.js'
    };
  };

})();
