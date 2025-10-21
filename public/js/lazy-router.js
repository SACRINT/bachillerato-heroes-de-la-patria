/**
 * LAZY ROUTER - Dynamic Module Loading
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Sistema de carga lazy de módulos basado en rutas
 * Reduce el bundle inicial cargando código solo cuando se necesita
 */

class LazyRouter {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
        this.moduleRegistry = this.registerModules();

        // Preload crítico en idle time
        this.preloadCriticalModules();
    }

    /**
     * Registro de módulos y sus rutas/condiciones de carga
     */
    registerModules() {
        return {
            // Admin Dashboard
            'admin-dashboard': {
                path: '/dist/admin.bundle.js',
                condition: () => window.location.pathname.includes('admin-dashboard'),
                priority: 'high',
                preload: true
            },

            // CMS Manager
            'cms-manager': {
                path: '/dist/cms.bundle.js',
                condition: () => window.location.pathname.includes('admin-dashboard'),
                priority: 'high',
                dependencies: ['admin-dashboard']
            },

            // Analytics
            'analytics': {
                path: '/dist/analytics.bundle.js',
                condition: () => {
                    return window.location.pathname.includes('admin-dashboard') ||
                           document.getElementById('analytics-container');
                },
                priority: 'medium',
                preload: false
            },

            // Calendar
            'calendar': {
                path: '/dist/calendar.bundle.js',
                condition: () => {
                    return document.getElementById('calendar-container') ||
                           window.location.pathname.includes('eventos') ||
                           window.location.pathname.includes('convocatorias');
                },
                priority: 'medium'
            },

            // Job Portal
            'job-portal': {
                path: '/dist/job-portal.bundle.js',
                condition: () => window.location.pathname.includes('bolsa-trabajo'),
                priority: 'low'
            },

            // Parent Portal
            'parent-portal': {
                path: '/dist/parent-portal.bundle.js',
                condition: () => window.location.pathname.includes('padres'),
                priority: 'medium'
            }
        };
    }

    /**
     * Carga un módulo de forma lazy
     * @param {string} moduleName - Nombre del módulo a cargar
     * @returns {Promise} - Promise que resuelve cuando el módulo se carga
     */
    async loadModule(moduleName) {
        // Si ya está cargado, retornar inmediatamente
        if (this.loadedModules.has(moduleName)) {
            return Promise.resolve(this.loadedModules.get(moduleName));
        }

        // Si ya está cargándose, retornar el promise existente
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const moduleConfig = this.moduleRegistry[moduleName];
        if (!moduleConfig) {
            throw new Error(`Module "${moduleName}" not registered`);
        }

        // Cargar dependencias primero
        if (moduleConfig.dependencies) {
            await Promise.all(
                moduleConfig.dependencies.map(dep => this.loadModule(dep))
            );
        }

        // Crear promise de carga
        const loadingPromise = this.loadScript(moduleConfig.path)
            .then(module => {
                this.loadedModules.set(moduleName, module);
                this.loadingPromises.delete(moduleName);
                console.log(`✅ Módulo lazy loaded: ${moduleName}`);
                return module;
            })
            .catch(error => {
                this.loadingPromises.delete(moduleName);
                console.error(`❌ Error loading module ${moduleName}:`, error);
                throw error;
            });

        this.loadingPromises.set(moduleName, loadingPromise);
        return loadingPromise;
    }

    /**
     * Carga un script dinámicamente
     * @param {string} src - Ruta del script
     * @returns {Promise} - Promise que resuelve cuando el script se carga
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Verificar si el script ya existe en el DOM
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                resolve({ cached: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;

            script.onload = () => {
                resolve({ loaded: true, src });
            };

            script.onerror = () => {
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Auto-carga módulos basados en condiciones
     */
    async autoLoadModules() {
        const modulesToLoad = [];

        for (const [name, config] of Object.entries(this.moduleRegistry)) {
            if (config.condition && config.condition()) {
                modulesToLoad.push({
                    name,
                    priority: config.priority || 'low'
                });
            }
        }

        // Ordenar por prioridad
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        modulesToLoad.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

        // Cargar en orden de prioridad
        for (const { name } of modulesToLoad) {
            try {
                await this.loadModule(name);
            } catch (error) {
                console.error(`Auto-load failed for ${name}:`, error);
            }
        }
    }

    /**
     * Preload de módulos críticos en idle time
     */
    preloadCriticalModules() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.preloadModules();
            }, { timeout: 2000 });
        } else {
            // Fallback para navegadores que no soportan requestIdleCallback
            setTimeout(() => this.preloadModules(), 2000);
        }
    }

    /**
     * Preload de módulos marcados como preload: true
     */
    async preloadModules() {
        const toPreload = Object.entries(this.moduleRegistry)
            .filter(([_, config]) => config.preload === true)
            .map(([name]) => name);

        for (const moduleName of toPreload) {
            try {
                // Usar <link rel="prefetch"> para hints al navegador
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = this.moduleRegistry[moduleName].path;
                link.as = 'script';
                document.head.appendChild(link);

                console.log(`🔮 Prefetching: ${moduleName}`);
            } catch (error) {
                console.warn(`Prefetch failed for ${moduleName}:`, error);
            }
        }
    }

    /**
     * Preload de módulo específico (sin ejecutar)
     * @param {string} moduleName - Nombre del módulo
     */
    prefetchModule(moduleName) {
        const config = this.moduleRegistry[moduleName];
        if (!config) return;

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = config.path;
        link.as = 'script';
        document.head.appendChild(link);
    }

    /**
     * Obtiene estadísticas de módulos cargados
     */
    getStats() {
        return {
            loaded: Array.from(this.loadedModules.keys()),
            loading: Array.from(this.loadingPromises.keys()),
            totalRegistered: Object.keys(this.moduleRegistry).length,
            loadedCount: this.loadedModules.size
        };
    }

    /**
     * Limpia módulos cargados (útil para testing)
     */
    clearCache() {
        this.loadedModules.clear();
        this.loadingPromises.clear();
    }
}

// Exportar instancia global
const lazyRouter = new LazyRouter();

// Auto-load en DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lazyRouter.autoLoadModules();
    });
} else {
    // DOM ya está listo
    lazyRouter.autoLoadModules();
}

// Exportar para uso global
window.LazyRouter = LazyRouter;
window.lazyRouter = lazyRouter;

export default lazyRouter;
