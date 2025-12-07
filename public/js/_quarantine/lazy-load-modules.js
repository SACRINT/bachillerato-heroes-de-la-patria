/**
 * 🚀 LAZY LOAD MODULES - SEMANA 2
 * Implementación de lazy loading dinámico para módulos JavaScript
 * Reduce bundle inicial y carga módulos on-demand
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const LAZY_MODULES = {
        // Chatbot: Solo cuando usuario hace clic en botón
        chatbot: {
            path: '/dist/js/chatbot.js',
            trigger: '#chatbot-btn, .chatbot-trigger',
            preload: false
        },

        // Dashboard personalizer: Solo en dashboard
        dashboardPersonalizer: {
            path: '/dist/js/dashboard-personalizer.js',
            trigger: '.dashboard-container',
            preload: true, // Preload porque es probable que se use
            delay: 2000 // Espera 2s después de page load
        },

        // Advanced gamification: Solo en gamification center
        gamification: {
            path: '/dist/js/advanced-gamification-system.js',
            trigger: '#gamification-center',
            preload: false
        },

        // AR Education: Solo en AR/VR lab
        arEducation: {
            path: '/dist/js/ar-education-system.js',
            trigger: '#ar-vr-container',
            preload: false
        },

        // Analytics: Lazy load después de 3s
        analytics: {
            path: '/dist/js/bge-analytics-module.js',
            trigger: 'auto',
            delay: 3000
        }
    };

    // ============================================
    // LAZY MODULE LOADER
    // ============================================

    class LazyModuleLoader {
        constructor() {
            this.loadedModules = new Set();
            this.loadingModules = new Map();
            this.init();
        }

        init() {
            console.log('[LazyLoad] Initializing lazy module loader...');

            // Registrar triggers para cada módulo
            Object.entries(LAZY_MODULES).forEach(([name, config]) => {
                if (config.trigger === 'auto') {
                    // Auto load después de delay
                    if (config.delay) {
                        setTimeout(() => this.loadModule(name), config.delay);
                    }
                } else if (config.preload && config.delay) {
                    // Preload después de delay
                    setTimeout(() => this.preloadModule(name), config.delay);
                } else {
                    // Load on trigger (click, IntersectionObserver, etc)
                    this.setupTrigger(name, config);
                }
            });

            console.log(`[LazyLoad] Registered ${Object.keys(LAZY_MODULES).length} lazy modules`);
        }

        setupTrigger(name, config) {
            const { trigger } = config;

            if (trigger.startsWith('#') || trigger.startsWith('.')) {
                // Click trigger
                document.addEventListener('click', (e) => {
                    if (e.target.matches(trigger) || e.target.closest(trigger)) {
                        e.preventDefault();
                        this.loadModule(name);
                    }
                }, true);

                // IntersectionObserver trigger (para containers)
                const element = document.querySelector(trigger);
                if (element) {
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                this.loadModule(name);
                                observer.unobserve(entry.target);
                            }
                        });
                    }, {
                        rootMargin: '50px' // Cargar 50px antes de que sea visible
                    });

                    observer.observe(element);
                }
            }
        }

        async preloadModule(name) {
            const config = LAZY_MODULES[name];
            if (!config) return;

            console.log(`[LazyLoad] Preloading module: ${name}`);

            // Usar link rel="preload" para hint al browser
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = config.path;
            document.head.appendChild(link);
        }

        async loadModule(name) {
            if (this.loadedModules.has(name)) {
                console.log(`[LazyLoad] Module already loaded: ${name}`);
                return;
            }

            if (this.loadingModules.has(name)) {
                console.log(`[LazyLoad] Module already loading: ${name}`);
                return this.loadingModules.get(name);
            }

            const config = LAZY_MODULES[name];
            if (!config) {
                console.error(`[LazyLoad] Module not found: ${name}`);
                return;
            }

            console.log(`[LazyLoad] Loading module: ${name}`);

            // Crear promise para este load
            const loadPromise = this.createModuleScript(config.path, name);
            this.loadingModules.set(name, loadPromise);

            try {
                await loadPromise;
                this.loadedModules.add(name);
                this.loadingModules.delete(name);
                console.log(`[LazyLoad] ✓ Module loaded: ${name}`);

                // Disparar evento personalizado
                document.dispatchEvent(new CustomEvent('moduleLoaded', {
                    detail: { name, path: config.path }
                }));

                return true;
            } catch (error) {
                this.loadingModules.delete(name);
                console.error(`[LazyLoad] ✗ Failed to load module: ${name}`, error);
                return false;
            }
        }

        createModuleScript(path, name) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = path;
                script.async = true;
                script.dataset.lazyModule = name;

                script.onload = () => {
                    console.log(`[LazyLoad] Script loaded: ${path}`);
                    resolve();
                };

                script.onerror = (error) => {
                    console.error(`[LazyLoad] Script error: ${path}`, error);
                    reject(new Error(`Failed to load script: ${path}`));
                };

                document.body.appendChild(script);
            });
        }

        // API pública para cargar módulos manualmente
        load(name) {
            return this.loadModule(name);
        }

        // API pública para verificar si un módulo está cargado
        isLoaded(name) {
            return this.loadedModules.has(name);
        }
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lazyModuleLoader = new LazyModuleLoader();
        });
    } else {
        window.lazyModuleLoader = new LazyModuleLoader();
    }

    // Exponer API global
    window.loadLazyModule = (name) => {
        return window.lazyModuleLoader ? window.lazyModuleLoader.load(name) : Promise.reject('Loader not initialized');
    };

})();
