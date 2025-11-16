/**
 * Context Manager BGE - Sistema de verificación de contexto
 * Previene ejecución de scripts en páginas incorrectas
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}

class BGEContextManager {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.pageFeatures = this.detectPageFeatures();
        this.isReady = false;

        debugLog.log('CONTEXT', '🔍 [CONTEXT] Página detectada:', this.currentPage);
        debugLog.log('CONTEXT', '📋 [CONTEXT] Características:', this.pageFeatures);
    }

    /**
     * Detecta la página actual basándose en múltiples criterios
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';

        // Mapeo de páginas conocidas
        const pageMap = {
            'index.html': 'home',
            '': 'home',
            '/': 'home',
            'admin-dashboard.html': 'dashboard',
            'conocenos.html': 'about',
            'estudiantes.html': 'students',
            'padres.html': 'parents',
            'egresados.html': 'alumni',
            'comunidad.html': 'community',
            'contacto.html': 'contact',
            'calendario.html': 'calendar',
            'citas.html': 'appointments',
            'calificaciones.html': 'grades',
            'convocatorias.html': 'announcements',
            'bolsa-trabajo.html': 'jobs',
            'descargas.html': 'downloads'
        };

        return pageMap[fileName] || 'unknown';
    }

    /**
     * Detecta características específicas de la página
     */
    detectPageFeatures() {
        const features = {
            hasNavbar: !!document.querySelector('.navbar'),
            hasDashboard: !!document.querySelector('.dashboard-widgets-container, #dashboard-container'),
            hasCharts: !!document.querySelector('canvas, .chart-container'),
            hasModal: !!document.querySelector('.modal'),
            hasForm: !!document.querySelector('form'),
            hasChatbot: !!document.querySelector('#chatbot-container, .chatbot'),
            hasCarousel: !!document.querySelector('.carousel'),
            hasMap: !!document.querySelector('#map, .map-container'),
            hasCalendar: !!document.querySelector('.calendar, #calendar'),
            hasAuth: !!document.querySelector('.auth-container, .login-form')
        };

        return features;
    }

    /**
     * Verifica si un script debe ejecutarse en el contexto actual
     */
    shouldExecuteScript(scriptName, requirements = {}) {
        const {
            pages = [],
            features = [],
            exclude = [],
            critical = false
        } = requirements;

        // Si es crítico, siempre ejecutar
        if (critical) {
            return true;
        }

        // Verificar exclusiones
        if (exclude.includes(this.currentPage)) {
            debugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} excluido en página ${this.currentPage}`);
            return false;
        }

        // Si se especifican páginas, verificar inclusión
        if (pages.length > 0 && !pages.includes(this.currentPage)) {
            debugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} no requerido en página ${this.currentPage}`);
            return false;
        }

        // Verificar características requeridas
        if (features.length > 0) {
            const hasRequiredFeatures = features.some(feature => this.pageFeatures[feature]);
            if (!hasRequiredFeatures) {
                debugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} - características no encontradas:`, features);
                return false;
            }
        }

        debugLog.log('CONTEXT', `✅ [CONTEXT] Script ${scriptName} autorizado para ejecución`);
        return true;
    }

    /**
     * Wrapper seguro para ejecutar scripts
     */
    safeExecute(scriptName, callback, requirements = {}) {
        if (!this.shouldExecuteScript(scriptName, requirements)) {
            return false;
        }

        try {
            callback();
            debugLog.log('CONTEXT', `✅ [CONTEXT] Script ${scriptName} ejecutado exitosamente`);
            return true;
        } catch (error) {
            debugLog.error('CONTEXT', `❌ [CONTEXT] Error ejecutando ${scriptName}:`, error);
            return false;
        }
    }

    /**
     * Espera a que el contexto esté listo
     */
    async waitForReady() {
        if (this.isReady) return true;

        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                this.isReady = true;
                resolve(true);
            } else {
                window.addEventListener('load', () => {
                    this.isReady = true;
                    resolve(true);
                });
            }
        });
    }

    /**
     * Registra un script para ejecución condicional
     */
    registerScript(scriptName, initFunction, requirements = {}) {
        this.waitForReady().then(() => {
            this.safeExecute(scriptName, initFunction, requirements);
        });
    }
}

// Instancia global
window.BGEContext = new BGEContextManager();

debugLog.log('CONTEXT', '✅ [CONTEXT] Context Manager inicializado');