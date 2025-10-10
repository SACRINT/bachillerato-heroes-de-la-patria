/**
 * 🎨 SISTEMA DE PERSONALIZACIÓN AVANZADA
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema completo de personalización de interfaz y experiencia de usuario
 */

class AdvancedPersonalizationSystem {
    constructor() {
        this.userId = null;
        this.currentTheme = 'default';
        this.preferences = {
            theme: 'default',
            fontSize: 'medium',
            fontFamily: 'system',
            colorScheme: 'blue',
            layout: 'default',
            animations: true,
            compactMode: false,
            highContrast: false,
            sidebar: 'expanded',
            quickActions: [],
            dashboardWidgets: [],
            language: 'es'
        };

        this.themes = {
            default: {
                name: 'BGE Clásico',
                colors: {
                    primary: '#007bff',
                    secondary: '#6c757d',
                    success: '#28a745',
                    info: '#17a2b8',
                    warning: '#ffc107',
                    danger: '#dc3545',
                    light: '#f8f9fa',
                    dark: '#343a40'
                }
            },
            heroesPatria: {
                name: 'Héroes de la Patria',
                colors: {
                    primary: '#1e4d72',
                    secondary: '#8b4513',
                    success: '#2e7d32',
                    info: '#00796b',
                    warning: '#f57c00',
                    danger: '#c62828',
                    light: '#f5f5f5',
                    dark: '#2c3e50'
                }
            },
            ocean: {
                name: 'Océano',
                colors: {
                    primary: '#0077be',
                    secondary: '#4a90a4',
                    success: '#00c851',
                    info: '#33b5e5',
                    warning: '#ffbb33',
                    danger: '#ff4444',
                    light: '#e3f2fd',
                    dark: '#263238'
                }
            },
            forest: {
                name: 'Bosque',
                colors: {
                    primary: '#2e7d32',
                    secondary: '#558b2f',
                    success: '#4caf50',
                    info: '#00acc1',
                    warning: '#ff9800',
                    danger: '#f44336',
                    light: '#e8f5e8',
                    dark: '#1b5e20'
                }
            },
            sunset: {
                name: 'Atardecer',
                colors: {
                    primary: '#ff6f00',
                    secondary: '#bf360c',
                    success: '#388e3c',
                    info: '#0288d1',
                    warning: '#ffa000',
                    danger: '#d32f2f',
                    light: '#fff3e0',
                    dark: '#e65100'
                }
            }
        };

        this.fontSizes = {
            small: { name: 'Pequeño', scale: 0.875 },
            medium: { name: 'Mediano', scale: 1 },
            large: { name: 'Grande', scale: 1.125 },
            xlarge: { name: 'Muy Grande', scale: 1.25 }
        };

        this.fontFamilies = {
            system: { name: 'Sistema', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
            arial: { name: 'Arial', family: 'Arial, sans-serif' },
            georgia: { name: 'Georgia', family: 'Georgia, serif' },
            verdana: { name: 'Verdana', family: 'Verdana, sans-serif' },
            times: { name: 'Times', family: '"Times New Roman", serif' }
        };

        this.layouts = {
            default: { name: 'Estándar', class: 'layout-default' },
            compact: { name: 'Compacto', class: 'layout-compact' },
            spacious: { name: 'Espacioso', class: 'layout-spacious' },
            sidebar: { name: 'Barra Lateral', class: 'layout-sidebar' }
        };

        this.availableWidgets = [
            { id: 'welcome', name: 'Bienvenida', icon: '👋', category: 'general' },
            { id: 'quick-actions', name: 'Acciones Rápidas', icon: '⚡', category: 'navigation' },
            { id: 'notifications', name: 'Notificaciones', icon: '🔔', category: 'communication' },
            { id: 'calendar', name: 'Calendario', icon: '📅', category: 'academic' },
            { id: 'grades', name: 'Calificaciones', icon: '📊', category: 'academic' },
            { id: 'announcements', name: 'Avisos', icon: '📢', category: 'communication' },
            { id: 'weather', name: 'Clima', icon: '🌤️', category: 'general' },
            { id: 'shortcuts', name: 'Atajos', icon: '🔗', category: 'navigation' },
            { id: 'recent-activity', name: 'Actividad Reciente', icon: '📈', category: 'general' },
            { id: 'ai-assistant', name: 'Asistente IA', icon: '🤖', category: 'tools' }
        ];

        this.init();
    }

    init() {
        this.loadUserPreferences();
        this.createPersonalizationUI();
        this.applyCurrentPreferences();
        this.setupEventListeners();
        this.initializeCustomizations();

        console.log('🎨 [PERSONALIZACIÓN] Sistema inicializado con preferencias:', this.preferences);
    }

    loadUserPreferences() {
        // Cargar preferencias del localStorage
        const saved = localStorage.getItem('bge_personalization_preferences');
        if (saved) {
            try {
                const savedPrefs = JSON.parse(saved);
                this.preferences = { ...this.preferences, ...savedPrefs };
            } catch (error) {
                console.warn('Error cargando preferencias:', error);
            }
        }

        // Detectar preferencias del sistema
        this.detectSystemPreferences();
    }

    detectSystemPreferences() {
        // Detectar tema del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            if (!localStorage.getItem('bge_personalization_preferences')) {
                // Solo aplicar si no hay preferencias guardadas
                document.body.classList.add('dark-mode');
            }
        }

        // Detectar preferencias de animación
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.preferences.animations = false;
        }

        // Detectar preferencias de contraste
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            this.preferences.highContrast = true;
        }
    }

    savePreferences() {
        localStorage.setItem('bge_personalization_preferences', JSON.stringify(this.preferences));
        console.log('💾 [PERSONALIZACIÓN] Preferencias guardadas');
    }

    createPersonalizationUI() {
        // Crear botón de personalización si no existe
        if (!document.getElementById('personalization-btn')) {
            const personalizationBtn = document.createElement('button');
            personalizationBtn.id = 'personalization-btn';
            personalizationBtn.innerHTML = '🎨';
            personalizationBtn.title = 'Personalizar interfaz';
            personalizationBtn.style.cssText = `
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                font-size: 20px;
                cursor: pointer;
                z-index: 9998;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            personalizationBtn.addEventListener('click', () => this.openPersonalizationPanel());
            personalizationBtn.addEventListener('mouseenter', () => {
                personalizationBtn.style.transform = 'translateY(-50%) scale(1.1)';
                personalizationBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            });
            personalizationBtn.addEventListener('mouseleave', () => {
                personalizationBtn.style.transform = 'translateY(-50%) scale(1)';
                personalizationBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            });

            document.body.appendChild(personalizationBtn);
        }

        // Crear panel de personalización
        this.createPersonalizationPanel();
    }

    createPersonalizationPanel() {
        const panel = document.createElement('div');
        panel.id = 'personalization-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: -5px 0 20px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        panel.innerHTML = `
            <div style="padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #333;">🎨 Personalización</h2>
                    <button onclick="advancedPersonalization.closePersonalizationPanel()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Personaliza tu experiencia en el portal</p>
            </div>

            <div style="padding: 20px;">
                <!-- Temas -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">🌈 Temas</h3>
                    <div id="theme-selector" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${Object.entries(this.themes).map(([key, theme]) => `
                            <div class="theme-option ${this.preferences.theme === key ? 'active' : ''}"
                                 onclick="advancedPersonalization.setTheme('${key}')"
                                 style="
                                     padding: 15px;
                                     border: 2px solid ${this.preferences.theme === key ? theme.colors.primary : 'transparent'};
                                     border-radius: 12px;
                                     cursor: pointer;
                                     text-align: center;
                                     background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
                                     color: white;
                                     transition: all 0.3s ease;
                                     font-weight: bold;
                                 ">
                                <div style="font-size: 12px; margin-bottom: 5px;">${theme.name}</div>
                                <div style="display: flex; gap: 2px; justify-content: center;">
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${theme.colors.primary};"></div>
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${theme.colors.secondary};"></div>
                                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${theme.colors.success};"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Tamaño de fuente -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📏 Tamaño de Texto</h3>
                    <div style="display: flex; gap: 10px;">
                        ${Object.entries(this.fontSizes).map(([key, size]) => `
                            <button onclick="advancedPersonalization.setFontSize('${key}')"
                                    class="font-size-btn ${this.preferences.fontSize === key ? 'active' : ''}"
                                    style="
                                        flex: 1;
                                        padding: 10px;
                                        border: 2px solid ${this.preferences.fontSize === key ? '#007bff' : '#ddd'};
                                        border-radius: 8px;
                                        background: ${this.preferences.fontSize === key ? '#007bff' : 'white'};
                                        color: ${this.preferences.fontSize === key ? 'white' : '#333'};
                                        cursor: pointer;
                                        font-size: ${size.scale}rem;
                                        transition: all 0.3s ease;
                                    ">${size.name}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- Familia de fuente -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">🔤 Tipo de Letra</h3>
                    <select onchange="advancedPersonalization.setFontFamily(this.value)"
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #ddd;
                                border-radius: 8px;
                                font-size: 16px;
                                background: white;
                            ">
                        ${Object.entries(this.fontFamilies).map(([key, font]) => `
                            <option value="${key}" ${this.preferences.fontFamily === key ? 'selected' : ''}
                                    style="font-family: ${font.family};">${font.name}</option>
                        `).join('')}
                    </select>
                </div>

                <!-- Layout -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📐 Diseño</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        ${Object.entries(this.layouts).map(([key, layout]) => `
                            <button onclick="advancedPersonalization.setLayout('${key}')"
                                    class="layout-btn ${this.preferences.layout === key ? 'active' : ''}"
                                    style="
                                        padding: 12px;
                                        border: 2px solid ${this.preferences.layout === key ? '#007bff' : '#ddd'};
                                        border-radius: 8px;
                                        background: ${this.preferences.layout === key ? '#007bff' : 'white'};
                                        color: ${this.preferences.layout === key ? 'white' : '#333'};
                                        cursor: pointer;
                                        font-size: 14px;
                                        transition: all 0.3s ease;
                                    ">${layout.name}</button>
                        `).join('')}
                    </div>
                </div>

                <!-- Opciones de accesibilidad -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">♿ Accesibilidad</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" ${this.preferences.animations ? 'checked' : ''}
                                   onchange="advancedPersonalization.toggleAnimations(this.checked)"
                                   style="width: 20px; height: 20px;">
                            <span>Animaciones activas</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" ${this.preferences.highContrast ? 'checked' : ''}
                                   onchange="advancedPersonalization.toggleHighContrast(this.checked)"
                                   style="width: 20px; height: 20px;">
                            <span>Alto contraste</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" ${this.preferences.compactMode ? 'checked' : ''}
                                   onchange="advancedPersonalization.toggleCompactMode(this.checked)"
                                   style="width: 20px; height: 20px;">
                            <span>Modo compacto</span>
                        </label>
                    </div>
                </div>

                <!-- Widgets del dashboard -->
                <div class="personalization-section" style="margin-bottom: 30px;">
                    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📊 Widgets del Dashboard</h3>
                    <div id="widgets-selector" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${this.availableWidgets.map(widget => `
                            <label style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 8px;
                                border: 1px solid #ddd;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                                <input type="checkbox"
                                       ${this.preferences.dashboardWidgets.includes(widget.id) ? 'checked' : ''}
                                       onchange="advancedPersonalization.toggleWidget('${widget.id}', this.checked)">
                                <span>${widget.icon} ${widget.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <!-- Botones de acción -->
                <div style="display: flex; gap: 10px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button onclick="advancedPersonalization.resetToDefaults()"
                            style="
                                flex: 1;
                                padding: 12px;
                                border: 2px solid #dc3545;
                                border-radius: 8px;
                                background: white;
                                color: #dc3545;
                                cursor: pointer;
                                font-weight: bold;
                            ">Restablecer</button>
                    <button onclick="advancedPersonalization.exportSettings()"
                            style="
                                flex: 1;
                                padding: 12px;
                                border: 2px solid #28a745;
                                border-radius: 8px;
                                background: #28a745;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                            ">Exportar</button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    setupEventListeners() {
        // Escuchar cambios en las preferencias del sistema
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('user_theme_preference')) {
                    document.body.classList.toggle('dark-mode', e.matches);
                }
            });

            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.preferences.animations = !e.matches;
                this.applyAnimationPreferences();
            });
        }

        // Escuchar eventos de personalización
        window.addEventListener('personalizationChange', (e) => {
            console.log('🎨 [PERSONALIZACIÓN] Cambio detectado:', e.detail);
        });
    }

    openPersonalizationPanel() {
        const panel = document.getElementById('personalization-panel');
        if (panel) {
            panel.style.right = '0px';
            document.body.style.overflow = 'hidden';
        }
    }

    closePersonalizationPanel() {
        const panel = document.getElementById('personalization-panel');
        if (panel) {
            panel.style.right = '-400px';
            document.body.style.overflow = 'auto';
        }
    }

    setTheme(themeKey) {
        this.preferences.theme = themeKey;
        this.applyTheme(themeKey);
        this.savePreferences();
        this.updateThemeSelector();

        window.dispatchEvent(new CustomEvent('personalizationChange', {
            detail: { type: 'theme', value: themeKey }
        }));
    }

    applyTheme(themeKey) {
        const theme = this.themes[themeKey];
        if (!theme) return;

        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, color]) => {
            root.style.setProperty(`--bs-${key}`, color);
            root.style.setProperty(`--color-${key}`, color);
        });

        // Aplicar clase del tema
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeKey}`);
    }

    updateThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach((option, index) => {
            const themeKey = Object.keys(this.themes)[index];
            const theme = this.themes[themeKey];

            if (themeKey === this.preferences.theme) {
                option.classList.add('active');
                option.style.borderColor = theme.colors.primary;
            } else {
                option.classList.remove('active');
                option.style.borderColor = 'transparent';
            }
        });
    }

    setFontSize(sizeKey) {
        this.preferences.fontSize = sizeKey;
        this.applyFontSize(sizeKey);
        this.savePreferences();
        this.updateFontSizeButtons();
    }

    applyFontSize(sizeKey) {
        const size = this.fontSizes[sizeKey];
        if (!size) return;

        document.documentElement.style.setProperty('--font-scale', size.scale);
        document.body.style.fontSize = `${size.scale}rem`;
    }

    updateFontSizeButtons() {
        const buttons = document.querySelectorAll('.font-size-btn');
        buttons.forEach((btn, index) => {
            const sizeKey = Object.keys(this.fontSizes)[index];
            if (sizeKey === this.preferences.fontSize) {
                btn.classList.add('active');
                btn.style.background = '#007bff';
                btn.style.color = 'white';
                btn.style.borderColor = '#007bff';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'white';
                btn.style.color = '#333';
                btn.style.borderColor = '#ddd';
            }
        });
    }

    setFontFamily(familyKey) {
        this.preferences.fontFamily = familyKey;
        this.applyFontFamily(familyKey);
        this.savePreferences();
    }

    applyFontFamily(familyKey) {
        const family = this.fontFamilies[familyKey];
        if (!family) return;

        document.body.style.fontFamily = family.family;
        document.documentElement.style.setProperty('--font-family', family.family);
    }

    setLayout(layoutKey) {
        this.preferences.layout = layoutKey;
        this.applyLayout(layoutKey);
        this.savePreferences();
        this.updateLayoutButtons();
    }

    applyLayout(layoutKey) {
        const layout = this.layouts[layoutKey];
        if (!layout) return;

        // Remover clases de layout anteriores
        Object.values(this.layouts).forEach(l => {
            document.body.classList.remove(l.class);
        });

        // Aplicar nueva clase de layout
        document.body.classList.add(layout.class);
    }

    updateLayoutButtons() {
        const buttons = document.querySelectorAll('.layout-btn');
        buttons.forEach((btn, index) => {
            const layoutKey = Object.keys(this.layouts)[index];
            if (layoutKey === this.preferences.layout) {
                btn.classList.add('active');
                btn.style.background = '#007bff';
                btn.style.color = 'white';
                btn.style.borderColor = '#007bff';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'white';
                btn.style.color = '#333';
                btn.style.borderColor = '#ddd';
            }
        });
    }

    toggleAnimations(enabled) {
        this.preferences.animations = enabled;
        this.applyAnimationPreferences();
        this.savePreferences();
    }

    applyAnimationPreferences() {
        document.body.classList.toggle('reduced-motion', !this.preferences.animations);

        if (!this.preferences.animations) {
            const style = document.createElement('style');
            style.id = 'reduced-motion-style';
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        } else {
            const existingStyle = document.getElementById('reduced-motion-style');
            if (existingStyle) {
                existingStyle.remove();
            }
        }
    }

    toggleHighContrast(enabled) {
        this.preferences.highContrast = enabled;
        document.body.classList.toggle('high-contrast', enabled);
        this.savePreferences();
    }

    toggleCompactMode(enabled) {
        this.preferences.compactMode = enabled;
        document.body.classList.toggle('compact-mode', enabled);
        this.savePreferences();
    }

    toggleWidget(widgetId, enabled) {
        if (enabled) {
            if (!this.preferences.dashboardWidgets.includes(widgetId)) {
                this.preferences.dashboardWidgets.push(widgetId);
            }
        } else {
            this.preferences.dashboardWidgets = this.preferences.dashboardWidgets.filter(id => id !== widgetId);
        }
        this.savePreferences();
        this.updateDashboard();
    }

    updateDashboard() {
        // Actualizar widgets del dashboard
        const dashboardContainer = document.querySelector('.dashboard-widgets');
        if (dashboardContainer) {
            // Limpiar widgets existentes
            dashboardContainer.innerHTML = '';

            // Agregar widgets seleccionados
            this.preferences.dashboardWidgets.forEach(widgetId => {
                const widget = this.availableWidgets.find(w => w.id === widgetId);
                if (widget) {
                    const widgetElement = this.createWidgetElement(widget);
                    dashboardContainer.appendChild(widgetElement);
                }
            });
        }
    }

    createWidgetElement(widget) {
        const element = document.createElement('div');
        element.className = `dashboard-widget widget-${widget.id}`;
        element.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        `;

        element.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <span style="font-size: 24px;">${widget.icon}</span>
                <h3 style="margin: 0; font-size: 18px;">${widget.name}</h3>
            </div>
            <div class="widget-content">
                <p>Contenido del widget ${widget.name}</p>
            </div>
        `;

        return element;
    }

    applyCurrentPreferences() {
        this.applyTheme(this.preferences.theme);
        this.applyFontSize(this.preferences.fontSize);
        this.applyFontFamily(this.preferences.fontFamily);
        this.applyLayout(this.preferences.layout);
        this.applyAnimationPreferences();

        document.body.classList.toggle('high-contrast', this.preferences.highContrast);
        document.body.classList.toggle('compact-mode', this.preferences.compactMode);
    }

    initializeCustomizations() {
        // Agregar estilos CSS para personalización
        const customStyles = document.createElement('style');
        customStyles.id = 'personalization-styles';
        customStyles.textContent = `
            /* Estilos de layout */
            .layout-compact .container { padding: 10px !important; }
            .layout-compact .card-body { padding: 15px !important; }
            .layout-spacious .container { padding: 30px !important; }
            .layout-spacious .card-body { padding: 30px !important; }

            /* Alto contraste */
            .high-contrast {
                filter: contrast(1.5) brightness(1.2);
            }

            .high-contrast .btn {
                border-width: 2px !important;
                font-weight: bold !important;
            }

            /* Modo compacto */
            .compact-mode .btn { padding: 6px 12px !important; }
            .compact-mode .card { margin-bottom: 10px !important; }
            .compact-mode .navbar { padding: 0.25rem 1rem !important; }
        `;

        document.head.appendChild(customStyles);
    }

    resetToDefaults() {
        if (confirm('¿Estás seguro de que quieres restablecer todas las preferencias a los valores predeterminados?')) {
            // Limpiar localStorage
            localStorage.removeItem('bge_personalization_preferences');

            // Restablecer preferencias
            this.preferences = {
                theme: 'default',
                fontSize: 'medium',
                fontFamily: 'system',
                colorScheme: 'blue',
                layout: 'default',
                animations: true,
                compactMode: false,
                highContrast: false,
                sidebar: 'expanded',
                quickActions: [],
                dashboardWidgets: [],
                language: 'es'
            };

            // Aplicar preferencias
            this.applyCurrentPreferences();

            // Actualizar UI
            this.closePersonalizationPanel();
            setTimeout(() => {
                this.createPersonalizationPanel();
            }, 500);

            console.log('🔄 [PERSONALIZACIÓN] Preferencias restablecidas');
        }
    }

    exportSettings() {
        const settings = {
            preferences: this.preferences,
            timestamp: Date.now(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bge-personalization-settings.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log('📤 [PERSONALIZACIÓN] Configuración exportada');
    }

    importSettings(settingsFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                if (settings.preferences) {
                    this.preferences = { ...this.preferences, ...settings.preferences };
                    this.applyCurrentPreferences();
                    this.savePreferences();
                    console.log('📥 [PERSONALIZACIÓN] Configuración importada');
                }
            } catch (error) {
                console.error('Error importando configuración:', error);
                alert('Error al importar la configuración');
            }
        };
        reader.readAsText(settingsFile);
    }

    // API pública
    getCurrentTheme() {
        return this.preferences.theme;
    }

    getPreferences() {
        return { ...this.preferences };
    }

    setPreference(key, value) {
        this.preferences[key] = value;
        this.savePreferences();
        this.applyCurrentPreferences();
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.advancedPersonalization = new AdvancedPersonalizationSystem();
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedPersonalizationSystem;
}