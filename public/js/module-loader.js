/**
 * 📦 MODULE LOADER - v1.0.0
 * Sistema de carga dinámica de módulos para code splitting
 *
 * SEMANA 3 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Carga dinámica de scripts
 * - Cache de módulos cargados
 * - Dependencias automáticas
 * - Prefetch inteligente
 * - Error handling robusto
 */

(function(window) {
  'use strict';

  const ModuleLoader = {
    version: '1.0.0',

    // Cache de módulos cargados
    _loadedModules: new Map(),

    // Módulos en proceso de carga
    _loadingModules: new Map(),

    // Configuración de módulos disponibles
    _moduleConfig: {
      // Admin Dashboard
      'admin-dashboard': {
        path: '/public/js/admin-dashboard.js',
        dependencies: ['dashboard-charts', 'approvals-manager']
      },
      'dashboard-charts': {
        path: '/public/js/dashboard-charts.js',
        dependencies: []
      },
      'approvals-manager': {
        path: '/public/js/approvals-manager.js',
        dependencies: []
      },

      // Auth
      'unified-auth': {
        path: '/public/js/unified-auth-system-v2.js',
        dependencies: []
      },

      // Estudiantes
      'student-dashboard': {
        path: '/public/js/student-dashboard.js',
        dependencies: ['academic-reports']
      },
      'academic-reports': {
        path: '/public/js/academic-reports-manager.js',
        dependencies: []
      },

      // Citas
      'appointments': {
        path: '/public/js/appointments.js',
        dependencies: []
      },
      'citas-manager': {
        path: '/public/js/citas-manager.js',
        dependencies: []
      },

      // Notificaciones
      'notifications': {
        path: '/public/js/bge-notification-admin.js',
        dependencies: []
      },

      // IA
      'chatbot': {
        path: '/public/js/bge-chatbot-ia-avanzado.js',
        dependencies: []
      },

      // Utilidades
      'performance-utils': {
        path: '/public/js/performance-utils.js',
        dependencies: []
      }
    },

    /**
     * Cargar un módulo
     * @param {string} moduleName - Nombre del módulo
     * @returns {Promise<boolean>} Resultado de la carga
     */
    async load(moduleName) {
      // Si ya está cargado, retornar
      if (this._loadedModules.has(moduleName)) {
        void 0;
        return true;
      }

      // Si está en proceso de carga, esperar
      if (this._loadingModules.has(moduleName)) {
        return this._loadingModules.get(moduleName);
      }

      // Obtener configuración del módulo
      const config = this._moduleConfig[moduleName];
      if (!config) {
        console.error(`[ModuleLoader] Módulo '${moduleName}' no encontrado en configuración`);
        return false;
      }

      // Crear promesa de carga
      const loadPromise = this._loadModuleWithDependencies(moduleName, config);
      this._loadingModules.set(moduleName, loadPromise);

      try {
        await loadPromise;
        this._loadedModules.set(moduleName, true);
        this._loadingModules.delete(moduleName);
        void 0;
        return true;
      } catch (error) {
        this._loadingModules.delete(moduleName);
        console.error(`[ModuleLoader] Error cargando '${moduleName}':`, error);
        return false;
      }
    },

    /**
     * Cargar módulo con sus dependencias
     * @private
     */
    async _loadModuleWithDependencies(moduleName, config) {
      // Cargar dependencias primero
      if (config.dependencies && config.dependencies.length > 0) {
        await Promise.all(
          config.dependencies.map(dep => this.load(dep))
        );
      }

      // Cargar el módulo
      return this._loadScript(config.path);
    },

    /**
     * Cargar un script
     * @private
     */
    _loadScript(src) {
      return new Promise((resolve, reject) => {
        // Verificar si ya existe el script
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => {
          resolve();
        };

        script.onerror = () => {
          reject(new Error(`Error cargando script: ${src}`));
        };

        document.head.appendChild(script);
      });
    },

    /**
     * Cargar múltiples módulos en paralelo
     * @param {Array<string>} moduleNames - Nombres de módulos
     * @returns {Promise<boolean[]>} Resultados de carga
     */
    async loadMultiple(moduleNames) {
      return Promise.all(
        moduleNames.map(name => this.load(name))
      );
    },

    /**
     * Prefetch de módulos para carga posterior
     * @param {Array<string>} moduleNames - Nombres de módulos
     */
    prefetch(moduleNames) {
      if (!Array.isArray(moduleNames)) moduleNames = [moduleNames];

      moduleNames.forEach(name => {
        const config = this._moduleConfig[name];
        if (config) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = config.path;
          document.head.appendChild(link);
        }
      });

      void 0;
    },

    /**
     * Cargar módulo cuando sea visible
     * @param {string} moduleName - Nombre del módulo
     * @param {string} triggerSelector - Selector del elemento trigger
     */
    loadOnVisible(moduleName, triggerSelector) {
      if ('IntersectionObserver' in window) {
        const element = document.querySelector(triggerSelector);
        if (!element) return;

        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.load(moduleName);
              obs.unobserve(entry.target);
            }
          });
        }, { rootMargin: '100px' });

        observer.observe(element);
      } else {
        // Fallback: cargar inmediatamente
        this.load(moduleName);
      }
    },

    /**
     * Cargar módulo en interacción del usuario
     * @param {string} moduleName - Nombre del módulo
     * @param {string} eventSelector - Selector del elemento
     * @param {string} eventType - Tipo de evento
     */
    loadOnInteraction(moduleName, eventSelector, eventType = 'click') {
      const element = document.querySelector(eventSelector);
      if (!element) return;

      const handler = async () => {
        await this.load(moduleName);
        element.removeEventListener(eventType, handler);
      };

      element.addEventListener(eventType, handler, { once: true });
    },

    /**
     * Registrar nuevo módulo
     * @param {string} name - Nombre del módulo
     * @param {Object} config - Configuración
     */
    register(name, config) {
      this._moduleConfig[name] = config;
      void 0;
    },

    /**
     * Verificar si un módulo está cargado
     * @param {string} moduleName - Nombre del módulo
     * @returns {boolean} Estado de carga
     */
    isLoaded(moduleName) {
      return this._loadedModules.has(moduleName);
    },

    /**
     * Obtener lista de módulos cargados
     * @returns {Array<string>} Módulos cargados
     */
    getLoadedModules() {
      return Array.from(this._loadedModules.keys());
    },

    /**
     * Obtener estadísticas de carga
     * @returns {Object} Estadísticas
     */
    getStats() {
      return {
        loaded: this._loadedModules.size,
        loading: this._loadingModules.size,
        available: Object.keys(this._moduleConfig).length,
        modules: this.getLoadedModules()
      };
    },

    /**
     * Limpiar cache de módulos
     */
    clearCache() {
      this._loadedModules.clear();
      void 0;
    }
  };

  // Exponer globalmente
  window.ModuleLoader = ModuleLoader;

  void 0;

})(window);
