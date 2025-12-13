/**
 * Context Manager BGE - Sistema de verificación de contexto
 * Previene ejecución de scripts en páginas incorrectas
 * Migrado a TypeScript: 13-12-2025
 * Versión: 2.0
 */

// Declaración de tipos globales
declare const debugLog: {
    log: (category: string, ...args: any[]) => void;
    warn: (category: string, ...args: any[]) => void;
    error: (category: string, ...args: any[]) => void;
};

// Interfaces
interface PageFeatures {
    hasNavbar: boolean;
    hasDashboard: boolean;
    hasCharts: boolean;
    hasModal: boolean;
    hasForm: boolean;
    hasChatbot: boolean;
    hasCarousel: boolean;
    hasMap: boolean;
    hasCalendar: boolean;
    hasAuth: boolean;
}

interface ScriptRequirements {
    pages?: string[];
    features?: (keyof PageFeatures)[];
    exclude?: string[];
    critical?: boolean;
}

interface UserInfo {
    id?: number;
    email?: string;
    name?: string;
    role?: string;
}

type PageType = 'home' | 'dashboard' | 'about' | 'students' | 'parents' |
    'alumni' | 'community' | 'contact' | 'calendar' |
    'appointments' | 'grades' | 'announcements' | 'jobs' |
    'downloads' | 'messaging' | 'library' | 'unknown';

// Debug Logger Fallback
const localDebugLog = typeof debugLog !== 'undefined' ? debugLog : {
    log: (..._args: any[]) => { },
    warn: (..._args: any[]) => { },
    error: (..._args: any[]) => { }
};

export class BGEContextManager {
    public currentPage: PageType;
    public pageFeatures: PageFeatures;
    public isReady: boolean;
    private currentUser: UserInfo | null;
    private authToken: string | null;

    constructor() {
        this.currentPage = this.detectCurrentPage();
        this.pageFeatures = this.detectPageFeatures();
        this.isReady = false;
        this.currentUser = null;
        this.authToken = null;

        localDebugLog.log('CONTEXT', '🔍 [CONTEXT] Página detectada:', this.currentPage);
        localDebugLog.log('CONTEXT', '📋 [CONTEXT] Características:', this.pageFeatures);
    }

    /**
     * Detecta la página actual basándose en múltiples criterios
     */
    detectCurrentPage(): PageType {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';

        // Mapeo de páginas conocidas
        const pageMap: Record<string, PageType> = {
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
            'descargas.html': 'downloads',
            'mensajeria.html': 'messaging',
            'biblioteca.html': 'library'
        };

        return pageMap[fileName] || 'unknown';
    }

    /**
     * Detecta características específicas de la página
     */
    detectPageFeatures(): PageFeatures {
        return {
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
    }

    /**
     * Verifica si un script debe ejecutarse en el contexto actual
     */
    shouldExecuteScript(scriptName: string, requirements: ScriptRequirements = {}): boolean {
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
            localDebugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} excluido en página ${this.currentPage}`);
            return false;
        }

        // Si se especifican páginas, verificar inclusión
        if (pages.length > 0 && !pages.includes(this.currentPage)) {
            localDebugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} no requerido en página ${this.currentPage}`);
            return false;
        }

        // Verificar características requeridas
        if (features.length > 0) {
            const hasRequiredFeatures = features.some(feature => this.pageFeatures[feature]);
            if (!hasRequiredFeatures) {
                localDebugLog.log('CONTEXT', `⏭️ [CONTEXT] Script ${scriptName} - características no encontradas:`, features);
                return false;
            }
        }

        localDebugLog.log('CONTEXT', `✅ [CONTEXT] Script ${scriptName} autorizado para ejecución`);
        return true;
    }

    /**
     * Wrapper seguro para ejecutar scripts
     */
    safeExecute(scriptName: string, callback: () => void, requirements: ScriptRequirements = {}): boolean {
        if (!this.shouldExecuteScript(scriptName, requirements)) {
            return false;
        }

        try {
            callback();
            localDebugLog.log('CONTEXT', `✅ [CONTEXT] Script ${scriptName} ejecutado exitosamente`);
            return true;
        } catch (error) {
            localDebugLog.error('CONTEXT', `❌ [CONTEXT] Error ejecutando ${scriptName}:`, error);
            return false;
        }
    }

    /**
     * Espera a que el contexto esté listo
     */
    async waitForReady(): Promise<boolean> {
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
    registerScript(scriptName: string, initFunction: () => void, requirements: ScriptRequirements = {}): void {
        this.waitForReady().then(() => {
            this.safeExecute(scriptName, initFunction, requirements);
        });
    }

    // ============================================
    // ✅ BRIDGE: Métodos para auth-context-bridge.js
    // ============================================

    /**
     * Establecer usuario actual (llamado por auth-context-bridge cuando user se autentica)
     */
    setCurrentUser(user: UserInfo | null): void {
        this.currentUser = user;
        localDebugLog.log('CONTEXT', '✅ Usuario establecido en contexto:', user?.email || 'N/A');
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser(): UserInfo | null {
        return this.currentUser;
    }

    /**
     * Limpiar contexto (llamado por auth-context-bridge cuando user cierra sesión)
     */
    clearContext(): void {
        this.currentUser = null;
        this.authToken = null;
        localDebugLog.log('CONTEXT', '🧹 Contexto limpiado (usuario removido)');
    }

    /**
     * Actualizar token de autenticación (llamado por auth-context-bridge cuando token se refresca)
     */
    updateAuthToken(newToken: string | null): void {
        this.authToken = newToken;
        localDebugLog.log('CONTEXT', '🔄 Token actualizado en contexto');
    }

    /**
     * Obtener token de autenticación
     */
    getAuthToken(): string | null {
        return this.authToken;
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        return this.currentUser !== null && this.authToken !== null;
    }
}

// Singleton instance
export const bgeContext = new BGEContextManager();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).BGEContext = bgeContext;
    (window as any).contextManager = bgeContext;
    localDebugLog.log('CONTEXT', '✅ [CONTEXT] Context Manager TS inicializado');
}

export default bgeContext;
