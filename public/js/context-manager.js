/**
 * Context Manager BGE - Sistema de verificación de contexto
 * Previene ejecución de scripts en páginas incorrectas
 * Versión: 1.0
 * Fecha: 21-09-2025
 */

class BGEContextManager {
    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.pageFeatures = this.detectPageFeatures();
        this.isReady = false;

        console.log('🔍 [CONTEXT] Página detectada:', this.currentPage);
        console.log('📋 [CONTEXT] Características:', this.pageFeatures);
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
            console.log(`⏭️ [CONTEXT] Script ${scriptName} excluido en página ${this.currentPage}`);
            return false;
        }

        // Si se especifican páginas, verificar inclusión
        if (pages.length > 0 && !pages.includes(this.currentPage)) {
            console.log(`⏭️ [CONTEXT] Script ${scriptName} no requerido en página ${this.currentPage}`);
            return false;
        }

        // Verificar características requeridas
        if (features.length > 0) {
            const hasRequiredFeatures = features.some(feature => this.pageFeatures[feature]);
            if (!hasRequiredFeatures) {
                console.log(`⏭️ [CONTEXT] Script ${scriptName} - características no encontradas:`, features);
                return false;
            }
        }

        console.log(`✅ [CONTEXT] Script ${scriptName} autorizado para ejecución`);
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
            console.log(`✅ [CONTEXT] Script ${scriptName} ejecutado exitosamente`);
            return true;
        } catch (error) {
            console.error(`❌ [CONTEXT] Error ejecutando ${scriptName}:`, error);
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

console.log('✅ [CONTEXT] Context Manager inicializado');