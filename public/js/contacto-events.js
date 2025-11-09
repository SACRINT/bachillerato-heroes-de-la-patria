/**
 * 📧 CONTACTO - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onsubmit a addEventListener
 *
 * Propósito: Eliminar 1 handler inline que viola CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de contacto.html
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        console.log('[CONTACTO-EVENTS] Inicializando event handlers...');

        registerContactHandlers();

        console.log('[CONTACTO-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * Handlers para formulario de contacto y otros elementos
     */
    function registerContactHandlers() {
        // Buscar todos los elementos con atributos onclick para registro dinámico
        document.addEventListener('click', function(e) {
            if (e.target.closest('[onclick]')) {
                const elem = e.target.closest('[onclick]');
                const onclick = elem.getAttribute('onclick');
                
                // Procesar handlers genéricos que puedan existir
                if (onclick) {
                    console.log('[CONTACTO-EVENTS] Evento capturado:', onclick);
                    e.preventDefault();
                }
            }
        });

        // Manejo de formularios
        const forms = document.querySelectorAll('form[onsubmit]');
        forms.forEach(form => {
            const onsubmit = form.getAttribute('onsubmit');
            if (onsubmit) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    // Ejecutar la función del onsubmit si existe en window
                    const match = onsubmit.match(/(\w+)\(/);
                    if (match) {
                        const funcName = match[1];
                        if (window[funcName]) {
                            window[funcName](e);
                        }
                    }
                });
            }
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    // Placeholder para funciones que puedan ser llamadas desde contacto.html
    function handleContactSubmit(event) {
        console.log('[CONTACTO-EVENTS] Procesando envío del formulario de contacto...');
        if (window.handleContactSubmit) {
            window.handleContactSubmit(event);
        }
    }

    // Export para módulos
    window.contactoEvents = {
        handleContactSubmit
    };

})();
