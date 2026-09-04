/**
 * 🎓 OFERTA EDUCATIVA - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Propósito: Eliminar 3 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de oferta-educativa.html
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        

        registerChatbotHandlers();

        
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
    window.ofertaEducativaEvents = {
        toggleChatbot,
        sendMessage
    };

})();
