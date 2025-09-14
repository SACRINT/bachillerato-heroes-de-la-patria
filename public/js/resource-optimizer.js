/**
 * 🛠️ RESOURCE OPTIMIZER - FASE 2 OPTIMIZACIÓN
 * Sistema de optimización de recursos, minificación y code splitting
 */

class ResourceOptimizer {
    constructor() {
        this.loadedScripts = new Set();
        this.loadedStyles = new Set();
        this.criticalCSS = '';
        this.deferredResources = [];
        this.performanceMetrics = {
            startTime: performance.now(),
            scriptsLoaded: 0,
            stylesLoaded: 0,
            resourcesOptimized: 0
        };
        
        this.init();
    }

    init() {
        //console.log('🛠️ Inicializando Resource Optimizer...');
        
        // Extraer CSS crítico
        this.extractCriticalCSS();
        
        // Optimizar carga de scripts
        this.optimizeScriptLoading();
        
        // Implementar preload para recursos críticos
        this.implementResourceHints();
        
        // Configurar code splitting dinámico
        this.setupDynamicImports();
        
        //console.log('✅ Resource Optimizer inicializado');
    }

    extractCriticalCSS() {
        // Identificar CSS crítico (above the fold)
        const criticalSelectors = [
            'body', 'html', '.navbar', '.hero', '.container', 
            '.row', '.col-*', '.btn', '.text-*', '.bg-*',
            'h1', 'h2', 'h3', 'p', 'a'
        ];

        try {
            const stylesheets = document.styleSheets;
            let criticalCSS = '';

            for (let sheet of stylesheets) {
                try {
                    for (let rule of sheet.cssRules) {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            const selector = rule.selectorText;
                            
                            // Verificar si es CSS crítico
                            if (this.isCriticalSelector(selector, criticalSelectors)) {
                                criticalCSS += rule.cssText + '\n';
                            }
                        }
                    }
                } catch (e) {
                    // Ignorar errores de CORS en stylesheets externos
                }
            }

            if (criticalCSS) {
                this.inlineCriticalCSS(criticalCSS);
            }

        } catch (error) {
            console.warn('No se pudo extraer CSS crítico:', error);
        }
    }

    isCriticalSelector(selector, criticalSelectors) {
        return criticalSelectors.some(critical => {
            if (critical.includes('*')) {
                const pattern = critical.replace('*', '\\w+');
                const regex = new RegExp(pattern);
                return regex.test(selector);
            }
            return selector.includes(critical);
        });
    }

    inlineCriticalCSS(css) {
        // Crear elemento style para CSS crítico
        const criticalStyle = document.createElement('style');
        criticalStyle.id = 'critical-css';
        criticalStyle.textContent = css;
        
        // Insertar antes de cualquier otro CSS
        const firstLink = document.head.querySelector('link[rel="stylesheet"]');
        if (firstLink) {
            document.head.insertBefore(criticalStyle, firstLink);
        } else {
            document.head.appendChild(criticalStyle);
        }

        //console.log('✅ CSS crítico inline aplicado');
    }

    optimizeScriptLoading() {
        // Identificar scripts no críticos para carga diferida
        const scripts = document.querySelectorAll('script[src]');
        const nonCriticalScripts = [
            'chatbot', 'analytics', 'social', 'maps', 'chart',
            'admin-dashboard', 'advanced-search'
        ];

        scripts.forEach(script => {
            const src = script.src;
            const isNonCritical = nonCriticalScripts.some(pattern => 
                src.includes(pattern)
            );

            if (isNonCritical && !script.defer && !script.async) {
                script.defer = true;
                //console.log(`⚡ Script optimizado para carga diferida: ${src}`);
            }
        });
    }

    implementResourceHints() {
        const criticalResources = [
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
            'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
        ];

        // Preload de recursos críticos
        criticalResources.forEach(resource => {
            this.addResourceHint('preload', resource);
        });

        // DNS prefetch para dominios externos
        const externalDomains = [
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        externalDomains.forEach(domain => {
            this.addResourceHint('dns-prefetch', `//${domain}`);
        });
    }

    addResourceHint(rel, href, as = null) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (as) link.as = as;
        
        document.head.appendChild(link);
        //console.log(`🔗 Resource hint añadido: ${rel} ${href}`);
    }

    setupDynamicImports() {
        // Configurar carga dinámica de módulos según necesidad
        this.registerDynamicModule('admin', () => 
            import('./admin-dashboard.js').catch(() => //console.log('Admin module not needed'))
        );
        
        this.registerDynamicModule('charts', () => 
            this.loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js')
        );
        
        this.registerDynamicModule('maps', () => 
            this.loadScript('https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY')
        );
    }

    registerDynamicModule(name, loader) {
        window[`load${name.charAt(0).toUpperCase() + name.slice(1)}`] = async () => {
            if (this.loadedScripts.has(name)) return;
            
            //console.log(`📦 Cargando módulo dinámico: ${name}`);
            this.loadedScripts.add(name);
            
            try {
                await loader();
                this.performanceMetrics.scriptsLoaded++;
                //console.log(`✅ Módulo ${name} cargado exitosamente`);
            } catch (error) {
                console.error(`❌ Error cargando módulo ${name}:`, error);
            }
        };
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loadedScripts.has(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loadedScripts.add(src);
                resolve();
            };
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }

    loadCSS(href) {
        return new Promise((resolve, reject) => {
            if (this.loadedStyles.has(href)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                this.loadedStyles.add(href);
                resolve();
            };
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }

    // Minificación básica de CSS inline
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios
            .replace(/\s+/g, ' ') // Comprimir espacios
            .replace(/;\s*}/g, '}') // Remover ; antes de }
            .replace(/{\s*/g, '{') // Remover espacios después de {
            .replace(/}\s*/g, '}') // Remover espacios después de }
            .replace(/:\s*/g, ':') // Remover espacios después de :
            .replace(/;\s*/g, ';') // Remover espacios después de ;
            .trim();
    }

    // Comprimir JavaScript básico
    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios de bloque
            .replace(/\/\/.*$/gm, '') // Remover comentarios de línea
            .replace(/\s+/g, ' ') // Comprimir espacios
            .replace(/;\s*}/g, '}') // Optimizar sintaxis
            .trim();
    }

    // Implementar Resource Bundling
    bundleResources(resources, type = 'js') {
        //console.log(`📦 Bundling ${resources.length} ${type} resources...`);
        
        const bundledContent = resources.map(resource => {
            // En un entorno real, aquí cargaríamos el contenido de cada recurso
            return `/* ${resource} */\n`;
        }).join('\n');

        if (type === 'css') {
            const style = document.createElement('style');
            style.textContent = this.minifyCSS(bundledContent);
            document.head.appendChild(style);
        } else if (type === 'js') {
            const script = document.createElement('script');
            script.textContent = this.minifyJS(bundledContent);
            document.head.appendChild(script);
        }

        this.performanceMetrics.resourcesOptimized += resources.length;
    }

    // Configurar Service Worker para cache inteligente
    setupServiceWorkerOptimizations() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.type === 'CACHE_OPTIMIZED') {
                    //console.log('🚀 Cache optimizado por Service Worker');
                }
            });
        }
    }

    // Métricas de rendimiento
    getPerformanceMetrics() {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
        
        return {
            ...this.performanceMetrics,
            pageLoadTime: loadTime,
            domReadyTime: domReady,
            optimizationTime: performance.now() - this.performanceMetrics.startTime,
            totalResourcesLoaded: this.loadedScripts.size + this.loadedStyles.size
        };
    }

    // Reportar métricas al servidor
    reportMetrics() {
        const metrics = this.getPerformanceMetrics();
        
        // Enviar métricas de rendimiento al analytics
        if (window.analyticsTracker) {
            window.analyticsTracker.track('performance_metrics', metrics);
        }
        
        //console.log('📊 Métricas de rendimiento:', metrics);
        return metrics;
    }

    // Optimización automática basada en condiciones de red
    autoOptimize() {
        const connection = navigator.connection;
        
        if (connection) {
            // Ajustar estrategia según velocidad de conexión
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                this.enableAggressiveOptimizations();
            } else if (connection.effectiveType === '4g') {
                this.enablePreloadOptimizations();
            }
        }
    }

    enableAggressiveOptimizations() {
        //console.log('📶 Conexión lenta detectada - Aplicando optimizaciones agresivas');
        
        // Diferir todos los recursos no críticos
        const deferrableScripts = document.querySelectorAll('script[src*="analytics"], script[src*="social"], script[src*="maps"]');
        deferrableScripts.forEach(script => {
            script.defer = true;
        });
        
        // Reducir calidad de imágenes
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && img.src.includes('.jpg')) {
                img.loading = 'lazy';
            }
        });
    }

    enablePreloadOptimizations() {
        //console.log('🚀 Conexión rápida detectada - Habilitando preload agresivo');
        
        // Precargar recursos de la siguiente página probable
        this.addResourceHint('prefetch', './conocenos.html');
        this.addResourceHint('prefetch', './servicios.html');
    }
}

// Inicializar automáticamente
let resourceOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    resourceOptimizer = new ResourceOptimizer();
    
    // Auto-optimización después de la carga
    window.addEventListener('load', () => {
        setTimeout(() => {
            resourceOptimizer.autoOptimize();
            resourceOptimizer.reportMetrics();
        }, 1000);
    });
    
    // Hacer accesible globalmente
    window.resourceOptimizer = resourceOptimizer;
});

// Exponer la clase
window.ResourceOptimizer = ResourceOptimizer;