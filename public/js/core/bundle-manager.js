/**
 * 📦 BUNDLE MANAGER - SISTEMA DE OPTIMIZACIÓN BGE
 * Consolidador inteligente de módulos JavaScript
 */

class BGEBundleManager {
    constructor() {
        this.modules = new Map();
        this.loadedBundles = new Set();
        this.dependencyGraph = new Map();
        this.criticalModules = [
            'logger',
            'context-manager',
            'auth-interface',
            'performance-monitor'
        ];

        void 0;
    }

    // Registrar módulo para bundling inteligente
    registerModule(name, module, dependencies = [], priority = 'normal') {
        this.modules.set(name, {
            module,
            dependencies,
            priority,
            loaded: false,
            size: this.estimateSize(module)
        });

        this.dependencyGraph.set(name, dependencies);
        BGELogger?.debug('Bundle Manager', `📋 Módulo registrado: ${name}`, {
            dependencies,
            priority,
            size: this.estimateSize(module)
        });
    }

    // Cargar bundle por demanda
    async loadBundle(bundleName, options = {}) {
        if (this.loadedBundles.has(bundleName)) {
            BGELogger?.debug('Bundle Manager', `♻️ Bundle ya cargado: ${bundleName}`);
            return true;
        }

        const timer = BGELogger?.startTimer(`Bundle Load: ${bundleName}`);

        try {
            // Verificar dependencias
            await this.loadDependencies(bundleName);

            // Cargar bundle específico
            const success = await this.loadModuleBundle(bundleName, options);

            if (success) {
                this.loadedBundles.add(bundleName);
                BGELogger?.info('Bundle Manager', `✅ Bundle cargado: ${bundleName}`);
            }

            timer?.end();
            return success;

        } catch (error) {
            BGELogger?.error('Bundle Manager', `❌ Error cargando bundle: ${bundleName}`, error);
            timer?.end();
            return false;
        }
    }

    // Cargar dependencias recursivamente
    async loadDependencies(moduleName) {
        const dependencies = this.dependencyGraph.get(moduleName) || [];

        for (const dep of dependencies) {
            if (!this.loadedBundles.has(dep)) {
                await this.loadBundle(dep);
            }
        }
    }

    // Cargar bundle específico
    async loadModuleBundle(bundleName, options) {
        const bundleMap = {
            // Bundles críticos
            'core': [
                'js/core/logger.js',
                'js/context-manager.js',
                'js/performance-monitor.js'
            ],

            // Bundle de autenticación
            'auth': [
                'js/auth-interface.js',
                'js/google-auth-integration.js',
                'js/admin-auth.js'
            ],

            // Bundle de dashboard
            'dashboard': [
                'js/dashboard-manager-2025.js',
                'js/dashboard-personalizer.js',
                'js/ai-progress-dashboard.js'
            ],

            // Bundle de IA
            'ai': [
                'js/ai-educational-system.js',
                'js/ai-tutor-interface.js',
                'js/chatbot.js',
                'js/ai-recommendation-engine.js'
            ],

            // Bundle de gamificación
            'gamification': [
                'js/advanced-gamification-system.js',
                'js/achievement-system.js',
                'js/competitions-system.js'
            ],

            // Bundle AR/VR
            'ar-vr': [
                'js/ar-education-system.js',
                'js/virtual-labs-system.js',
                'js/lab-simulator-3d.js'
            ],

            // Bundle de utilidades
            'utils': [
                'js/notification-manager.js',
                'js/theme-manager.js',
                'js/image-optimizer.js',
                'js/download-center.js'
            ]
        };

        const scripts = bundleMap[bundleName];
        if (!scripts) {
            BGELogger?.warn('Bundle Manager', `Bundle desconocido: ${bundleName}`);
            return false;
        }

        // Cargar scripts del bundle
        const loadPromises = scripts.map(script => this.loadScript(script, options));
        const results = await Promise.allSettled(loadPromises);

        // Verificar resultados
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            BGELogger?.warn('Bundle Manager', `Fallos en bundle ${bundleName}`, {
                failures: failures.map(f => f.reason)
            });
        }

        return failures.length === 0;
    }

    // Cargar script individual
    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve(src);
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false;
            script.defer = options.defer === true;

            script.onload = () => {
                BGELogger?.debug('Bundle Manager', `📜 Script cargado: ${src}`);
                resolve(src);
            };

            script.onerror = () => {
                BGELogger?.error('Bundle Manager', `❌ Error cargando script: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    // Precargar bundles críticos
    async preloadCritical() {
        BGELogger?.info('Bundle Manager', '⚡ Precargando bundles críticos...');

        const criticalBundles = ['core', 'auth'];
        const loadPromises = criticalBundles.map(bundle => this.loadBundle(bundle));

        await Promise.allSettled(loadPromises);
        BGELogger?.info('Bundle Manager', '✅ Bundles críticos precargados');
    }

    // Cargar bundle cuando sea necesario (lazy loading)
    lazyLoad(bundleName, trigger = 'interaction') {
        if (this.loadedBundles.has(bundleName)) return;

        const loadBundle = () => {
            BGELogger?.info('Bundle Manager', `🎯 Lazy loading activado: ${bundleName}`);
            this.loadBundle(bundleName);
        };

        switch (trigger) {
            case 'interaction':
                // Cargar en primera interacción del usuario
                const events = ['click', 'scroll', 'keydown', 'touchstart'];
                const handler = () => {
                    loadBundle();
                    events.forEach(event =>
                        document.removeEventListener(event, handler, { passive: true })
                    );
                };
                events.forEach(event =>
                    document.addEventListener(event, handler, { passive: true, once: true })
                );
                break;

            case 'idle':
                // Cargar cuando el navegador esté inactivo
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(loadBundle);
                } else {
                    setTimeout(loadBundle, 100);
                }
                break;

            case 'visible':
                // Cargar cuando el elemento sea visible
                const observer = new IntersectionObserver(entries => {
                    if (entries[0].isIntersecting) {
                        loadBundle();
                        observer.disconnect();
                    }
                });
                // Observar el body como fallback
                observer.observe(document.body);
                break;
        }
    }

    // Estimador de tamaño de módulo
    estimateSize(module) {
        if (typeof module === 'string') {
            return module.length;
        }
        if (typeof module === 'function') {
            return module.toString().length;
        }
        return JSON.stringify(module).length;
    }

    // Estadísticas de bundles
    getStats() {
        return {
            totalModules: this.modules.size,
            loadedBundles: this.loadedBundles.size,
            bundlesList: Array.from(this.loadedBundles),
            dependencyGraph: Object.fromEntries(this.dependencyGraph)
        };
    }

    // Optimización automática
    async optimize() {
        BGELogger?.info('Bundle Manager', '🔧 Iniciando optimización automática...');

        // Precargar críticos
        await this.preloadCritical();

        // Configurar lazy loading para bundles grandes
        this.lazyLoad('ai', 'interaction');
        this.lazyLoad('ar-vr', 'visible');
        this.lazyLoad('gamification', 'idle');

        BGELogger?.info('Bundle Manager', '✅ Optimización automática completada');
    }
}

// Inicialización global
window.BGEBundleManager = new BGEBundleManager();

// Auto-optimización en carga de página
document.addEventListener('DOMContentLoaded', () => {
    window.BGEBundleManager.optimize();
});

void 0;