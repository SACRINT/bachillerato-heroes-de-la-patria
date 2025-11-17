/**
 * 🎯 PORTAL DE PADRES - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick a addEventListener
 *
 * Archivo: padres-events.js
 * Autores: BGE Development Team
 * Versión: 1.0.0
 * Fecha: Noviembre 2025
 */

(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    /**
     * Inicializa todos los event handlers de la página padres.html
     */
    function initializeEventHandlers() {
        console.log('[PADRES-EVENTS] Inicializando event handlers...');

        registerPasswordToggle();
        registerPasswordRecoveryButton();
        registerRegistrationHelpButton();
        registerDashboardActions();
        registerChatbotHandlers();

        console.log('[PADRES-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * 🔐 HANDLER 1: Toggle Password Visibility
     * Muestra/oculta la contraseña al hacer clic en el botón del ojo
     */
    function registerPasswordToggle() {
        const passwordButton = document.querySelector('.input-group button[type="button"]');

        if (passwordButton) {
            passwordButton.addEventListener('click', function(e) {
                e.preventDefault();
                togglePassword('accessPassword');
            });
        }
    }

    /**
     * 🔑 HANDLER 2: Password Recovery Modal
     * Abre el modal de recuperación de contraseña
     */
    function registerPasswordRecoveryButton() {
        const recoveryBtn = document.querySelector('[onclick*="showPasswordRecovery"]');

        if (recoveryBtn) {
            recoveryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showPasswordRecovery();
            });
        }
    }

    /**
     * 📝 HANDLER 3: Registration Help Modal
     * Abre el modal de ayuda para primer acceso
     */
    function registerRegistrationHelpButton() {
        const registrationBtn = document.querySelector('[onclick*="showRegistrationHelp"]');

        if (registrationBtn) {
            registrationBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showRegistrationHelp();
            });
        }
    }

    /**
     * 📊 HANDLERS 4-10: Dashboard Actions
     * Botones del panel de control (Calificaciones, Asistencias, etc.)
     */
    function registerDashboardActions() {
        // Mapeo de acciones a funciones
        const actionMap = {
            'showGrades': 'data-action="show-grades"',
            'showAttendance': 'data-action="show-attendance"',
            'showCommunication': 'data-action="show-communication"',
            'showSchedule': 'data-action="show-schedule"',
            'downloadReport': 'data-action="download-report"',
            'scheduleAppointment': 'data-action="schedule-appointment"',
            'contactTeacher': 'data-action="contact-teacher"',
            'parentLogout': 'data-action="parent-logout"'
        };

        // Registrar botones por su función
        registerActionButton('showGrades', showGrades);
        registerActionButton('showAttendance', showAttendance);
        registerActionButton('showCommunication', showCommunication);
        registerActionButton('showSchedule', showSchedule);
        registerActionButton('downloadReport', downloadReport);
        registerActionButton('scheduleAppointment', scheduleAppointment);
        registerActionButton('contactTeacher', contactTeacher);
        registerActionButton('parentLogout', parentLogout);
    }

    /**
     * 🤖 HANDLER 11-12: Chatbot Interaction
     * Manejo del chatbot y envío de mensajes
     */
    function registerChatbotHandlers() {
        // Botón toggle del chatbot
        const chatbotToggle = document.getElementById('chatbotToggle');
        if (chatbotToggle) {
            chatbotToggle.addEventListener('click', toggleChatbot);
        }

        // Botón cerrar chatbot (dentro del contenedor)
        const chatbotCloseBtn = document.querySelector('.chatbot-header button');
        if (chatbotCloseBtn) {
            chatbotCloseBtn.addEventListener('click', toggleChatbot);
        }

        // Botón enviar mensaje
        const sendBtn = document.querySelector('.chatbot-input button');
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

    /**
     * Función auxiliar para registrar botones de acción
     */
    function registerActionButton(action, callback) {
        const buttons = document.querySelectorAll(`button[onclick*="${action}"]`);
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                callback();
            });
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO (sin cambios en lógica)
    // ============================================

    /**
     * 🔓 Alterna la visibilidad de la contraseña
     */
    function togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const isPassword = field.type === 'password';
        field.type = isPassword ? 'text' : 'password';

        // Encontrar el botón de toggle y cambiar el icono
        const btn = field.nextElementSibling;
        if (btn && btn.querySelector('i')) {
            btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
    }

    /**
     * 🔑 Abre el modal de recuperación de contraseña
     */
    function showPasswordRecovery() {
        const modal = document.getElementById('passwordRecoveryModal');
        if (modal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function(){
                modal.style.display = 'block';
            })(modal);
            bootstrapModal.show?.();
        }
    }

    /**
     * 📝 Abre el modal de ayuda para registro
     */
    function showRegistrationHelp() {
        const modal = document.getElementById('registrationHelpModal');
        if (modal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function(){
                modal.style.display = 'block';
            })(modal);
            bootstrapModal.show?.();
        }
    }

    /**
     * 📊 Muestra la sección de calificaciones
     */
    function showGrades() {
        console.log('[PADRES-EVENTS] Mostrando calificaciones...');
        const dashboard = document.getElementById('parentDashboard');
        if (dashboard) {
            dashboard.classList.remove('d-none');
            dashboard.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * ✅ Muestra la sección de asistencias
     */
    function showAttendance() {
        console.log('[PADRES-EVENTS] Mostrando asistencias...');
        alert('Funcionalidad de asistencias - En desarrollo');
    }

    /**
     * 💬 Muestra la sección de comunicación
     */
    function showCommunication() {
        console.log('[PADRES-EVENTS] Mostrando comunicación...');
        alert('Centro de comunicación - En desarrollo');
    }

    /**
     * 🕐 Muestra la sección de horarios
     */
    function showSchedule() {
        console.log('[PADRES-EVENTS] Mostrando horarios...');
        alert('Horarios del estudiante - En desarrollo');
    }

    /**
     * 📥 Descarga reporte académico
     */
    function downloadReport() {
        console.log('[PADRES-EVENTS] Descargando reporte...');
        alert('Descargando reporte académico...');
    }

    /**
     * 📅 Agenda una cita con el docente
     */
    function scheduleAppointment() {
        console.log('[PADRES-EVENTS] Agendando cita...');
        // Redirigir a página de citas
        window.location.href = 'citas.html';
    }

    /**
     * ✉️ Contacta al tutor
     */
    function contactTeacher() {
        console.log('[PADRES-EVENTS] Contactando tutor...');
        alert('Enviando mensaje al tutor...');
    }

    /**
     * 🚪 Cierra la sesión del padre
     */
    function parentLogout() {
        console.log('[PADRES-EVENTS] Cerrando sesión...');
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Limpiar datos de sesión
            sessionStorage.clear();
            localStorage.removeItem('parentSession');

            // Redirigir al login
            window.location.href = 'padres.html';
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
            // Agregar mensaje del usuario
            const userMsg = document.createElement('div');
            userMsg.className = 'chatbot-message user';
            userMsg.innerHTML = DOMPurify.sanitize(sanitizeHTML(`<div class="response-professional"><div class="response-content">${escapeHtml(message)}</div></div>`));
            messagesContainer.appendChild(userMsg);

            // Limpiar input
            input.value = '';

            // Simular respuesta del bot
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot';
                botMsg.innerHTML = DOMPurify.sanitize(sanitizeHTML(`<div class="response-professional"><div class="response-content">Gracias por tu pregunta. Un asesor te responderá pronto.</div></div>`));
                messagesContainer.appendChild(botMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 500);
        }
    }

    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

})();
