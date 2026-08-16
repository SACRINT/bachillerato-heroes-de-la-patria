/**
 * THEME MANAGER INTEGRADO - SISTEMA DE GESTIÓN DE TEMAS
 * window.getTenantConfigValue('school_name', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'BGE Héroes')')')')')') de la Patria') - Integración con sistema existente
 *
 * Mejora el sistema existente de modo oscuro con:
 * - Detección automática de preferencias del sistema
 * - Variables CSS avanzadas
 * - Mejor accesibilidad y transiciones
 * - Sincronización entre pestañas
 */

class IntegratedThemeManager {
    constructor() {
        

        // Configuración integrada con sistema existente
        this.storageKey = 'heroesPatria_darkMode'; // Usar el key existente
        this.existingClass = 'dark-mode'; // Usar la clase CSS existente
        this.toggleSelector = '#darkModeToggle'; // Usar el botón flotante existente

        // Media query para detección del sistema
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Referencias DOM
        this.body = document.body;
        this.html = document.documentElement;
        this.toggleButton = null;

        // Estado
        this.isSystemDark = this.mediaQuery.matches;
        this.hasUserPreference = localStorage.getItem(this.storageKey) !== null;

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
    init() {
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

            

            // Evento personalizado de inicialización
            this.dispatchEvent('themeManagerReady', {
                isDark: this.isDarkMode(),
                isSystemDark: this.isSystemDark,
                hasUserPreference: this.hasUserPreference
            });

        } catch (error) {
            console.error('❌ [THEME] Error inicializando Theme Manager:', error);
        }
    }

    /**
     * Detecta y aplica el tema correcto
     */
    detectAndApplyTheme() {
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
    setupExistingToggle() {
        // Buscar el botón existente con múltiples intentos
        const findToggle = () => {
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
    enhanceToggleButton() {
        if (!this.toggleButton) return;

        

        // Actualizar icono inicial
        this.updateToggleIcon();

        // Remover listeners previos y añadir el nuestro
        const newButton = this.toggleButton.cloneNode(true);
        this.toggleButton.parentNode.replaceChild(newButton, this.toggleButton);
        this.toggleButton = newButton;

        // Añadir nuestro listener mejorado
        this.toggleButton.addEventListener('click', () => this.toggleTheme());

        // Mejorar accesibilidad
        this.toggleButton.setAttribute('title', this.isDarkMode() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }

    /**
     * Alterna el tema
     */
    toggleTheme() {
        const wasWasDark = this.isDarkMode();
        const newDarkState = !wasWasDark;

        

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
        this.dispatchEvent('themeChanged', {
            isDark: newDarkState,
            wasSystemTriggered: false
        });
    }

    /**
     * Actualiza el icono del toggle
     */
    updateToggleIcon() {
        if (!this.toggleButton) return;

        const icon = this.toggleButton.querySelector('i');
        const isDark = this.isDarkMode();

        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }

        this.toggleButton.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
        this.toggleButton.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }

    /**
     * Configura listener para cambios en preferencias del sistema
     */
    setupSystemListener() {
        this.mediaQuery.addEventListener('change', (e) => {
            this.isSystemDark = e.matches;
            

            // Si el usuario no ha establecido preferencia, seguir al sistema
            if (!this.hasUserPreference) {
                const newDarkState = e.matches;
                this.body.classList.toggle(this.existingClass, newDarkState);
                this.html.setAttribute('data-theme', newDarkState ? 'dark' : 'light');
                this.updateToggleIcon();

                this.dispatchEvent('themeChanged', {
                    isDark: newDarkState,
                    wasSystemTriggered: true
                });
            }
        });
    }

    /**
     * Configura sincronización entre pestañas
     */
    setupStorageSync() {
        window.addEventListener('storage', (e) => {
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
    applyEnhancedCSS() {
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
    isDarkMode() {
        return this.body.classList.contains(this.existingClass);
    }

    /**
     * Dispara eventos personalizados
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
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
    getThemeInfo() {
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
    debug() {
        console.group('🐛 [THEME] Debug Info');
        
        
        
        
        console.groupEnd();
    }
}

// ==============================================
// INICIALIZACIÓN AUTOMÁTICA
// ==============================================

// Solo inicializar si no existe ya una instancia
if (!window.integratedThemeManager) {
    window.integratedThemeManager = new IntegratedThemeManager();

    // Método de conveniencia global
    window.toggleTheme = () => window.integratedThemeManager.toggleTheme();

    
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegratedThemeManager;
}

