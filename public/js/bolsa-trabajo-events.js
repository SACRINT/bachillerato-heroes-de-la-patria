/**
 * 🎯 SISTEMA DE BOLSA DE TRABAJO - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Archivo: bolsa-trabajo-events.js
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
        console.log('[BOLSA-TRABAJO-EVENTS] Inicializando event handlers...');

        registerQuickActionButtons();
        registerFeaturedJobsButtons();
        registerJobListingsHandlers();
        registerChatbotHandlers();

        console.log('[BOLSA-TRABAJO-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * 🎯 HANDLERS 1-4: Quick Action Buttons
     * Botones de acciones rápidas (CV, Empleos Guardados, Aplicaciones, Tips)
     */
    function registerQuickActionButtons() {
        // Mapeo de acciones a funciones
        const actionMap = {
            'showUploadCV': showUploadCV,
            'showSavedJobs': showSavedJobs,
            'showApplications': showApplications,
            'showCareerTips': showCareerTips
        };

        // Registrar botones por su data-action (nueva forma)
        const buttons = document.querySelectorAll('.quick-action-btn');
        buttons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (action && actionMap[action]) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    actionMap[action]();
                });
            }
        });

        // Fallback: registrar botones por sus atributos onclick antiguos (compatibilidad)
        Object.keys(actionMap).forEach(action => {
            const oldButtons = document.querySelectorAll(`button[onclick*="${action}"]`);
            oldButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    actionMap[action]();
                });
            });
        });
    }

    /**
     * 👔 HANDLER 5: Featured Jobs Button
     * Botón para mostrar todos los empleos
     */
    function registerFeaturedJobsButtons() {
        // Nueva forma: por ID
        const showAllJobsBtn = document.getElementById('showAllJobsBtn');
        if (showAllJobsBtn) {
            showAllJobsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showAllJobs();
            });
        }

        // Fallback: por onclick attribute (compatibilidad)
        const buttons = document.querySelectorAll('button[onclick*="showAllJobs"]');
        buttons.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                showAllJobs();
            });
        });
    }

    /**
     * 💼 HANDLERS 6-9: Job Listings Dynamic Actions
     * Aplicar a empleo, guardar empleo, remover guardado, etc. (con delegación de eventos)
     */
    function registerJobListingsHandlers() {
        // Aplicar a empleo
        document.addEventListener('click', function(e) {
            if (e.target.closest('button[onclick*="applyToJob"]')) {
                e.preventDefault();
                const jobId = e.target.closest('button[onclick*="applyToJob"]')
                    .getAttribute('onclick')
                    .match(/\(([^)]+)\)/)[1]
                    .replace(/[`'"\s]/g, '');
                applyToJob(jobId);
            }
        });

        // Remover de guardados
        document.addEventListener('click', function(e) {
            if (e.target.closest('button[onclick*="removeFromSaved"]')) {
                e.preventDefault();
                const jobId = e.target.closest('button[onclick*="removeFromSaved"]')
                    .getAttribute('onclick')
                    .match(/\(([^)]+)\)/)[1]
                    .replace(/[`'"\s]/g, '');
                removeFromSaved(jobId);
            }
        });

        // Guardar empleo
        document.addEventListener('click', function(e) {
            if (e.target.closest('button[onclick*="saveJob"]')) {
                e.preventDefault();
                const jobId = e.target.closest('button[onclick*="saveJob"]')
                    .getAttribute('onclick')
                    .match(/\(([^)]+)\)/)[1]
                    .replace(/[`'"\s]/g, '');
                saveJob(jobId);
            }
        });
    }

    /**
     * 🤖 HANDLERS 10-11: Chatbot Interaction
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

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    /**
     * 📤 Muestra modal para subir CV
     */
    function showUploadCV() {
        console.log('[BOLSA-TRABAJO-EVENTS] Mostrando formulario de CV...');
        const modal = document.getElementById('uploadCVModal');
        if (modal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function(){
                modal.style.display = 'block';
            })(modal);
            bootstrapModal.show?.();
        }
    }

    /**
     * ❤️ Muestra empleos guardados
     */
    function showSavedJobs() {
        console.log('[BOLSA-TRABAJO-EVENTS] Mostrando empleos guardados...');
        alert('Empleos guardados - En desarrollo');
    }

    /**
     * 📋 Muestra aplicaciones realizadas
     */
    function showApplications() {
        console.log('[BOLSA-TRABAJO-EVENTS] Mostrando aplicaciones...');
        alert('Mis aplicaciones - En desarrollo');
    }

    /**
     * 💡 Muestra tips de carrera
     */
    function showCareerTips() {
        console.log('[BOLSA-TRABAJO-EVENTS] Mostrando tips de carrera...');
        alert('Tips de carrera profesional - En desarrollo');
    }

    /**
     * 👀 Muestra todos los empleos disponibles
     */
    function showAllJobs() {
        console.log('[BOLSA-TRABAJO-EVENTS] Mostrando todos los empleos...');
        const section = document.getElementById('allJobsSection');
        if (section) {
            section.classList.remove('d-none');
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * 📝 Aplica a un empleo
     */
    function applyToJob(jobId) {
        console.log('[BOLSA-TRABAJO-EVENTS] Aplicando a empleo:', jobId);
        alert(`Aplicación a empleo ${jobId} - En desarrollo`);
    }

    /**
     * ❤️➡️ Remueve empleo de guardados
     */
    function removeFromSaved(jobId) {
        console.log('[BOLSA-TRABAJO-EVENTS] Removiendo de guardados:', jobId);
        if (confirm('¿Estás seguro de que deseas remover este empleo?')) {
            alert(`Empleo ${jobId} removido de guardados`);
        }
    }

    /**
     * 💾 Guarda un empleo
     */
    function saveJob(jobId) {
        console.log('[BOLSA-TRABAJO-EVENTS] Guardando empleo:', jobId);
        alert(`Empleo ${jobId} guardado exitosamente`);
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
            userMsg.innerHTML = sanitizeHTML(`<div class="response-professional"><div class="response-content">${escapeHtml(message)}</div></div>`);
            messagesContainer.appendChild(userMsg);

            // Limpiar input
            input.value = '';

            // Simular respuesta del bot
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'chatbot-message bot';
                botMsg.innerHTML = sanitizeHTML(`<div class="response-professional"><div class="response-content">Gracias por tu pregunta. Un asesor te responderá pronto.</div></div>`);
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
