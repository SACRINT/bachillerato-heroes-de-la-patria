/**
 * 📅 CALENDARIO - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Propósito: Eliminar 9 inline handlers que violan CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de calendario.html
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        console.log('[CALENDARIO-EVENTS] Inicializando event handlers...');

        registerActionButtons();
        registerChatbotHandlers();

        console.log('[CALENDARIO-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * Botones de acciones del calendario
     */
    function registerActionButtons() {
        // Descargar calendario
        const downloadBtn = document.querySelector('button[onclick*="downloadCalendar"]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                downloadCalendar();
            });
        }

        // Exportar a Google
        const exportBtn = document.querySelector('button[onclick*="exportToGoogle"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                exportToGoogle();
            });
        }

        // Compartir calendario
        const shareBtn = document.querySelector('button[onclick*="shareCalendar"]');
        if (shareBtn) {
            shareBtn.addEventListener('click', function(e) {
                e.preventDefault();
                shareCalendar();
            });
        }

        // Establecer recordatorios
        const remindersBtn = document.querySelector('button[onclick*="setReminders"]');
        if (remindersBtn) {
            remindersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                setReminders();
            });
        }

        // Agregar a calendario personal
        const addPersonalBtn = document.querySelector('button[onclick*="addToPersonalCalendar"]');
        if (addPersonalBtn) {
            addPersonalBtn.addEventListener('click', function(e) {
                e.preventDefault();
                addToPersonalCalendar();
            });
        }

        // Guardar recordatorios
        const saveRemindersBtn = document.querySelector('button[onclick*="saveReminders"]');
        if (saveRemindersBtn) {
            saveRemindersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                saveReminders();
            });
        }
    }

    /**
     * Handlers del chatbot
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

        // Input para Enter
        const chatInput = document.querySelector('[onkeypress*="handleKeyPress"]');
        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        // Botón enviar
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

    function downloadCalendar() {
        console.log('[CALENDARIO-EVENTS] Descargando calendario...');
        if (window.downloadCalendar) {
            window.downloadCalendar();
        }
    }

    function exportToGoogle() {
        console.log('[CALENDARIO-EVENTS] Exportando a Google...');
        if (window.exportToGoogle) {
            window.exportToGoogle();
        }
    }

    function shareCalendar() {
        console.log('[CALENDARIO-EVENTS] Compartiendo calendario...');
        if (window.shareCalendar) {
            window.shareCalendar();
        }
    }

    function setReminders() {
        console.log('[CALENDARIO-EVENTS] Estableciendo recordatorios...');
        if (window.setReminders) {
            window.setReminders();
        }
    }

    function addToPersonalCalendar() {
        console.log('[CALENDARIO-EVENTS] Añadiendo a calendario personal...');
        if (window.addToPersonalCalendar) {
            window.addToPersonalCalendar();
        }
    }

    function saveReminders() {
        console.log('[CALENDARIO-EVENTS] Guardando recordatorios...');
        if (window.saveReminders) {
            window.saveReminders();
        }
    }

    function toggleChatbot() {
        console.log('[CALENDARIO-EVENTS] Alternando chatbot...');
        if (window.toggleChatbot) {
            window.toggleChatbot();
        }
    }

    function sendMessage() {
        console.log('[CALENDARIO-EVENTS] Enviando mensaje...');
        if (window.sendMessage) {
            window.sendMessage();
        }
    }

    // Export para módulos
    window.calendarioEvents = {
        downloadCalendar,
        exportToGoogle,
        shareCalendar,
        setReminders,
        addToPersonalCalendar,
        saveReminders,
        toggleChatbot,
        sendMessage
    };

})();
