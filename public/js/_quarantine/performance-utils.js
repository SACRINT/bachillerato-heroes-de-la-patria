/**
 * 🚀 PERFORMANCE UTILITIES - v1.0.0
 * Utilidades de optimización de rendimiento para frontend
 *
 * SEMANA 3 - Plan 24 Semanas
 * Fecha: 19 Noviembre 2025
 *
 * Features:
 * - Lazy Loading de imágenes y componentes
 * - Debounce y Throttle
 * - Virtual Scrolling
 * - Prefetch y Preload
 * - Memory Management
 * - Performance Monitoring
 */

(function(window) {
  'use strict';

  const PerformanceUtils = {
    version: '1.0.0',

    // ==================== LAZY LOADING ====================

    /**
     * Configurar Lazy Loading para imágenes
     * @param {string} selector - Selector de imágenes
     * @param {Object} options - Opciones del observer
     */
    lazyLoadImages(selector = 'img[data-src]', options = {}) {
      const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
      };

      const config = { ...defaultOptions, ...options };

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this._loadImage(img);
              obs.unobserve(img);
            }
          });
        }, config);

        document.querySelectorAll(selector).forEach(img => {
          observer.observe(img);
        });

        console.log(`[PerformanceUtils] Lazy loading configurado para ${document.querySelectorAll(selector).length} imágenes`);
      } else {
        // Fallback para navegadores sin soporte
        document.querySelectorAll(selector).forEach(img => {
          this._loadImage(img);
        });
      }
    },

    /**
     * Cargar imagen
     * @private
     */
    _loadImage(img) {
      const src = img.getAttribute('data-src');
      const srcset = img.getAttribute('data-srcset');

      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }

      if (srcset) {
        img.srcset = srcset;
        img.removeAttribute('data-srcset');
      }

      img.classList.add('loaded');
    },

    /**
     * Lazy Load de componentes
     * @param {string} selector - Selector de elementos
     * @param {Function} loadCallback - Función de carga
     */
    lazyLoadComponents(selector, loadCallback) {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              loadCallback(entry.target);
              obs.unobserve(entry.target);
            }
          });
        }, { rootMargin: '100px' });

        document.querySelectorAll(selector).forEach(el => {
          observer.observe(el);
        });
      } else {
        document.querySelectorAll(selector).forEach(el => {
          loadCallback(el);
        });
      }
    },

    // ==================== DEBOUNCE & THROTTLE ====================

    /**
     * Debounce - Ejecuta función después de que el usuario deje de interactuar
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @param {boolean} immediate - Ejecutar inmediatamente
     * @returns {Function} Función debounced
     */
    debounce(func, wait = 300, immediate = false) {
      let timeout;

      return function executedFunction(...args) {
        const context = this;

        const later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
      };
    },

    /**
     * Throttle - Ejecuta función máximo una vez por período
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite en ms
     * @returns {Function} Función throttled
     */
    throttle(func, limit = 100) {
      let inThrottle;

      return function executedFunction(...args) {
        const context = this;

        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;

          setTimeout(() => {
            inThrottle = false;
          }, limit);
        }
      };
    },

    // ==================== VIRTUAL SCROLLING ====================

    /**
     * Virtual Scroll para listas grandes
     * @param {Object} options - Configuración
     * @returns {Object} Instancia de VirtualScroll
     */
    createVirtualScroll(options) {
      const {
        container,
        itemHeight,
        totalItems,
        renderItem,
        buffer = 5
      } = options;

      const containerEl = typeof container === 'string'
        ? document.querySelector(container)
        : container;

      if (!containerEl) {
        console.error('[VirtualScroll] Container no encontrado');
        return null;
      }

      const state = {
        scrollTop: 0,
        visibleCount: 0,
        startIndex: 0,
        endIndex: 0
      };

      // Contenedor interno para el contenido virtual
      const content = document.createElement('div');
      content.style.position = 'relative';
      content.style.height = `${totalItems * itemHeight}px`;
      containerEl.appendChild(content);

      // Calcular elementos visibles
      const calculateVisible = () => {
        const containerHeight = containerEl.clientHeight;
        state.visibleCount = Math.ceil(containerHeight / itemHeight) + buffer * 2;
        state.startIndex = Math.max(0, Math.floor(state.scrollTop / itemHeight) - buffer);
        state.endIndex = Math.min(totalItems, state.startIndex + state.visibleCount);
      };

      // Renderizar elementos visibles
      const render = () => {
        calculateVisible();

        // Limpiar contenido anterior
        content.innerHTML = '';

        // Renderizar solo elementos visibles
        for (let i = state.startIndex; i < state.endIndex; i++) {
          const item = renderItem(i);
          if (item) {
            item.style.position = 'absolute';
            item.style.top = `${i * itemHeight}px`;
            item.style.width = '100%';
            content.appendChild(item);
          }
        }
      };

      // Event listener de scroll
      const onScroll = this.throttle(() => {
        state.scrollTop = containerEl.scrollTop;
        render();
      }, 16); // ~60fps

      containerEl.addEventListener('scroll', onScroll);

      // Render inicial
      render();

      // API pública
      return {
        render,
        destroy: () => {
          containerEl.removeEventListener('scroll', onScroll);
          content.remove();
        },
        scrollToIndex: (index) => {
          containerEl.scrollTop = index * itemHeight;
        },
        refresh: (newTotalItems) => {
          content.style.height = `${newTotalItems * itemHeight}px`;
          render();
        }
      };
    },

    // ==================== PREFETCH & PRELOAD ====================

    /**
     * Prefetch de recursos
     * @param {Array} urls - URLs a prefetch
     */
    prefetch(urls) {
      if (!Array.isArray(urls)) urls = [urls];

      urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
      });

      console.log(`[PerformanceUtils] Prefetch configurado para ${urls.length} recursos`);
    },

    /**
     * Preload de recursos críticos
     * @param {Array} resources - Recursos a preload
     */
    preload(resources) {
      if (!Array.isArray(resources)) resources = [resources];

      resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.url;
        link.as = resource.type || 'fetch';

        if (resource.crossOrigin) {
          link.crossOrigin = resource.crossOrigin;
        }

        document.head.appendChild(link);
      });
    },

    /**
     * Preconnect a dominios externos
     * @param {Array} domains - Dominios para preconnect
     */
    preconnect(domains) {
      if (!Array.isArray(domains)) domains = [domains];

      domains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = '';
        document.head.appendChild(link);
      });
    },

    // ==================== MEMORY MANAGEMENT ====================

    /**
     * Limpiar event listeners de un elemento
     * @param {Element} element - Elemento a limpiar
     */
    cleanupElement(element) {
      const clone = element.cloneNode(true);
      element.parentNode.replaceChild(clone, element);
      return clone;
    },

    /**
     * Detectar memory leaks potenciales
     * @returns {Object} Información de memoria
     */
    getMemoryInfo() {
      if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        return {
          usedJSHeapSize: this._formatBytes(memory.usedJSHeapSize),
          totalJSHeapSize: this._formatBytes(memory.totalJSHeapSize),
          jsHeapSizeLimit: this._formatBytes(memory.jsHeapSizeLimit),
          usage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
        };
      }
      return null;
    },

    /**
     * Formatear bytes a unidades legibles
     * @private
     */
    _formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // ==================== PERFORMANCE MONITORING ====================

    /**
     * Medir tiempo de ejecución de una función
     * @param {Function} func - Función a medir
     * @param {string} label - Etiqueta para el log
     * @returns {*} Resultado de la función
     */
    measureTime(func, label = 'Operation') {
      const start = performance.now();
      const result = func();
      const end = performance.now();

      console.log(`[PerformanceUtils] ${label}: ${(end - start).toFixed(2)}ms`);

      return result;
    },

    /**
     * Medir tiempo de ejecución de función async
     * @param {Function} asyncFunc - Función async a medir
     * @param {string} label - Etiqueta para el log
     * @returns {Promise<*>} Resultado de la función
     */
    async measureTimeAsync(asyncFunc, label = 'Async Operation') {
      const start = performance.now();
      const result = await asyncFunc();
      const end = performance.now();

      console.log(`[PerformanceUtils] ${label}: ${(end - start).toFixed(2)}ms`);

      return result;
    },

    /**
     * Obtener métricas de Web Vitals
     * @returns {Object} Métricas
     */
    getWebVitals() {
      const vitals = {};

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) vitals.FCP = fcp.startTime.toFixed(2) + 'ms';

      // Time to First Byte
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        vitals.TTFB = nav.responseStart.toFixed(2) + 'ms';
        vitals.DOMContentLoaded = nav.domContentLoadedEventEnd.toFixed(2) + 'ms';
        vitals.Load = nav.loadEventEnd.toFixed(2) + 'ms';
      }

      // DOM Elements count
      vitals.DOMElements = document.getElementsByTagName('*').length;

      return vitals;
    },

    /**
     * Log de métricas de rendimiento
     */
    logPerformanceMetrics() {
      console.group('[PerformanceUtils] Performance Metrics');
      console.table(this.getWebVitals());

      const memory = this.getMemoryInfo();
      if (memory) {
        console.log('Memory Usage:', memory);
      }

      console.groupEnd();
    },

    // ==================== REQUEST IDLE CALLBACK ====================

    /**
     * Ejecutar tarea cuando el navegador esté idle
     * @param {Function} callback - Función a ejecutar
     * @param {Object} options - Opciones
     */
    runWhenIdle(callback, options = { timeout: 1000 }) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, options);
      } else {
        setTimeout(callback, 0);
      }
    },

    /**
     * Dividir trabajo pesado en chunks
     * @param {Array} items - Items a procesar
     * @param {Function} processItem - Función para procesar cada item
     * @param {number} chunkSize - Tamaño del chunk
     * @returns {Promise} Promesa que resuelve cuando termina
     */
    processInChunks(items, processItem, chunkSize = 100) {
      return new Promise((resolve) => {
        let index = 0;

        const processChunk = () => {
          const endIndex = Math.min(index + chunkSize, items.length);

          while (index < endIndex) {
            processItem(items[index], index);
            index++;
          }

          if (index < items.length) {
            requestAnimationFrame(processChunk);
          } else {
            resolve();
          }
        };

        processChunk();
      });
    },

    // ==================== INITIALIZATION ====================

    /**
     * Inicializar optimizaciones automáticas
     * @param {Object} options - Configuración
     */
    init(options = {}) {
      const {
        lazyImages = true,
        preconnectDomains = [],
        logMetrics = false
      } = options;

      // Lazy load de imágenes
      if (lazyImages) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            this.lazyLoadImages();
          });
        } else {
          this.lazyLoadImages();
        }
      }

      // Preconnect a dominios comunes
      if (preconnectDomains.length > 0) {
        this.preconnect(preconnectDomains);
      }

      // Log de métricas al cargar
      if (logMetrics) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            this.logPerformanceMetrics();
          }, 0);
        });
      }

      console.log('[PerformanceUtils] Inicializado v' + this.version);
    }
  };

  // Exponer globalmente
  window.PerformanceUtils = PerformanceUtils;

  // Auto-inicializar si existe configuración
  if (window.BGE_PERFORMANCE_CONFIG) {
    PerformanceUtils.init(window.BGE_PERFORMANCE_CONFIG);
  }

})(window);
