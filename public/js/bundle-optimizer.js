/**
 * 🚀 BUNDLE OPTIMIZER - SISTEMA DE OPTIMIZACIÓN BGE
 * Optimizador automático de archivos JavaScript
 */

class BGEBundleOptimizer {
    constructor() {
        this.modules = new Map();
        this.loadOrder = [];
        this.loadedFiles = new Set();
        this.criticalModules = [
            'js/core/logger.js',
            'js/performance-monitor.js',
            'js/security-manager.js',
            'js/auth-interface.js'
        ];

        this.init();
    }

    init() {
        BGELogger?.info('Bundle Optimizer', '🚀 Inicializando optimización de archivos...');

        // Interceptar carga de scripts para optimización
        this.interceptScriptLoading();

        // Analizar módulos cargados
        this.analyzeLoadedModules();
    }

    // Interceptar carga de scripts
    interceptScriptLoading() {
        const originalAppendChild = Element.prototype.appendChild;

        Element.prototype.appendChild = function(newChild) {
            if (newChild.tagName === 'SCRIPT' && newChild.src) {
                BGELogger?.debug('Bundle Optimizer', `📥 Script interceptado: ${newChild.src}`);

                // Verificar si ya está cargado
                if (window.BGEBundleOptimizer.loadedFiles.has(newChild.src)) {
                    BGELogger?.warn('Bundle Optimizer', `♻️ Script ya cargado: ${newChild.src}`);
                    return newChild;
                }

                window.BGEBundleOptimizer.loadedFiles.add(newChild.src);
            }

            return originalAppendChild.call(this, newChild);
        };
    }

    // Analizar módulos ya cargados
    analyzeLoadedModules() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (script.src.includes('.js')) {
                this.loadedFiles.add(script.src);
                BGELogger?.debug('Bundle Optimizer', `📋 Módulo detectado: ${script.src}`);
            }
        });
    }

    // Optimizar carga de bundles
    async optimizeLoading() {
        BGELogger?.info('Bundle Optimizer', '⚡ Iniciando optimización de carga...');

        // 1. Cargar módulos críticos primero
        await this.loadCriticalModules();

        // 2. Cargar módulos por demanda
        this.setupLazyLoading();

        // 3. Precargar módulos probables
        this.preloadProbableModules();

        BGELogger?.info('Bundle Optimizer', '✅ Optimización de carga completada');
    }

    // Cargar módulos críticos
    async loadCriticalModules() {
        for (const module of this.criticalModules) {
            if (!this.isModuleLoaded(module)) {
                try {
                    await this.loadModule(module, { priority: 'high' });
                    BGELogger?.info('Bundle Optimizer', `✅ Módulo crítico cargado: ${module}`);
                } catch (error) {
                    BGELogger?.error('Bundle Optimizer', `❌ Error cargando módulo crítico: ${module}`, error);
                }
            }
        }
    }

    // Verificar si módulo está cargado
    isModuleLoaded(modulePath) {
        const normalizedPath = this.normalizePath(modulePath);
        return Array.from(this.loadedFiles).some(file =>
            file.includes(normalizedPath) || file.endsWith(normalizedPath)
        );
    }

    // Normalizar ruta de módulo
    normalizePath(path) {
        return path.replace(/^.*\//, '').replace('.js', '');
    }

    // Cargar módulo individual
    loadModule(src, options = {}) {
        return new Promise((resolve, reject) => {
            if (this.isModuleLoaded(src)) {
                resolve(src);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false;

            if (options.priority === 'high') {
                script.setAttribute('fetchpriority', 'high');
            }

            script.onload = () => {
                this.loadedFiles.add(src);
                BGELogger?.debug('Bundle Optimizer', `📜 Módulo cargado: ${src}`);
                resolve(src);
            };

            script.onerror = () => {
                BGELogger?.error('Bundle Optimizer', `❌ Error cargando: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    // Configurar lazy loading
    setupLazyLoading() {
        // AI Modules - cargar cuando se acceda a funciones IA
        this.setupConditionalLoading('ai', [
            'js/ai-educational-system.js',
            'js/ai-tutor-interface.js',
            'js/ai-recommendation-engine.js',
            'js/chatbot.js'
        ]);

        // Dashboard modules - cargar cuando se acceda al dashboard
        this.setupConditionalLoading('dashboard', [
            'js/dashboard-manager-2025.js',
            'js/dashboard-personalizer.js',
            'js/ai-progress-dashboard.js'
        ]);

        // AR/VR modules - cargar cuando se active AR
        this.setupConditionalLoading('ar', [
            'js/ar-education-system.js',
            'js/virtual-labs-system.js',
            'js/lab-simulator-3d.js'
        ]);
    }

    // Configurar carga condicional
    setupConditionalLoading(category, modules) {
        const loadCategory = () => {
            BGELogger?.info('Bundle Optimizer', `🎯 Cargando categoría: ${category}`);
            modules.forEach(module => {
                if (!this.isModuleLoaded(module)) {
                    this.loadModule(module).catch(err =>
                        BGELogger?.warn('Bundle Optimizer', `Fallo cargando ${module}`, err)
                    );
                }
            });
        };

        // Configurar triggers según categoría
        switch (category) {
            case 'ai':
                this.addTriggers(['[data-ai]', '.ai-trigger', '#chatbot-toggle'], loadCategory);
                break;
            case 'dashboard':
                this.addTriggers(['[href*="dashboard"]', '.dashboard-trigger'], loadCategory);
                break;
            case 'ar':
                this.addTriggers(['[data-ar]', '.ar-trigger'], loadCategory);
                break;
        }
    }

    // Agregar triggers para carga automática
    addTriggers(selectors, callback) {
        selectors.forEach(selector => {
            document.addEventListener('click', (e) => {
                if (e.target.matches(selector) || e.target.closest(selector)) {
                    callback();
                }
            });
        });
    }

    // Precargar módulos probables
    preloadProbableModules() {
        const probableModules = [
            'js/notification-manager.js',
            'js/theme-manager.js',
            'js/image-optimizer.js'
        ];

        // Precargar en idle time
        if (window.requestIdleCallback) {
            window.requestIdleCallback(() => {
                probableModules.forEach(module => {
                    if (!this.isModuleLoaded(module)) {
                        this.loadModule(module, { priority: 'low' });
                    }
                });
            });
        }
    }

    // Estadísticas de optimización
    getOptimizationStats() {
        return {
            totalModules: this.loadedFiles.size,
            criticalModules: this.criticalModules.length,
            loadedCritical: this.criticalModules.filter(m => this.isModuleLoaded(m)).length,
            loadOrder: this.loadOrder,
            performance: this.getPerformanceMetrics()
        };
    }

    // Métricas de rendimiento
    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
            totalLoadTime: navigation?.loadEventEnd - navigation?.fetchStart
        };
    }

    // Crear reporte de optimización
    generateOptimizationReport() {
        const stats = this.getOptimizationStats();

        BGELogger?.info('Bundle Optimizer', '📊 REPORTE DE OPTIMIZACIÓN', {
            'Módulos Totales': stats.totalModules,
            'Módulos Críticos Cargados': `${stats.loadedCritical}/${stats.criticalModules}`,
            'Tiempo DOMContentLoaded': `${stats.performance.domContentLoaded}ms`,
            'Tiempo Load Completo': `${stats.performance.loadComplete}ms`,
            'Tiempo Total': `${stats.performance.totalLoadTime}ms`
        });

        return stats;
    }

    // Limpiar módulos no utilizados
    cleanupUnusedModules() {
        const unusedSelectors = [
            'script[src*="OLD-BACKUP"]',
            'script[src*=".backup"]',
            'script[src*="deprecated"]'
        ];

        unusedSelectors.forEach(selector => {
            const scripts = document.querySelectorAll(selector);
            scripts.forEach(script => {
                BGELogger?.warn('Bundle Optimizer', `🗑️ Removiendo script obsoleto: ${script.src}`);
                script.remove();
            });
        });
    }
}

// Inicialización global
window.BGEBundleOptimizer = new BGEBundleOptimizer();

// Auto-optimización al cargar
document.addEventListener('DOMContentLoaded', () => {
    window.BGEBundleOptimizer.optimizeLoading();
    window.BGEBundleOptimizer.cleanupUnusedModules();
});

// Generar reporte después de carga completa
window.addEventListener('load', () => {
    setTimeout(() => {
        window.BGEBundleOptimizer.generateOptimizationReport();
    }, 1000);
});

void 0;