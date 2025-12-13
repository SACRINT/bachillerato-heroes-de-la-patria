/**
 * 📦 MODULE LOADER - TypeScript
 * Sistema de carga dinámica de módulos para code splitting
 *
 * Features:
 * - Carga dinámica de scripts
 * - Cache de módulos cargados
 * - Dependencias automáticas
 * - Prefetch inteligente
 * - Error handling robusto
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 */

export interface ModuleConfig {
    path: string;
    dependencies?: string[];
    preload?: boolean;
}

export interface ModuleStats {
    loaded: number;
    loading: number;
    available: number;
    modules: string[];
}

export class ModuleLoader {
    static instance: ModuleLoader;
    static version = '2.0.0';

    private loadedModules: Map<string, boolean>;
    private loadingModules: Map<string, Promise<boolean>>;
    private moduleConfig: Record<string, ModuleConfig>;

    private constructor() {
        this.loadedModules = new Map();
        this.loadingModules = new Map();
        this.moduleConfig = {
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

            // Students
            'student-dashboard': {
                path: '/public/js/student-dashboard.js',
                dependencies: ['academic-reports']
            },
            'academic-reports': {
                path: '/public/js/academic-reports-manager.js',
                dependencies: []
            },

            // Appointments
            'appointments': {
                path: '/public/js/appointments.js',
                dependencies: []
            },
            'citas-manager': {
                path: '/public/js/citas-manager.js',
                dependencies: []
            },

            // Notifications
            'notifications': {
                path: '/public/js/bge-notification-admin.js',
                dependencies: []
            },

            // AI
            'chatbot': {
                path: '/public/js/bge-chatbot-ia-avanzado.js',
                dependencies: []
            },

            // Utilities
            'performance-utils': {
                path: '/public/js/performance-utils.js',
                dependencies: []
            }
        };
    }

    /**
     * Singleton pattern
     */
    static getInstance(): ModuleLoader {
        if (!ModuleLoader.instance) {
            ModuleLoader.instance = new ModuleLoader();
        }
        return ModuleLoader.instance;
    }

    /**
     * Load a module
     */
    async load(moduleName: string): Promise<boolean> {
        // Already loaded
        if (this.loadedModules.has(moduleName)) {
            console.log(`[ModuleLoader] Module '${moduleName}' already loaded`);
            return true;
        }

        // Currently loading
        const loadingPromise = this.loadingModules.get(moduleName);
        if (loadingPromise) {
            return loadingPromise;
        }

        // Get module config
        const config = this.moduleConfig[moduleName];
        if (!config) {
            console.error(`[ModuleLoader] Module '${moduleName}' not found in config`);
            return false;
        }

        // Create load promise
        const loadPromise = this.loadModuleWithDependencies(moduleName, config);
        this.loadingModules.set(moduleName, loadPromise);

        try {
            await loadPromise;
            this.loadedModules.set(moduleName, true);
            this.loadingModules.delete(moduleName);
            console.log(`[ModuleLoader] Module '${moduleName}' loaded successfully`);
            return true;
        } catch (error) {
            this.loadingModules.delete(moduleName);
            console.error(`[ModuleLoader] Error loading '${moduleName}':`, error);
            return false;
        }
    }

    /**
     * Load module with its dependencies
     */
    private async loadModuleWithDependencies(moduleName: string, config: ModuleConfig): Promise<boolean> {
        if (config.dependencies && config.dependencies.length > 0) {
            await Promise.all(
                config.dependencies.map(dep => this.load(dep))
            );
        }

        await this.loadScript(config.path);
        return true;
    }

    /**
     * Load a script
     */
    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already exists
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Error loading script: ${src}`));

            document.head.appendChild(script);
        });
    }

    /**
     * Load multiple modules in parallel
     */
    async loadMultiple(moduleNames: string[]): Promise<boolean[]> {
        return Promise.all(moduleNames.map(name => this.load(name)));
    }

    /**
     * Prefetch modules for later loading
     */
    prefetch(moduleNames: string | string[]): void {
        const names = Array.isArray(moduleNames) ? moduleNames : [moduleNames];

        names.forEach(name => {
            const config = this.moduleConfig[name];
            if (config) {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = config.path;
                document.head.appendChild(link);
            }
        });

        console.log(`[ModuleLoader] Prefetch configured for ${names.length} modules`);
    }

    /**
     * Preload modules (higher priority than prefetch)
     */
    preload(moduleNames: string | string[]): void {
        const names = Array.isArray(moduleNames) ? moduleNames : [moduleNames];

        names.forEach(name => {
            const config = this.moduleConfig[name];
            if (config) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'script';
                link.href = config.path;
                document.head.appendChild(link);
            }
        });

        console.log(`[ModuleLoader] Preload configured for ${names.length} modules`);
    }

    /**
     * Load module when element becomes visible
     */
    loadOnVisible(moduleName: string, triggerSelector: string): void {
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
            // Fallback: load immediately
            this.load(moduleName);
        }
    }

    /**
     * Load module on user interaction
     */
    loadOnInteraction(
        moduleName: string,
        eventSelector: string,
        eventType: keyof HTMLElementEventMap = 'click'
    ): void {
        const element = document.querySelector(eventSelector);
        if (!element) return;

        const handler = async () => {
            await this.load(moduleName);
            element.removeEventListener(eventType, handler);
        };

        element.addEventListener(eventType, handler, { once: true });
    }

    /**
     * Load module after idle
     */
    loadOnIdle(moduleName: string, timeout: number = 2000): void {
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => {
                this.load(moduleName);
            }, { timeout });
        } else {
            setTimeout(() => this.load(moduleName), timeout);
        }
    }

    /**
     * Register new module
     */
    register(name: string, config: ModuleConfig): void {
        this.moduleConfig[name] = config;
        console.log(`[ModuleLoader] Module '${name}' registered`);
    }

    /**
     * Unregister a module
     */
    unregister(name: string): void {
        delete this.moduleConfig[name];
        this.loadedModules.delete(name);
    }

    /**
     * Check if module is loaded
     */
    isLoaded(moduleName: string): boolean {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Check if module is loading
     */
    isLoading(moduleName: string): boolean {
        return this.loadingModules.has(moduleName);
    }

    /**
     * Get list of loaded modules
     */
    getLoadedModules(): string[] {
        return Array.from(this.loadedModules.keys());
    }

    /**
     * Get available modules
     */
    getAvailableModules(): string[] {
        return Object.keys(this.moduleConfig);
    }

    /**
     * Get loading statistics
     */
    getStats(): ModuleStats {
        return {
            loaded: this.loadedModules.size,
            loading: this.loadingModules.size,
            available: Object.keys(this.moduleConfig).length,
            modules: this.getLoadedModules()
        };
    }

    /**
     * Clear module cache
     */
    clearCache(): void {
        this.loadedModules.clear();
        console.log('[ModuleLoader] Cache cleared');
    }
}

// Singleton instance
export const moduleLoader = ModuleLoader.getInstance();

// Expose globally
if (typeof window !== 'undefined') {
    (window as any).ModuleLoader = moduleLoader;
}

console.log('[ModuleLoader] Initialized v' + ModuleLoader.version);

export default moduleLoader;
