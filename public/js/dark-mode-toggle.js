/**
 * DARK MODE TOGGLE - Sistema de Tema Oscuro
 * window.getTenantConfigValue('school_name', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'BGE Héroes')')')')')') de la Patria')
 * Fecha: 19 de Octubre, 2025
 */

class DarkModeManager {
    constructor() {
        this.STORAGE_KEY = 'bge-dark-mode';
        this.theme = this.loadTheme();
        this.init();
    }

    init() {
        // Aplicar tema guardado al cargar
        this.applyTheme(this.theme);

        // Crear toggle button si no existe
        this.createToggleButton();

        // Escuchar cambios de preferencia del sistema
        this.watchSystemPreference();
    }

    loadTheme() {
        // 1. Intentar cargar desde localStorage
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (savedTheme) return savedTheme;

        // 2. Detectar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // 3. Default: light
        return 'light';
    }

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Actualizar icono del toggle
        this.updateToggleIcon();

        // Emit event para que otros componentes puedan reaccionar
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    createToggleButton() {
        // Buscar si ya existe
        if (document.getElementById('dark-mode-toggle')) return;

        // Crear botón flotante
        const button = document.createElement('button');
        button.id = 'dark-mode-toggle';
        button.className = 'dark-mode-toggle';
        button.setAttribute('aria-label', 'Toggle Dark Mode');
        button.innerHTML = DOMPurify.sanitize(this.getIcon(this.theme));

        button.addEventListener('click', () => this.toggleTheme());

        document.body.appendChild(button);
    }

    updateToggleIcon() {
        const button = document.getElementById('dark-mode-toggle');
        if (button) {
            button.innerHTML = DOMPurify.sanitize(this.getIcon(this.theme));
        }
    }

    getIcon(theme) {
        if (theme === 'dark') {
            // Sun icon (para cambiar a light)
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
            `;
        } else {
            // Moon icon (para cambiar a dark)
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
            `;
        }
    }

    watchSystemPreference() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            // Solo aplicar si el usuario no ha configurado manualmente
            const hasManualPreference = localStorage.getItem(this.STORAGE_KEY);
            if (!hasManualPreference) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // API pública
    getCurrentTheme() {
        return this.theme;
    }

    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn('Invalid theme:', theme);
            return;
        }
        this.applyTheme(theme);
    }
}

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.darkModeManager = new DarkModeManager();
        });
    } else {
        window.darkModeManager = new DarkModeManager();
    }
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}
