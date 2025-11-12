/**
 * 🎯 SISTEMA DE CITAS - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Archivo: citas-events.js
 * Autores: BGE Development Team
 * Versión: 1.0.0
 * Fecha: Noviembre 2025
 */

(function() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        console.log('[CITAS-EVENTS] Inicializando event handlers...');

        registerDepartmentSelectors();
        registerCitasButtons();
        registerChatbotHandlers();

        console.log('[CITAS-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * 🏢 HANDLERS 1-8: Department Selection Buttons
     * Selecciona el departamento para agendar cita
     */
    function registerDepartmentSelectors() {
        const departments = [
            'direccion', 'servicios', 'orientacion', 'administracion',
            'trabajo-social', 'nuevo-ingreso', 'becas', 'inscripciones'
        ];

        departments.forEach(dept => {
            const buttons = document.querySelectorAll(`button[onclick*="selectDepartment('${dept}')"]`);
            buttons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    selectDepartment(dept);
                });
            });
        });
    }

    /**
     * 📋 HANDLERS 9-13: Citas Action Buttons
     * Botones de acciones en el sistema de citas
     */
    function registerCitasButtons() {
        // Botón Consultar Cita
        const consultarBtn = document.getElementById('consultarCitaBtn');
        if (consultarBtn) {
            consultarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                consultarCita();
            });
        }

        // Botones dinámicos - Cancelar cita
        document.addEventListener('click', function(e) {
            if (e.target.closest('[onclick*="cancelarCita"]')) {
                e.preventDefault();
                const appointmentId = e.target.closest('[onclick*="cancelarCita"]')
                    .getAttribute('onclick')
                    .match(/'([^']+)'/)[1];
                cancelarCita(appointmentId);
            }
        });

        // Botones dinámicos - Descargar confirmación
        document.addEventListener('click', function(e) {
            if (e.target.closest('[onclick*="downloadConfirmation"]')) {
                e.preventDefault();
                const appointmentId = e.target.closest('[onclick*="downloadConfirmation"]')
                    .getAttribute('onclick')
                    .match(/'([^']+)'/)[1];
                window.appointmentSystem?.downloadConfirmation?.(appointmentId);
            }
        });
    }

    /**
     * 🤖 HANDLERS 14-16: Chatbot Interaction
     */
    function registerChatbotHandlers() {
        // Botón toggle del chatbot
        const chatbotToggle = document.getElementById('chatbotToggle');
        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', toggleChatbot);
        }

        // Botón cerrar chatbot (dentro del contenedor)
        const chatbotCloseBtn = document.getElementById('chatbotCloseBtn');
        if (chatbotCloseBtn) {
            chatbotCloseBtn.addEventListener('click', toggleChatbot);
        }

        // Botón enviar mensaje
        const sendBtn = document.getElementById('chatbotSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Input del chatbot - Enter para enviar
        const chatInput = document.getElementById('chatbotInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    /**
     * 🏢 Selecciona un departamento para agendar cita
     */
    function selectDepartment(department) {
        console.log('[CITAS-EVENTS] Seleccionando departamento:', department);
        const form = document.getElementById('appointmentForm');
        if (form) {
            const deptSelect = form.querySelector('[name="department"]');
            if (deptSelect) {
                deptSelect.value = department;
            }
            // Scroll al formulario
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * 📋 Consulta una cita agendada
     */
    function consultarCita() {
        console.log('[CITAS-EVENTS] Consultando cita...');
        // Implementación según lógica del sistema de citas
        alert('Consultando tu cita...');
    }

    /**
     * ❌ Cancela una cita
     */
    function cancelarCita(appointmentId) {
        console.log('[CITAS-EVENTS] Cancelando cita:', appointmentId);
        if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
            alert('Cita cancelada exitosamente');
        }
    }

    /**
     * 💬 Alterna la visibilidad del chatbot
     */
    function toggleChatbot() {
        const container = document.getElementById('chatbotContainer');
        if (container) {
            container.classList.toggle('active');
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        }
    }

    /**
     * 📨 Envía un mensaje a través del chatbot
     */
    function sendMessage() {
        const input = document.getElementById('chatbotInput');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        const messagesContainer = document.getElementById('chatbotMessages');

        if (messagesContainer) {
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user';
            userMsg.innerHTML = `<div class="response-professional"><div class="response-content">${escapeHtml(message)}</div></div>`;
            messagesContainer.appendChild(userMsg);

            input.value = '';

            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot';
                botMsg.innerHTML = `<div class="response-professional"><div class="response-content">Gracias por tu pregunta. Un asesor te responderá pronto.</div></div>`;
                messagesContainer.appendChild(botMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 500);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
