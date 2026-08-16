/**
 * THEME MANAGER INTEGRADO - SISTEMA DE GESTIÓN DE TEMAS (TypeScript)
 * BGE Héroes de la Patria - Integración con sistema existente
 *
 * Mejora el sistema existente de modo oscuro con:
 * - Detección automática de preferencias del sistema
 * - Variables CSS avanzadas
 * - Mejor accesibilidad y transiciones
 * - Sincronización entre pestañas
 * 
 * Migrado a TypeScript: 13 Diciembre 2025
 */

// Interfaces
export interface ThemeInfo {
    isDark: boolean;
    isSystemDark: boolean;
    hasUserPreference: boolean;
    storageKey: string;
}

export interface ThemeEventDetail {
    isDark: boolean;
    wasSystemTriggered?: boolean;
    timestamp: string;
    manager: ThemeManager;
}

type ThemeEventName = 'themeManagerReady' | 'themeChanged';

export class ThemeManager {
    private storageKey: string;
    private existingClass: string;
    private toggleSelector: string;
    private mediaQuery: MediaQueryList;
    private body: HTMLElement;
    private html: HTMLElement;
    private toggleButton: HTMLElement | null;
    private isSystemDark: boolean;
    private hasUserPreference: boolean;
    private initialized: boolean;

    constructor() {
        

        // Configuración integrada con sistema existente
        this.storageKey = 'heroesPatria_darkMode';
        this.existingClass = 'dark-mode';
        this.toggleSelector = '#darkModeToggle';

        // Media query para detección del sistema
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Referencias DOM
        this.body = document.body;
        this.html = document.documentElement;
        this.toggleButton = null;

        // Estado
        this.isSystemDark = this.mediaQuery.matches;
        this.hasUserPreference = localStorage.getItem(this.storageKey) !== null;
        this.initialized = false;

        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Inicialización del sistema integrado
     */
    init(): void {
        if (this.initialized) return;

        try {
            // Detectar y aplicar tema basado en preferencias
            this.detectAndApplyTheme();

            // Configurar el botón toggle existente
            this.setupExistingToggle();

            // Configurar listeners para cambios del sistema
            this.setupSystemListener();

            // Configurar sincronización entre pestañas
            this.setupStorageSync();

            // Aplicar mejoras CSS
            this.applyEnhancedCSS();

            this.initialized = true;
            

            // Evento personalizado de inicialización
            this.dispatchThemeEvent('themeManagerReady', {
                isDark: this.isDarkMode(),
                wasSystemTriggered: false
            });

        } catch (error) {
            console.error('❌ [THEME] Error inicializando Theme Manager:', error);
        }
    }

    /**
     * Detecta y aplica el tema correcto
     */
    private detectAndApplyTheme(): void {
        // Si el usuario no ha establecido preferencia, usar la del sistema
        if (!this.hasUserPreference && this.isSystemDark) {
            
            this.body.classList.add(this.existingClass);
            localStorage.setItem(this.storageKey, 'true');
        }

        // Aplicar data-theme para usar variables CSS avanzadas
        const isDark = this.isDarkMode();
        this.html.setAttribute('data-theme', isDark ? 'dark' : 'light');

        
    }

    /**
     * Configura el botón toggle existente
     */
    private setupExistingToggle(): void {
        const findToggle = (): boolean => {
            this.toggleButton = document.querySelector(this.toggleSelector);
            return this.toggleButton !== null;
        };

        if (findToggle()) {
            this.enhanceToggleButton();
        } else {
            // Reintentar hasta encontrarlo (máximo 10 segundos)
            let attempts = 0;
            const maxAttempts = 20;

            const interval = setInterval(() => {
                attempts++;
                if (findToggle()) {
                    clearInterval(interval);
                    this.enhanceToggleButton();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    
                }
            }, 500);
        }
    }

    /**
     * Mejora el botón toggle existente
     */
    private enhanceToggleButton(): void {
        if (!this.toggleButton) return;

        

        // Actualizar icono inicial
        this.updateToggleIcon();

        // Remover listeners previos y añadir el nuestro
        const newButton = this.toggleButton.cloneNode(true) as HTMLElement;
        this.toggleButton.parentNode?.replaceChild(newButton, this.toggleButton);
        this.toggleButton = newButton;

        // Añadir nuestro listener mejorado
        this.toggleButton.addEventListener('click', () => this.toggleTheme());

        // Mejorar accesibilidad
        const label = this.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        this.toggleButton.setAttribute('title', label);
        this.toggleButton.setAttribute('aria-label', label);
    }

    /**
     * Alterna el tema
     */
    toggleTheme(): void {
        const wasDark = this.isDarkMode();
        const newDarkState = !wasDark;

        

        // Aplicar transición suave
        this.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        this.html.style.transition = 'background-color 0.3s ease, color 0.3s ease';

        // Cambiar clase existente
        this.body.classList.toggle(this.existingClass, newDarkState);

        // Cambiar data-theme para variables CSS avanzadas
        this.html.setAttribute('data-theme', newDarkState ? 'dark' : 'light');

        // Guardar preferencia
        localStorage.setItem(this.storageKey, newDarkState.toString());
        this.hasUserPreference = true;

        // Actualizar icono
        this.updateToggleIcon();

        // Remover transición después de completarse
        setTimeout(() => {
            this.body.style.transition = '';
            this.html.style.transition = '';
        }, 300);

        // Evento personalizado
        this.dispatchThemeEvent('themeChanged', {
            isDark: newDarkState,
            wasSystemTriggered: false
        });
    }

    /**
     * Actualiza el icono del toggle
     */
    private updateToggleIcon(): void {
        if (!this.toggleButton) return;

        const icon = this.toggleButton.querySelector('i');
        const isDark = this.isDarkMode();

        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        this.toggleButton.setAttribute('aria-label', label);
        this.toggleButton.setAttribute('title', label);
    }

    /**
     * Configura listener para cambios en preferencias del sistema
     */
    private setupSystemListener(): void {
        this.mediaQuery.addEventListener('change', (e: MediaQueryListEvent) => {
            this.isSystemDark = e.matches;
            

            // Si el usuario no ha establecido preferencia, seguir al sistema
            if (!this.hasUserPreference) {
                const newDarkState = e.matches;
                this.body.classList.toggle(this.existingClass, newDarkState);
                this.html.setAttribute('data-theme', newDarkState ? 'dark' : 'light');
                this.updateToggleIcon();

                this.dispatchThemeEvent('themeChanged', {
                    isDark: newDarkState,
                    wasSystemTriggered: true
                });
            }
        });
    }

    /**
     * Configura sincronización entre pestañas
     */
    private setupStorageSync(): void {
        window.addEventListener('storage', (e: StorageEvent) => {
            if (e.key === this.storageKey && e.newValue !== e.oldValue) {
                
                const newDarkState = e.newValue === 'true';
                this.body.classList.toggle(this.existingClass, newDarkState);
                this.html.setAttribute('data-theme', newDarkState ? 'dark' : 'light');
                this.updateToggleIcon();
            }
        });
    }

    /**
     * Aplica mejoras CSS dinámicamente
     */
    private applyEnhancedCSS(): void {
        // Solo aplicar si themes.css no está ya cargado
        if (!document.querySelector('link[href*="themes.css"]')) {
            const themeLink = document.createElement('link');
            themeLink.rel = 'stylesheet';
            themeLink.href = 'css/themes.css';
            document.head.appendChild(themeLink);
            
        }
    }

    /**
     * Verifica si está en modo oscuro
     */
    isDarkMode(): boolean {
        return this.body.classList.contains(this.existingClass);
    }

    /**
     * Establece el tema directamente
     */
    setTheme(dark: boolean): void {
        if (this.isDarkMode() !== dark) {
            this.toggleTheme();
        }
    }

    /**
     * Restablece a preferencias del sistema
     */
    resetToSystem(): void {
        localStorage.removeItem(this.storageKey);
        this.hasUserPreference = false;

        const systemDark = this.mediaQuery.matches;
        this.body.classList.toggle(this.existingClass, systemDark);
        this.html.setAttribute('data-theme', systemDark ? 'dark' : 'light');
        this.updateToggleIcon();

        
    }

    /**
     * Dispara eventos personalizados
     */
    private dispatchThemeEvent(eventName: ThemeEventName, detail: Omit<ThemeEventDetail, 'timestamp' | 'manager'>): void {
        const event = new CustomEvent<ThemeEventDetail>(eventName, {
            detail: {
                ...detail,
                timestamp: new Date().toISOString(),
                manager: this
            }
        });

        window.dispatchEvent(event);
        
    }

    /**
     * API pública para obtener información del tema
     */
    getThemeInfo(): ThemeInfo {
        return {
            isDark: this.isDarkMode(),
            isSystemDark: this.isSystemDark,
            hasUserPreference: this.hasUserPreference,
            storageKey: this.storageKey
        };
    }

    /**
     * Método para debugging
     */
    debug(): void {
        console.group('🐛 [THEME] Debug Info');
        
        
        
        
        
        console.groupEnd();
    }
}

// Singleton instance
export const themeManager = new ThemeManager();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).integratedThemeManager = themeManager;
    (window as any).themeManager = themeManager;
    (window as any).toggleTheme = () => themeManager.toggleTheme();
}

export default themeManager;
