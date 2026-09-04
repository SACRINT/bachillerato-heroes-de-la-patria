/**
 * 👥 CONÓCENOS - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Propósito: Eliminar 9 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de conocenos.html
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        

        registerVideoHandlers();
        registerOrganigramaHandlers();
        registerChatbotHandlers();

        
    }

    /**
     * Handlers para gestión de videos
     */
    function registerVideoHandlers() {
        // Botón agregar video
        const agregarVideoBtn = document.querySelector('button[onclick*="agregarVideo"]');
        if (agregarVideoBtn) {
            agregarVideoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                agregarVideo();
            });
        }

        // Botón mostrar formulario video
        const formVideoBtn = document.querySelector('button[onclick*="mostrarFormularioVideo"]');
        if (formVideoBtn) {
            formVideoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                mostrarFormularioVideo();
            });
        }

        // Botones cerrar modal video (pueden haber múltiples)
        const cerrarModalBtns = document.querySelectorAll('button[onclick*="cerrarModalVideo"]');
        cerrarModalBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                cerrarModalVideo();
            });
        });
    }

    /**
     * Handlers para el organigrama interactivo
     */
    function registerOrganigramaHandlers() {
        // Botones toggle organigrama view (nuevo patrón con data-attributes)
        const toggleOrganigramaBtns = document.querySelectorAll('button[data-action="toggleOrganigramaView"]');
        toggleOrganigramaBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const viewType = this.getAttribute('data-view-type');
                toggleOrganigramaView(viewType);
            });
        });

        // Fallback: Botones toggle con onclick para compatibilidad
        const legacyToggleBtns = document.querySelectorAll('button[onclick*="toggleOrganigramaView"]');
        legacyToggleBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const onclick = btn.getAttribute('onclick');
                const match = onclick.match(/toggleOrganigramaView\(['"]?([^'")]*)/);
                const param = match ? match[1] : null;
                toggleOrganigramaView(param);
            });
        });
    }

    /**
     * Handlers para el chatbot
     */
    function registerChatbotHandlers() {
        // Chatbot es gestionado de forma centralizada por js/chatbot.js
        // Se evita registrar listeners duplicados que desincronicen el DOM
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    function agregarVideo() {
        
        if (window.agregarVideo) {
            window.agregarVideo();
        }
    }

    function mostrarFormularioVideo() {
        
        if (window.mostrarFormularioVideo) {
            window.mostrarFormularioVideo();
        }
    }

    function cerrarModalVideo() {
        
        if (window.cerrarModalVideo) {
            window.cerrarModalVideo();
        }
    }

    function toggleOrganigramaView(param) {
        
        if (window.toggleOrganigramaView) {
            window.toggleOrganigramaView(param);
        }
    }

    function toggleChatbot() {
        
        if (window.toggleChatbot) {
            window.toggleChatbot();
        }
    }

    function sendMessage() {
        
        if (window.sendMessage) {
            window.sendMessage();
        }
    }

    // Export para módulos
    window.conocenosEvents = {
        agregarVideo,
        mostrarFormularioVideo,
        cerrarModalVideo,
        toggleOrganigramaView,
        toggleChatbot,
        sendMessage
    };

})();
