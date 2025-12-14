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
        console.log('[OFERTA-EDUCATIVA-EVENTS] Inicializando event handlers...');

        registerChatbotHandlers();

        console.log('[OFERTA-EDUCATIVA-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * Handlers para el chatbot
     */
    function registerChatbotHandlers() {
        // Botón toggle chatbot
        const chatbotToggleBtn = document.querySelector('button[onclick*="toggleChatbot"]');
        if (chatbotToggleBtn) {
            chatbotToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleChatbot();
            });
        }

        // Input chatbot con Enter
        const chatInput = document.querySelector('[onkeypress*="handleKeyPress"]');
        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Botón enviar mensaje
        const sendBtn = document.querySelector('button[onclick*="sendMessage"]');
        if (sendBtn) {
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                sendMessage();
            });
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    function toggleChatbot() {
        console.log('[OFERTA-EDUCATIVA-EVENTS] Alternando chatbot...');
        if (window.toggleChatbot) {
            window.toggleChatbot();
        }
    }

    function sendMessage() {
        console.log('[OFERTA-EDUCATIVA-EVENTS] Enviando mensaje...');
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
