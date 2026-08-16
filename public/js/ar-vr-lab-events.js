/**
 * 🥽 LABORATORIO AR/VR - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick a addEventListener
 *
 * Propósito: Eliminar 9 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de ar-vr-lab.html
 */

(function() {
    'use strict';

    // ============================================
    // INICIALIZACIÓN - Esperar DOM Listo
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        // DOM ya está listo
        initializeEventHandlers();
    }

    // ============================================
    // FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================

    function initializeEventHandlers() {
        void 0;

        // Registrar todos los handlers
        registerExperienceButtons();
        registerARViewerControls();

        void 0;
    }

    // ============================================
    // EXPERIENCE LAUNCH BUTTONS
    // ============================================

    function registerExperienceButtons() {
        // Botones para lanzar experiencias AR por subject
        const launchButtons = document.querySelectorAll('.launch-btn');

        launchButtons.forEach(button => {
            const subject = button.closest('[data-subject]')?.getAttribute('data-subject');

            if (subject) {
                // Nuevo patrón: data-attributes
                button.addEventListener('click', function(e) {
                    e.preventDefault();

                    // Mapear subject a acción
                    if (['mathematics', 'sciences', 'history', 'arts'].includes(subject)) {
                        launchARExperience(subject);
                    } else if (subject === 'virtual-lab') {
                        launchVirtualLab();
                    } else if (subject === 'vr-immersive') {
                        launchVRExperience();
                    }
                });
            }
        });

        // Fallback: botones con onclick para compatibilidad
        const mathBtn = document.querySelector('[data-subject="mathematics"] .launch-btn');
        if (mathBtn && !mathBtn.hasAttribute('data-registered')) {
            mathBtn.setAttribute('data-registered', 'true');
        }
    }

    // ============================================
    // AR VIEWER CONTROLS
    // ============================================

    function registerARViewerControls() {
        // Botones del visor AR
        const recordBtn = document.querySelector('.ar-btn:nth-child(1)');
        if (recordBtn) {
            recordBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleARRecording();
            });
        }

        const screenshotBtn = document.querySelector('.ar-btn:nth-child(2)');
        if (screenshotBtn) {
            screenshotBtn.addEventListener('click', function(e) {
                e.preventDefault();
                takeARScreenshot();
            });
        }

        const closeBtn = document.querySelector('.ar-btn:nth-child(3)');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeARViewer();
            });
        }

        // Alternativa: usar event delegation para botones dinámicos
        document.addEventListener('click', function(e) {
            if (e.target.closest('.ar-btn')) {
                const btn = e.target.closest('.ar-btn');
                const text = btn.textContent.trim();

                if (text.includes('Grabar')) {
                    toggleARRecording();
                } else if (text.includes('Captura')) {
                    takeARScreenshot();
                } else if (text.includes('Cerrar')) {
                    closeARViewer();
                }
            }
        });
    }

    // ============================================
    // FUNCIONES QUE LLAMAN LOS EVENT HANDLERS
    // ============================================

    /**
     * Lanza una experiencia AR por subject
     */
    function launchARExperience(subject) {
        void 0;
        if (window.launchARExperience) {
            window.launchARExperience(subject);
        } else {
            void 0;
        }
    }

    /**
     * Lanza el laboratorio virtual 3D
     */
    function launchVirtualLab() {
        void 0;
        if (window.launchVirtualLab) {
            window.launchVirtualLab();
        } else {
            void 0;
        }
    }

    /**
     * Lanza experiencia VR inmersiva
     */
    function launchVRExperience() {
        void 0;
        if (window.launchVRExperience) {
            window.launchVRExperience();
        } else {
            void 0;
        }
    }

    /**
     * Alterna la grabación en el visor AR
     */
    function toggleARRecording() {
        void 0;
        if (window.toggleARRecording) {
            window.toggleARRecording();
        } else {
            void 0;
        }
    }

    /**
     * Toma una captura de pantalla en el visor AR
     */
    function takeARScreenshot() {
        void 0;
        if (window.takeARScreenshot) {
            window.takeARScreenshot();
        } else {
            void 0;
        }
    }

    /**
     * Cierra el visor AR
     */
    function closeARViewer() {
        void 0;
        if (window.closeARViewer) {
            window.closeARViewer();
        } else {
            void 0;
        }
    }

    // ============================================
    // EXPORT (if needed by other modules)
    // ============================================

    // Hacer disponible globalmente si es necesario
    window.arVRLabEvents = {
        launchARExperience,
        launchVirtualLab,
        launchVRExperience,
        toggleARRecording,
        takeARScreenshot,
        closeARViewer
    };

})();
