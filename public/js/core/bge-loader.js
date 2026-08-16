/**
 * 🚀 BGE LOADER - CARGADOR PRINCIPAL OPTIMIZADO
 * Sistema de carga inteligente para toda la plataforma BGE
 */

class BGELoader {
    constructor() {
        this.loadQueue = [];
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.startTime = performance.now();

        this.coreModules = [
            'js/core/logger.js',
            'js/core/context-manager.js',
            'js/core/bundle-manager.js',
            'js/core/dependency-analyzer.js'
        ];

        void 0;
        this.init();
    }

    async init() {
        // 1. Cargar sistema de logging primero
        await this.loadLogger();

        // 2. Cargar módulos core
        await this.loadCoreModules();

        // 3. Inicializar sistemas
        this.initializeSystems();

        // 4. Configurar auto-optimización
        this.setupAutoOptimization();

        BGELogger?.info('BGE Loader', '✅ Sistema BGE cargado completamente', {
            loadTime: `${(performance.now() - this.startTime).toFixed(2)}ms`,
            coreModules: this.coreModules.length,
            totalModules: this.loadedModules.size
        });
    }

    // Cargar logger primero (crítico)
    async loadLogger() {
        const loggerPath = 'js/core/logger.js';

        if (!this.isModuleLoaded(loggerPath)) {
            try {
                await this.loadScript(loggerPath);
                void 0;
            } catch (error) {
                console.error('❌ Error cargando BGE Logger:', error);
            }
        }
    }

    // Cargar módulos core en orden
    async loadCoreModules() {
        for (const modulePath of this.coreModules) {
            if (!this.isModuleLoaded(modulePath)) {
                try {
                    await this.loadScript(modulePath);
                    BGELogger?.debug('BGE Loader', `✅ Módulo core cargado: ${modulePath}`);
                } catch (error) {
                    BGELogger?.error('BGE Loader', `❌ Error cargando módulo core: ${modulePath}`, error);
                }
            }
        }
    }

    // Verificar si módulo está cargado
    isModuleLoaded(modulePath) {
        // Verificar por script tag
        const scriptExists = document.querySelector(`script[src*="${modulePath.split('/').pop()}"]`);

        // Verificar por objeto global (para sistemas BGE)
        const moduleName = this.getModuleName(modulePath);
        const globalExists = window[moduleName];

        return scriptExists || globalExists || this.loadedModules.has(modulePath);
    }

    // Obtener nombre de módulo global
    getModuleName(path) {
        const moduleMap = {
            'logger.js': 'BGELogger',
            'context-manager.js': 'BGEContext',
            'bundle-manager.js': 'BGEBundleManager',
            'dependency-analyzer.js': 'BGEDependencyAnalyzer'
        };

        const filename = path.split('/').pop();
        return moduleMap[filename] || null;
    }

    // Cargar script individual
    loadScript(src) {
        // Evitar cargas duplicadas
        if (this.loadingPromises.has(src)) {
            return this.loadingPromises.get(src);
        }

        const promise = new Promise((resolve, reject) => {
            // Verificar si ya existe
            const existing = document.querySelector(`script[src="${src}"], script[src*="${src.split('/').pop()}"]`);
            if (existing) {
                this.loadedModules.add(src);
                resolve(src);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => {
                this.loadedModules.add(src);
                this.loadingPromises.delete(src);
                resolve(src);
            };

            script.onerror = () => {
                this.loadingPromises.delete(src);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });

        this.loadingPromises.set(src, promise);
        return promise;
    }

    // Inicializar sistemas
    initializeSystems() {
        // Registrar loader en el contexto
        if (window.BGEContext) {
            window.BGEContext.registerModule('bge-loader', this, []);
        }

        // Configurar integración entre sistemas
        this.setupSystemIntegration();

        BGELogger?.info('BGE Loader', '🔧 Sistemas inicializados y configurados');
    }

    // Configurar integración entre sistemas
    setupSystemIntegration() {
        // Conectar Bundle Manager con Context Manager
        if (window.BGEBundleManager && window.BGEContext) {
            window.BGEBundleManager.contextManager = window.BGEContext;
        }

        // Conectar Dependency Analyzer con Bundle Manager
        if (window.BGEDependencyAnalyzer && window.BGEBundleManager) {
            window.BGEDependencyAnalyzer.bundleManager = window.BGEBundleManager;
        }

        // Configurar logging global
        if (window.BGELogger) {
            this.setupGlobalLogging();
        }
    }

    // Configurar logging global
    setupGlobalLogging() {
        // Interceptar errores globales no capturados
        window.addEventListener('error', (event) => {
            BGELogger?.error('Global Error', 'Error JavaScript no capturado', {
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });

        // Interceptar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            BGELogger?.error('Global Error', 'Promesa rechazada no manejada', {
                reason: event.reason,
                promise: event.promise
            });
        });

        BGELogger?.debug('BGE Loader', '🔧 Logging global configurado');
    }

    // Configurar auto-optimización
    setupAutoOptimization() {
        // Ejecutar análisis después de carga completa
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.runOptimizationAnalysis();
            }, 2000);
        });

        // Ejecutar optimización en idle time
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                this.runBackgroundOptimization();
            });
        }
    }

    // Ejecutar análisis de optimización
    runOptimizationAnalysis() {
        BGELogger?.info('BGE Loader', '🔍 Ejecutando análisis de optimización...');

        // Generar reporte de dependency analyzer
        if (window.BGEDependencyAnalyzer) {
            const report = window.BGEDependencyAnalyzer.generateDetailedReport();

            // Mostrar recomendaciones importantes
            if (report.recommendations.length > 0) {
                BGELogger?.warn('BGE Loader', `📋 ${report.recommendations.length} recomendaciones de optimización disponibles`);
            }
        }

        // Generar estadísticas de bundle manager
        if (window.BGEBundleManager) {
            const stats = window.BGEBundleManager.getStats();
            BGELogger?.info('BGE Loader', '📊 Estadísticas de Bundle Manager', stats);
        }

        // Generar reporte de contexto
        if (window.BGEContext) {
            const statusReport = window.BGEContext.generateStatusReport();
            BGELogger?.info('BGE Loader', '📋 Reporte de estado del sistema', statusReport);
        }
    }

    // Ejecutar optimización en background
    runBackgroundOptimization() {
        BGELogger?.debug('BGE Loader', '⚡ Ejecutando optimización en background...');

        // Limpiar módulos obsoletos
        if (window.BGEDependencyAnalyzer) {
            window.BGEDependencyAnalyzer.performAutomaticOptimization();
        }

        // Optimizar bundles
        if (window.BGEBundleManager) {
            window.BGEBundleManager.optimize();
        }
    }

    // Cargar módulo bajo demanda
    async loadModuleOnDemand(modulePath, trigger = 'manual') {
        BGELogger?.info('BGE Loader', `🎯 Cargando módulo bajo demanda: ${modulePath}`, { trigger });

        try {
            await this.loadScript(modulePath);
            return true;
        } catch (error) {
            BGELogger?.error('BGE Loader', `❌ Error cargando módulo: ${modulePath}`, error);
            return false;
        }
    }

    // Precargar módulos probables
    async preloadLikelyModules() {
        const likelyModules = [
            'js/dashboard-manager-2025.js',
            'js/ai-educational-system.js',
            'js/chatbot.js',
            'js/notification-manager.js'
        ];

        BGELogger?.info('BGE Loader', '⏳ Precargando módulos probables...', { modules: likelyModules });

        const loadPromises = likelyModules.map(module =>
            this.loadModuleOnDemand(module, 'preload').catch(() => null)
        );

        await Promise.allSettled(loadPromises);
    }

    // Obtener estadísticas de carga
    getLoadingStats() {
        return {
            startTime: this.startTime,
            totalLoadTime: performance.now() - this.startTime,
            loadedModules: this.loadedModules.size,
            coreModulesLoaded: this.coreModules.filter(m => this.isModuleLoaded(m)).length,
            pendingLoads: this.loadingPromises.size,
            modulesList: Array.from(this.loadedModules)
        };
    }
}

// Inicialización inmediata
window.BGELoader = new BGELoader();

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGELoader;
}

void 0;