/**
 * ♿ ACCESSIBILITY SERVICE - v1.0.0
 * Servicio de accesibilidad WCAG 2.1 AAA para BGE
 *
 * v5.1.0 Features
 * Fecha: 19 Noviembre 2025
 *
 * Cumplimiento:
 * - WCAG 2.1 Level AAA
 * - Section 508
 * - ADA Compliance
 */

(function() {
  'use strict';

  // Configuración
  const STORAGE_KEY = 'bge_accessibility';
  const DEFAULT_SETTINGS = {
    fontSize: 100,           // Porcentaje (100 = normal)
    highContrast: false,     // Alto contraste
    reducedMotion: false,    // Reducir animaciones
    dyslexicFont: false,     // Fuente para dislexia
    lineSpacing: 100,        // Espaciado de línea (porcentaje)
    letterSpacing: 0,        // Espaciado de letras (px)
    focusHighlight: true,    // Resaltar elemento enfocado
    readingGuide: false,     // Guía de lectura
    textToSpeech: false,     // Lectura en voz alta
    keyboardNav: true,       // Navegación por teclado mejorada
    autoSkipLinks: true,     // Links de salto automáticos
    colorBlindMode: 'none'   // none, protanopia, deuteranopia, tritanopia
  };

  // CSS para modos de daltonismo
  const COLOR_BLIND_FILTERS = {
    none: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)'
  };

  class AccessibilityService {
    constructor() {
      this.settings = this._loadSettings();
      this.speechSynthesis = window.speechSynthesis;
      this.currentUtterance = null;
      this.readingGuideEl = null;
      this.initialized = false;
    }

    /**
     * Inicializar servicio de accesibilidad
     */
    init() {
      if (this.initialized) return;

      this._createSkipLinks();
      this._createAccessibilityPanel();
      this._createColorBlindFilters();
      this._applySettings();
      this._setupKeyboardNavigation();
      this._setupFocusManagement();
      this._announcePageLoad();

      this.initialized = true;
      console.log('[Accessibility] Servicio inicializado');
    }

    /**
     * Obtener configuración actual
     */
    getSettings() {
      return { ...this.settings };
    }

    /**
     * Actualizar configuración
     * @param {Object} newSettings - Nuevas configuraciones
     */
    updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      this._saveSettings();
      this._applySettings();
    }

    /**
     * Restablecer configuración por defecto
     */
    resetSettings() {
      this.settings = { ...DEFAULT_SETTINGS };
      this._saveSettings();
      this._applySettings();
    }

    // ==================== FONT SIZE ====================

    /**
     * Aumentar tamaño de fuente
     */
    increaseFontSize() {
      if (this.settings.fontSize < 200) {
        this.settings.fontSize += 10;
        this._applyFontSize();
        this._saveSettings();
        this._announce(`Tamaño de fuente: ${this.settings.fontSize}%`);
      }
    }

    /**
     * Disminuir tamaño de fuente
     */
    decreaseFontSize() {
      if (this.settings.fontSize > 50) {
        this.settings.fontSize -= 10;
        this._applyFontSize();
        this._saveSettings();
        this._announce(`Tamaño de fuente: ${this.settings.fontSize}%`);
      }
    }

    /**
     * Restablecer tamaño de fuente
     */
    resetFontSize() {
      this.settings.fontSize = 100;
      this._applyFontSize();
      this._saveSettings();
      this._announce('Tamaño de fuente restablecido');
    }

    // ==================== CONTRAST ====================

    /**
     * Alternar alto contraste
     */
    toggleHighContrast() {
      this.settings.highContrast = !this.settings.highContrast;
      this._applyHighContrast();
      this._saveSettings();
      this._announce(this.settings.highContrast ? 'Alto contraste activado' : 'Alto contraste desactivado');
    }

    // ==================== MOTION ====================

    /**
     * Alternar reducción de movimiento
     */
    toggleReducedMotion() {
      this.settings.reducedMotion = !this.settings.reducedMotion;
      this._applyReducedMotion();
      this._saveSettings();
      this._announce(this.settings.reducedMotion ? 'Animaciones reducidas' : 'Animaciones normales');
    }

    // ==================== DYSLEXIC FONT ====================

    /**
     * Alternar fuente para dislexia
     */
    toggleDyslexicFont() {
      this.settings.dyslexicFont = !this.settings.dyslexicFont;
      this._applyDyslexicFont();
      this._saveSettings();
      this._announce(this.settings.dyslexicFont ? 'Fuente OpenDyslexic activada' : 'Fuente normal');
    }

    // ==================== LINE SPACING ====================

    /**
     * Aumentar espaciado de línea
     */
    increaseLineSpacing() {
      if (this.settings.lineSpacing < 200) {
        this.settings.lineSpacing += 25;
        this._applyLineSpacing();
        this._saveSettings();
        this._announce(`Espaciado de línea: ${this.settings.lineSpacing}%`);
      }
    }

    /**
     * Disminuir espaciado de línea
     */
    decreaseLineSpacing() {
      if (this.settings.lineSpacing > 100) {
        this.settings.lineSpacing -= 25;
        this._applyLineSpacing();
        this._saveSettings();
        this._announce(`Espaciado de línea: ${this.settings.lineSpacing}%`);
      }
    }

    // ==================== READING GUIDE ====================

    /**
     * Alternar guía de lectura
     */
    toggleReadingGuide() {
      this.settings.readingGuide = !this.settings.readingGuide;
      this._applyReadingGuide();
      this._saveSettings();
      this._announce(this.settings.readingGuide ? 'Guía de lectura activada' : 'Guía de lectura desactivada');
    }

    // ==================== TEXT TO SPEECH ====================

    /**
     * Leer texto en voz alta
     * @param {string} text - Texto a leer
     */
    speak(text) {
      if (!this.speechSynthesis) return;

      this.stopSpeaking();

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance.lang = document.documentElement.lang || 'es';
      this.currentUtterance.rate = 0.9;
      this.currentUtterance.pitch = 1;

      this.speechSynthesis.speak(this.currentUtterance);
    }

    /**
     * Leer elemento seleccionado
     */
    speakSelection() {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        this.speak(selection);
      }
    }

    /**
     * Detener lectura
     */
    stopSpeaking() {
      if (this.speechSynthesis) {
        this.speechSynthesis.cancel();
      }
    }

    /**
     * Leer página completa
     */
    speakPage() {
      const mainContent = document.querySelector('main, [role="main"], .main-content, #content');
      if (mainContent) {
        this.speak(mainContent.textContent);
      }
    }

    // ==================== COLOR BLIND MODE ====================

    /**
     * Establecer modo de daltonismo
     * @param {string} mode - Modo (none, protanopia, deuteranopia, tritanopia)
     */
    setColorBlindMode(mode) {
      if (COLOR_BLIND_FILTERS[mode]) {
        this.settings.colorBlindMode = mode;
        this._applyColorBlindMode();
        this._saveSettings();
        this._announce(`Modo daltonismo: ${mode === 'none' ? 'desactivado' : mode}`);
      }
    }

    // ==================== KEYBOARD SHORTCUTS ====================

    /**
     * Mostrar atajos de teclado
     */
    showKeyboardShortcuts() {
      const shortcuts = [
        { key: 'Alt + 1', action: 'Ir al contenido principal' },
        { key: 'Alt + 2', action: 'Ir a navegación' },
        { key: 'Alt + 3', action: 'Ir a búsqueda' },
        { key: 'Alt + A', action: 'Abrir panel de accesibilidad' },
        { key: 'Alt + +', action: 'Aumentar fuente' },
        { key: 'Alt + -', action: 'Disminuir fuente' },
        { key: 'Alt + 0', action: 'Restablecer fuente' },
        { key: 'Alt + C', action: 'Alto contraste' },
        { key: 'Alt + M', action: 'Reducir movimiento' },
        { key: 'Alt + R', action: 'Guía de lectura' },
        { key: 'Alt + S', action: 'Leer selección' },
        { key: 'Escape', action: 'Detener lectura / Cerrar' }
      ];

      // Crear modal de atajos
      this._showShortcutsModal(shortcuts);
    }

    // ==================== MÉTODOS PRIVADOS ====================

    _loadSettings() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
      } catch {
        return { ...DEFAULT_SETTINGS };
      }
    }

    _saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('[Accessibility] No se pudo guardar configuración');
      }
    }

    _applySettings() {
      this._applyFontSize();
      this._applyHighContrast();
      this._applyReducedMotion();
      this._applyDyslexicFont();
      this._applyLineSpacing();
      this._applyLetterSpacing();
      this._applyFocusHighlight();
      this._applyReadingGuide();
      this._applyColorBlindMode();
    }

    _applyFontSize() {
      document.documentElement.style.fontSize = `${this.settings.fontSize}%`;
    }

    _applyHighContrast() {
      document.body.classList.toggle('high-contrast', this.settings.highContrast);

      if (this.settings.highContrast) {
        this._injectHighContrastStyles();
      } else {
        this._removeHighContrastStyles();
      }
    }

    _injectHighContrastStyles() {
      if (document.getElementById('a11y-high-contrast')) return;

      const style = document.createElement('style');
      style.id = 'a11y-high-contrast';
      style.textContent = `
        .high-contrast {
          filter: contrast(1.5) !important;
        }
        .high-contrast * {
          border-color: #000 !important;
        }
        .high-contrast a {
          color: #0000FF !important;
          text-decoration: underline !important;
        }
        .high-contrast a:visited {
          color: #800080 !important;
        }
        .high-contrast button,
        .high-contrast .btn {
          border: 2px solid #000 !important;
        }
        .high-contrast img {
          filter: contrast(1.2) !important;
        }
      `;
      document.head.appendChild(style);
    }

    _removeHighContrastStyles() {
      const style = document.getElementById('a11y-high-contrast');
      if (style) style.remove();
    }

    _applyReducedMotion() {
      document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);

      if (this.settings.reducedMotion) {
        this._injectReducedMotionStyles();
      } else {
        this._removeReducedMotionStyles();
      }
    }

    _injectReducedMotionStyles() {
      if (document.getElementById('a11y-reduced-motion')) return;

      const style = document.createElement('style');
      style.id = 'a11y-reduced-motion';
      style.textContent = `
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }

    _removeReducedMotionStyles() {
      const style = document.getElementById('a11y-reduced-motion');
      if (style) style.remove();
    }

    _applyDyslexicFont() {
      document.body.classList.toggle('dyslexic-font', this.settings.dyslexicFont);

      if (this.settings.dyslexicFont) {
        this._loadDyslexicFont();
      }
    }

    _loadDyslexicFont() {
      if (document.getElementById('a11y-dyslexic-font')) return;

      const link = document.createElement('link');
      link.id = 'a11y-dyslexic-font-css';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
      document.head.appendChild(link);

      const style = document.createElement('style');
      style.id = 'a11y-dyslexic-font';
      style.textContent = `
        .dyslexic-font,
        .dyslexic-font * {
          font-family: 'OpenDyslexic', sans-serif !important;
        }
      `;
      document.head.appendChild(style);
    }

    _applyLineSpacing() {
      document.documentElement.style.setProperty('--a11y-line-height', this.settings.lineSpacing / 100);

      if (!document.getElementById('a11y-line-spacing')) {
        const style = document.createElement('style');
        style.id = 'a11y-line-spacing';
        style.textContent = `
          body {
            line-height: var(--a11y-line-height, 1.5) !important;
          }
          p, li, td, th, label, span {
            line-height: inherit !important;
          }
        `;
        document.head.appendChild(style);
      }
    }

    _applyLetterSpacing() {
      document.documentElement.style.setProperty('--a11y-letter-spacing', `${this.settings.letterSpacing}px`);
    }

    _applyFocusHighlight() {
      if (this.settings.focusHighlight) {
        this._injectFocusStyles();
      } else {
        this._removeFocusStyles();
      }
    }

    _injectFocusStyles() {
      if (document.getElementById('a11y-focus-styles')) return;

      const style = document.createElement('style');
      style.id = 'a11y-focus-styles';
      style.textContent = `
        *:focus {
          outline: 3px solid #FF6B00 !important;
          outline-offset: 2px !important;
        }
        *:focus:not(:focus-visible) {
          outline: none !important;
        }
        *:focus-visible {
          outline: 3px solid #FF6B00 !important;
          outline-offset: 2px !important;
        }
      `;
      document.head.appendChild(style);
    }

    _removeFocusStyles() {
      const style = document.getElementById('a11y-focus-styles');
      if (style) style.remove();
    }

    _applyReadingGuide() {
      if (this.settings.readingGuide) {
        this._createReadingGuide();
      } else {
        this._removeReadingGuide();
      }
    }

    _createReadingGuide() {
      if (this.readingGuideEl) return;

      this.readingGuideEl = document.createElement('div');
      this.readingGuideEl.id = 'a11y-reading-guide';
      this.readingGuideEl.style.cssText = `
        position: fixed;
        left: 0;
        right: 0;
        height: 30px;
        background: rgba(255, 255, 0, 0.3);
        pointer-events: none;
        z-index: 99999;
        display: none;
      `;
      document.body.appendChild(this.readingGuideEl);

      document.addEventListener('mousemove', this._moveReadingGuide.bind(this));
    }

    _moveReadingGuide(e) {
      if (this.readingGuideEl && this.settings.readingGuide) {
        this.readingGuideEl.style.display = 'block';
        this.readingGuideEl.style.top = `${e.clientY - 15}px`;
      }
    }

    _removeReadingGuide() {
      if (this.readingGuideEl) {
        this.readingGuideEl.remove();
        this.readingGuideEl = null;
      }
    }

    _applyColorBlindMode() {
      document.documentElement.style.filter = COLOR_BLIND_FILTERS[this.settings.colorBlindMode] || 'none';
    }

    _createColorBlindFilters() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.display = 'none';
      svg.innerHTML = `
        <defs>
          <filter id="protanopia">
            <feColorMatrix type="matrix" values="
              0.567, 0.433, 0,     0, 0
              0.558, 0.442, 0,     0, 0
              0,     0.242, 0.758, 0, 0
              0,     0,     0,     1, 0"/>
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix type="matrix" values="
              0.625, 0.375, 0,   0, 0
              0.7,   0.3,   0,   0, 0
              0,     0.3,   0.7, 0, 0
              0,     0,     0,   1, 0"/>
          </filter>
          <filter id="tritanopia">
            <feColorMatrix type="matrix" values="
              0.95, 0.05,  0,     0, 0
              0,    0.433, 0.567, 0, 0
              0,    0.475, 0.525, 0, 0
              0,    0,     0,     1, 0"/>
          </filter>
        </defs>
      `;
      document.body.appendChild(svg);
    }

    _createSkipLinks() {
      if (document.getElementById('a11y-skip-links')) return;

      const skipLinks = document.createElement('div');
      skipLinks.id = 'a11y-skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Saltar al contenido principal</a>
        <a href="#navigation" class="skip-link">Saltar a navegación</a>
        <a href="#search" class="skip-link">Saltar a búsqueda</a>
      `;

      const style = document.createElement('style');
      style.textContent = `
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #000;
          color: #fff;
          padding: 8px 16px;
          z-index: 100000;
          text-decoration: none;
          font-weight: bold;
        }
        .skip-link:focus {
          top: 0;
        }
      `;
      document.head.appendChild(style);
      document.body.insertBefore(skipLinks, document.body.firstChild);
    }

    _createAccessibilityPanel() {
      if (document.getElementById('a11y-panel')) return;

      const panel = document.createElement('div');
      panel.id = 'a11y-panel';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Panel de accesibilidad');
      panel.innerHTML = `
        <div class="a11y-panel-content">
          <h2>Opciones de Accesibilidad</h2>
          <button class="a11y-close" aria-label="Cerrar panel">&times;</button>

          <div class="a11y-section">
            <h3>Tamaño de texto</h3>
            <div class="a11y-controls">
              <button data-action="decrease-font" aria-label="Disminuir fuente">A-</button>
              <span class="a11y-value" id="font-size-value">100%</span>
              <button data-action="increase-font" aria-label="Aumentar fuente">A+</button>
            </div>
          </div>

          <div class="a11y-section">
            <h3>Espaciado de línea</h3>
            <div class="a11y-controls">
              <button data-action="decrease-spacing" aria-label="Disminuir espaciado">-</button>
              <span class="a11y-value" id="line-spacing-value">100%</span>
              <button data-action="increase-spacing" aria-label="Aumentar espaciado">+</button>
            </div>
          </div>

          <div class="a11y-section">
            <h3>Opciones visuales</h3>
            <label class="a11y-toggle">
              <input type="checkbox" data-setting="highContrast">
              <span>Alto contraste</span>
            </label>
            <label class="a11y-toggle">
              <input type="checkbox" data-setting="reducedMotion">
              <span>Reducir animaciones</span>
            </label>
            <label class="a11y-toggle">
              <input type="checkbox" data-setting="dyslexicFont">
              <span>Fuente para dislexia</span>
            </label>
            <label class="a11y-toggle">
              <input type="checkbox" data-setting="readingGuide">
              <span>Guía de lectura</span>
            </label>
          </div>

          <div class="a11y-section">
            <h3>Daltonismo</h3>
            <select data-setting="colorBlindMode">
              <option value="none">Normal</option>
              <option value="protanopia">Protanopia</option>
              <option value="deuteranopia">Deuteranopia</option>
              <option value="tritanopia">Tritanopia</option>
            </select>
          </div>

          <div class="a11y-section">
            <button data-action="reset" class="a11y-reset">Restablecer todo</button>
            <button data-action="shortcuts" class="a11y-shortcuts">Ver atajos</button>
          </div>
        </div>
      `;

      this._injectPanelStyles();
      document.body.appendChild(panel);
      this._setupPanelEvents(panel);

      // Botón flotante para abrir panel
      const trigger = document.createElement('button');
      trigger.id = 'a11y-trigger';
      trigger.setAttribute('aria-label', 'Abrir opciones de accesibilidad');
      trigger.innerHTML = '♿';
      trigger.onclick = () => this.togglePanel();
      document.body.appendChild(trigger);
    }

    _injectPanelStyles() {
      const style = document.createElement('style');
      style.id = 'a11y-panel-styles';
      style.textContent = `
        #a11y-panel {
          position: fixed;
          top: 0;
          right: -400px;
          width: 350px;
          height: 100vh;
          background: #fff;
          box-shadow: -2px 0 10px rgba(0,0,0,0.3);
          z-index: 100001;
          transition: right 0.3s ease;
          overflow-y: auto;
        }
        #a11y-panel.open {
          right: 0;
        }
        .a11y-panel-content {
          padding: 20px;
        }
        .a11y-panel-content h2 {
          margin: 0 0 20px;
          color: #333;
        }
        .a11y-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }
        .a11y-section {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .a11y-section h3 {
          margin: 0 0 10px;
          font-size: 14px;
          color: #666;
        }
        .a11y-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .a11y-controls button {
          width: 40px;
          height: 40px;
          border: 2px solid #333;
          background: #fff;
          cursor: pointer;
          font-size: 16px;
          border-radius: 4px;
        }
        .a11y-controls button:hover {
          background: #f0f0f0;
        }
        .a11y-value {
          flex: 1;
          text-align: center;
          font-weight: bold;
        }
        .a11y-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          cursor: pointer;
        }
        .a11y-toggle input {
          width: 20px;
          height: 20px;
        }
        .a11y-section select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .a11y-reset, .a11y-shortcuts {
          width: 48%;
          padding: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .a11y-reset {
          background: #dc3545;
          color: #fff;
        }
        .a11y-shortcuts {
          background: #007bff;
          color: #fff;
        }
        #a11y-trigger {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #007bff;
          color: #fff;
          border: none;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          z-index: 100000;
        }
        #a11y-trigger:hover {
          background: #0056b3;
        }
        @media (prefers-color-scheme: dark) {
          #a11y-panel {
            background: #222;
            color: #fff;
          }
          .a11y-panel-content h2,
          .a11y-panel-content h3 {
            color: #fff;
          }
          .a11y-controls button {
            background: #333;
            border-color: #fff;
            color: #fff;
          }
        }
      `;
      document.head.appendChild(style);
    }

    _setupPanelEvents(panel) {
      // Cerrar
      panel.querySelector('.a11y-close').onclick = () => this.togglePanel();

      // Acciones de botones
      panel.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = () => {
          switch (btn.dataset.action) {
            case 'increase-font': this.increaseFontSize(); break;
            case 'decrease-font': this.decreaseFontSize(); break;
            case 'increase-spacing': this.increaseLineSpacing(); break;
            case 'decrease-spacing': this.decreaseLineSpacing(); break;
            case 'reset': this.resetSettings(); break;
            case 'shortcuts': this.showKeyboardShortcuts(); break;
          }
          this._updatePanelValues();
        };
      });

      // Checkboxes
      panel.querySelectorAll('[data-setting]').forEach(input => {
        if (input.type === 'checkbox') {
          input.checked = this.settings[input.dataset.setting];
          input.onchange = () => {
            this.updateSettings({ [input.dataset.setting]: input.checked });
          };
        } else if (input.tagName === 'SELECT') {
          input.value = this.settings[input.dataset.setting];
          input.onchange = () => {
            this.updateSettings({ [input.dataset.setting]: input.value });
          };
        }
      });

      this._updatePanelValues();
    }

    _updatePanelValues() {
      const panel = document.getElementById('a11y-panel');
      if (!panel) return;

      const fontValue = panel.querySelector('#font-size-value');
      const spacingValue = panel.querySelector('#line-spacing-value');

      if (fontValue) fontValue.textContent = `${this.settings.fontSize}%`;
      if (spacingValue) spacingValue.textContent = `${this.settings.lineSpacing}%`;

      // Actualizar checkboxes
      panel.querySelectorAll('[data-setting]').forEach(input => {
        if (input.type === 'checkbox') {
          input.checked = this.settings[input.dataset.setting];
        } else if (input.tagName === 'SELECT') {
          input.value = this.settings[input.dataset.setting];
        }
      });
    }

    /**
     * Alternar panel de accesibilidad
     */
    togglePanel() {
      const panel = document.getElementById('a11y-panel');
      if (panel) {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
          panel.querySelector('.a11y-close').focus();
        }
      }
    }

    _setupKeyboardNavigation() {
      document.addEventListener('keydown', (e) => {
        // Alt + atajos
        if (e.altKey) {
          switch (e.key) {
            case '1':
              e.preventDefault();
              document.getElementById('main-content')?.focus();
              break;
            case '2':
              e.preventDefault();
              document.getElementById('navigation')?.focus();
              break;
            case '3':
              e.preventDefault();
              document.getElementById('search')?.focus();
              break;
            case 'a':
            case 'A':
              e.preventDefault();
              this.togglePanel();
              break;
            case '+':
            case '=':
              e.preventDefault();
              this.increaseFontSize();
              break;
            case '-':
              e.preventDefault();
              this.decreaseFontSize();
              break;
            case '0':
              e.preventDefault();
              this.resetFontSize();
              break;
            case 'c':
            case 'C':
              e.preventDefault();
              this.toggleHighContrast();
              break;
            case 'm':
            case 'M':
              e.preventDefault();
              this.toggleReducedMotion();
              break;
            case 'r':
            case 'R':
              e.preventDefault();
              this.toggleReadingGuide();
              break;
            case 's':
            case 'S':
              e.preventDefault();
              this.speakSelection();
              break;
          }
        }

        // Escape para cerrar/detener
        if (e.key === 'Escape') {
          this.stopSpeaking();
          const panel = document.getElementById('a11y-panel');
          if (panel?.classList.contains('open')) {
            this.togglePanel();
          }
        }
      });
    }

    _setupFocusManagement() {
      // Trap focus en modales
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const panel = document.getElementById('a11y-panel');
          if (panel?.classList.contains('open')) {
            const focusable = panel.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])');
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      });
    }

    _announce(message) {
      // Crear elemento para anuncio de screen reader
      let announcer = document.getElementById('a11y-announcer');
      if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'a11y-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
      }

      announcer.textContent = '';
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }

    _announcePageLoad() {
      const title = document.title || 'Página';
      this._announce(`${title} cargada`);
    }

    _showShortcutsModal(shortcuts) {
      const modal = document.createElement('div');
      modal.id = 'a11y-shortcuts-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Atajos de teclado');
      modal.innerHTML = `
        <div class="a11y-shortcuts-content">
          <h2>Atajos de Teclado</h2>
          <button class="a11y-close" aria-label="Cerrar">&times;</button>
          <table>
            <thead>
              <tr><th>Atajo</th><th>Acción</th></tr>
            </thead>
            <tbody>
              ${shortcuts.map(s => `<tr><td><kbd>${s.key}</kbd></td><td>${s.action}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;

      const style = document.createElement('style');
      style.textContent = `
        #a11y-shortcuts-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100002;
        }
        .a11y-shortcuts-content {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }
        .a11y-shortcuts-content table {
          width: 100%;
          border-collapse: collapse;
        }
        .a11y-shortcuts-content th,
        .a11y-shortcuts-content td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .a11y-shortcuts-content kbd {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid #ccc;
          font-family: monospace;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(modal);

      modal.querySelector('.a11y-close').onclick = () => modal.remove();
      modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
      };
    }
  }

  // Crear instancia global
  const a11y = new AccessibilityService();

  // Exponer globalmente
  window.AccessibilityService = a11y;
  window.a11y = a11y;

  // Inicializar cuando DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => a11y.init());
  } else {
    a11y.init();
  }
})();
