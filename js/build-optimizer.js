/**
 * 🔧 BUILD OPTIMIZER - OPTIMIZADO v2.0
 * Sistema de bundling, minificación y optimización de build
 * Mejorado para mayor performance y estabilidad
 */

class BuildOptimizer {
    constructor() {
        this.bundles = {
            critical: [],
            deferred: [],
            admin: [],
            mobile: []
        };
        this.cssRules = new Map();
        this.jsModules = new Map();
        this.optimizationStats = {
            originalSize: 0,
            optimizedSize: 0,
            compressionRatio: 0,
            loadTime: 0,
            scriptsOptimized: 0,
            errorsCount: 0
        };
        
        this.init();
    }

    init() {
        //console.log('🔧 Inicializando Build Optimizer...');
        
        // Analizar recursos actuales
        this.analyzeCurrentResources();
        
        // Configurar code splitting
        this.setupCodeSplitting();
        
        // Crear CSS crítico
        this.extractAndInlineCriticalCSS();
        
        // Optimizar carga de scripts
        this.optimizeScriptLoading();
        
        //console.log('✅ Build Optimizer inicializado');
    }

    analyzeCurrentResources() {
        // Analizar todos los scripts cargados
        const scripts = document.querySelectorAll('script[src]');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');

        scripts.forEach(script => {
            const src = script.src;
            const category = this.categorizeScript(src);
            this.bundles[category].push({
                src,
                element: script,
                size: 0, // Se calculará dinámicamente
                priority: this.getScriptPriority(src)
            });
        });

        stylesheets.forEach(link => {
            if (link.href.includes('bootstrap') || link.href.includes('font-awesome')) {
                // CSS crítico
                this.bundles.critical.push({
                    src: link.href,
                    element: link,
                    type: 'css'
                });
            }
        });

        //console.log('📊 Recursos analizados:', this.bundles);
    }

    categorizeScript(src) {
        if (src.includes('admin') || src.includes('dashboard')) return 'admin';
        if (src.includes('mobile') || src.includes('touch')) return 'mobile';
        if (src.includes('bootstrap') || src.includes('config') || src.includes('auth')) return 'critical';
        return 'deferred';
    }

    getScriptPriority(src) {
        const priorityMap = {
            'config.js': 10,
            'bootstrap': 9,
            'admin-auth-secure.js': 8,
            'script.js': 7,
            'performance': 6,
            'cache': 5,
            'api': 4,
            'chatbot': 3,
            'advanced': 2,
            'external': 1
        };

        for (const [key, priority] of Object.entries(priorityMap)) {
            if (src.includes(key)) return priority;
        }
        return 1;
    }

    setupCodeSplitting() {
        // Crear chunks dinámicos para funcionalidades no críticas
        this.createDynamicChunk('admin-features', [
            'js/admin-dashboard.js',
            'js/admin-auth-secure.js'
        ]);

        this.createDynamicChunk('advanced-features', [
            'js/advanced-search.js',
            'js/chatbot.js',
            'js/external-integrations.js'
        ]);

        this.createDynamicChunk('pwa-features', [
            'js/pwa-advanced-features.js',
            'js/cache-manager.js'
        ]);
    }

    createDynamicChunk(chunkName, scriptPaths) {
        window[`load${chunkName.replace(/-/g, '')}`] = async () => {
            //console.log(`📦 Cargando chunk dinámico: ${chunkName}`);
            
            try {
                // Cargar scripts en paralelo
                const loadPromises = scriptPaths.map(path => this.loadScriptOptimized(path));
                await Promise.all(loadPromises);
                
                //console.log(`✅ Chunk ${chunkName} cargado exitosamente`);
                return true;
            } catch (error) {
                console.error(`❌ Error cargando chunk ${chunkName}:`, error);
                return false;
            }
        };
    }

    loadScriptOptimized(src) {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargado
            if (this.isScriptLoaded(src)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                this.markScriptAsLoaded(src);
                resolve();
            };
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }

    isScriptLoaded(src) {
        return this.jsModules.has(src);
    }

    markScriptAsLoaded(src) {
        this.jsModules.set(src, {
            loaded: true,
            loadTime: performance.now()
        });
    }

    extractAndInlineCriticalCSS() {
        const criticalSelectors = [
            'body', 'html', '.container', '.row', '[class*="col-"]',
            '.navbar', '.nav', '.btn', '.text-', '.bg-', '.d-',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a',
            '.hero', '.card', '.img-fluid', '.shadow'
        ];

        let criticalCSS = '';

        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule.type === CSSRule.STYLE_RULE) {
                            if (this.isCriticalSelector(rule.selectorText, criticalSelectors)) {
                                criticalCSS += this.minifyCSS(rule.cssText) + '\n';
                            }
                        }
                    });
                } catch (e) {
                    // Ignorar errores CORS
                }
            });

            if (criticalCSS) {
                this.inlineCriticalCSS(criticalCSS);
            }
        } catch (error) {
            console.warn('Error extrayendo CSS crítico:', error);
        }
    }

    isCriticalSelector(selector, criticalSelectors) {
        if (!selector) return false;
        
        return criticalSelectors.some(critical => {
            if (critical.includes('*')) {
                const pattern = critical.replace(/\*/g, '\\w+');
                return new RegExp(pattern).test(selector);
            }
            return selector.includes(critical);
        });
    }

    inlineCriticalCSS(css) {
        // Crear elemento style optimizado
        const criticalStyle = document.createElement('style');
        criticalStyle.id = 'critical-css-optimized';
        criticalStyle.textContent = css;
        
        // Insertar al inicio del head
        document.head.insertBefore(criticalStyle, document.head.firstChild);
        
        //console.log('🎨 CSS crítico optimizado e inline aplicado');
    }

    optimizeScriptLoading() {
        // Reordenar scripts por prioridad
        const sortedScripts = this.bundles.critical
            .concat(this.bundles.deferred)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Aplicar async/defer inteligente
        sortedScripts.forEach((scriptData, index) => {
            const script = scriptData.element;
            if (!script) return;

            if (scriptData.priority >= 7) {
                // Scripts críticos - cargar inmediatamente
                script.removeAttribute('defer');
                script.removeAttribute('async');
            } else if (scriptData.priority >= 4) {
                // Scripts importantes - defer
                script.defer = true;
                script.removeAttribute('async');
            } else {
                // Scripts no críticos - async
                script.async = true;
                script.removeAttribute('defer');
            }
        });
    }

    // Minificación mejorada de CSS
    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios
            .replace(/\s+/g, ' ') // Espacios múltiples
            .replace(/;\s*}/g, '}') // Semicolons innecesarios
            .replace(/{\s+/g, '{') // Espacios después de {
            .replace(/}\s+/g, '}') // Espacios después de }
            .replace(/:\s+/g, ':') // Espacios después de :
            .replace(/;\s+/g, ';') // Espacios después de ;
            .replace(/,\s+/g, ',') // Espacios después de ,
            .replace(/\s*>\s*/g, '>') // Espacios en selectores
            .replace(/\s*\+\s*/g, '+') // Espacios en selectores
            .replace(/\s*~\s*/g, '~') // Espacios en selectores
            .trim();
    }

    // Minificación mejorada de JavaScript
    minifyJS(js) {
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios de bloque
            .replace(/\/\/.*$/gm, '') // Comentarios de línea
            .replace(/\s*([{}();,:])\s*/g, '$1') // Espacios alrededor de operadores
            .replace(/\s+/g, ' ') // Espacios múltiples
            .replace(/;\s*}/g, '}') // Semicolons antes de }
            .trim();
    }

    // Bundling inteligente
    async createOptimizedBundle(bundleName, resources) {
        //console.log(`📦 Creando bundle optimizado: ${bundleName}`);
        
        let bundledContent = '';
        let totalSize = 0;

        for (const resource of resources) {
            try {
                const content = await this.fetchResourceContent(resource.src);
                const minified = resource.type === 'css' ? 
                    this.minifyCSS(content) : 
                    this.minifyJS(content);
                
                bundledContent += `/* ${resource.src} */\n${minified}\n`;
                totalSize += content.length;
            } catch (error) {
                console.warn(`Error bundling ${resource.src}:`, error);
            }
        }

        // Crear y aplicar bundle
        if (bundleName.includes('css')) {
            this.applyCSSBundle(bundleName, bundledContent);
        } else {
            this.applyJSBundle(bundleName, bundledContent);
        }

        this.optimizationStats.originalSize += totalSize;
        this.optimizationStats.optimizedSize += bundledContent.length;
        
        return bundledContent;
    }

    async fetchResourceContent(url) {
        try {
            const response = await fetch(url);
            return await response.text();
        } catch (error) {
            console.warn(`No se pudo cargar recurso: ${url}`);
            return '';
        }
    }

    applyCSSBundle(name, content) {
        const style = document.createElement('style');
        style.id = `bundle-${name}`;
        style.textContent = content;
        document.head.appendChild(style);
    }

    applyJSBundle(name, content) {
        const script = document.createElement('script');
        script.id = `bundle-${name}`;
        script.textContent = content;
        document.head.appendChild(script);
    }

    // Análisis de performance
    getOptimizationReport() {
        const ratio = this.optimizationStats.originalSize > 0 ? 
            (1 - this.optimizationStats.optimizedSize / this.optimizationStats.originalSize) * 100 : 0;
        
        return {
            ...this.optimizationStats,
            compressionRatio: ratio.toFixed(2) + '%',
            bundles: Object.keys(this.bundles).map(key => ({
                name: key,
                resources: this.bundles[key].length
            }))
        };
    }

    // Método público para ejecutar optimización completa
    async optimizeAll() {
        //console.log('🚀 Ejecutando optimización completa...');
        
        try {
            // Crear bundles optimizados
            await this.createOptimizedBundle('critical-css', 
                this.bundles.critical.filter(r => r.type === 'css'));
            
            // Optimizar carga de recursos
            this.setupResourceHints();
            
            // Reportar resultados
            const report = this.getOptimizationReport();
            //console.log('📊 Reporte de optimización:', report);
            
            return report;
        } catch (error) {
            console.error('Error en optimización:', error);
            return null;
        }
    }

    setupResourceHints() {
        // Preload de recursos críticos
        const criticalResources = [
            'css/style.css',
            'js/config.js',
            'js/script.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });

        // DNS prefetch para CDNs
        const cdnDomains = [
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com'
        ];

        cdnDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }
}

// Inicializar automáticamente
let buildOptimizer;

document.addEventListener('DOMContentLoaded', () => {
    buildOptimizer = new BuildOptimizer();
    
    // Ejecutar optimización después de la carga
    window.addEventListener('load', () => {
        setTimeout(() => {
            buildOptimizer.optimizeAll();
        }, 1000);
    });
    
    // Comando para ver reporte
    window.showOptimizationReport = () => buildOptimizer.getOptimizationReport();
    
    // Hacer accesible globalmente
    window.buildOptimizer = buildOptimizer;
});

// Exponer la clase
window.BuildOptimizer = BuildOptimizer;