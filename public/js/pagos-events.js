/**
 * 💳 SISTEMA DE PAGOS - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onmouseover/onmouseout a addEventListener
 *
 * Archivo: pagos-events.js
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
        

        registerPaymentServiceCards();
        registerActionButtons();
        registerChatbotHandlers();
        registerDynamicPaymentButtons();

        
    }

    /**
     * 💳 HANDLERS 1-4: Payment Service Cards
     * Tarjetas interactivas con efectos hover y onclick
     */
    function registerPaymentServiceCards() {
        // Seleccionar todas las tarjetas de servicio de pago
        const paymentCards = document.querySelectorAll('.payment-service-card');

        paymentCards.forEach((card, index) => {
            // Patrón nuevo: data-attributes
            const action = card.getAttribute('data-action');
            const target = card.getAttribute('data-target');

            if (action) {
                // Registrar el evento click
                card.addEventListener('click', function(e) {
                    e.preventDefault();
                    handlePaymentCardClick(action, target);
                });
            }

            // Fallback: obtener la función onclick original (para compatibilidad)
            const onclickAttr = card.getAttribute('onclick');
            if (onclickAttr && !action) {
                // Extraer el nombre de la función y parámetros
                const match = onclickAttr.match(/(\w+)\('([^']+)'\)|(\w+)\(\)/);

                if (match) {
                    const functionName = match[1] || match[3];
                    const parameter = match[2] || null;

                    // Registrar el evento click
                    card.addEventListener('click', function(e) {
                        e.preventDefault();
                        handlePaymentCardClick(functionName, parameter);
                    });
                }
            }

            // Registrar eventos hover (onmouseover/onmouseout)
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.cursor = 'pointer';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    /**
     * 🔘 HANDLERS 5-10: Action Buttons
     * Botones de acción (login, consult, logout, process payment)
     */
    function registerActionButtons() {
        // Mapeo de acciones a funciones
        const actionMap = {
            'loginPaymentSystem': loginPaymentSystem,
            'consultPaymentStatus': consultPaymentStatus,
            'logoutPaymentSystem': logoutPaymentSystem,
            'processPayment': processPayment
        };

        // Registrar botones por atributo onclick (fallback)
        Object.keys(actionMap).forEach(action => {
            const buttons = document.querySelectorAll(`button[onclick*="${action}"]`);
            buttons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    actionMap[action]();
                });
            });
        });

        // Registrar botones por ID (nuevo patrón)
        const loginBtn = document.getElementById('loginPaymentBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', loginPaymentSystem);
        }

        const consultBtn = document.getElementById('consultPaymentBtn');
        if (consultBtn) {
            consultBtn.addEventListener('click', consultPaymentStatus);
        }

        const logoutBtn = document.getElementById('logoutPaymentBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutPaymentSystem);
        }

        const processBtn = document.getElementById('processPaymentBtn');
        if (processBtn) {
            processBtn.addEventListener('click', processPayment);
        }
    }

    /**
     * 🤖 HANDLERS 11-13: Chatbot Interaction
     * Manejo del chatbot y envío de mensajes
     */
    function registerChatbotHandlers() {
        // Chatbot es gestionado de forma centralizada por js/chatbot.js
    }

    /**
     * 💳 HANDLER 14: Dynamic Payment Buttons
     * Botones de pago generados dinámicamente (payDebt)
     */
    function registerDynamicPaymentButtons() {
        // Usar event delegation para botones dinámicos
        document.addEventListener('click', function(e) {
            if (e.target.closest('button[onclick*="payDebt"]')) {
                e.preventDefault();
                const button = e.target.closest('button[onclick*="payDebt"]');
                const onclick = button.getAttribute('onclick');
                const match = onclick.match(/payDebt\((\d+)\)/);

                if (match && match[1]) {
                    const index = match[1];
                    payDebt(index);
                }
            }
        });
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    /**
     * 💳 Maneja el click en tarjetas de pago
     */
    function handlePaymentCardClick(functionName, parameter) {
        

        const functionMap = {
            'scrollToSection': () => {
                const section = document.getElementById(parameter);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                }
            },
            'showLoginModal': showLoginModal,
            'showConsultModal': showConsultModal
        };

        if (functionMap[functionName]) {
            functionMap[functionName]();
        }
    }

    /**
     * 📜 Scrollea a una sección
     */
    function scrollToSection(sectionId) {
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * 🔐 Abre el modal de login
     */
    function showLoginModal() {
        
        const modal = document.getElementById('loginModal');
        if (modal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function() {
                modal.style.display = 'block';
            })(modal);
            bootstrapModal.show?.();
        }
    }

    /**
     * 📋 Abre el modal de consulta
     */
    function showConsultModal() {
        
        const modal = document.getElementById('consultModal');
        if (modal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function() {
                modal.style.display = 'block';
            })(modal);
            bootstrapModal.show?.();
        }
    }

    /**
     * 🔑 Inicia sesión en el sistema de pagos
     */
    function loginPaymentSystem() {
        
        alert('Iniciando sesión en el sistema de pagos...');
    }

    /**
     * 📊 Consulta el estado de pago
     */
    function consultPaymentStatus() {
        
        alert('Consultando estado de pago...');
    }

    /**
     * 🚪 Cierra sesión del sistema de pagos
     */
    function logoutPaymentSystem() {
        
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            alert('Sesión cerrada exitosamente');
        }
    }

    /**
     * 💳 Procesa un pago
     */
    function processPayment() {
        
        alert('Procesando pago - En desarrollo');
    }

    /**
     * 💰 Paga una deuda específica
     */
    function payDebt(index) {
        
        alert(`Procesando pago de deuda #${index} - En desarrollo`);
    }

    function toggleChatbot() {
        if (typeof window.toggleChatbot === 'function') {
            window.toggleChatbot();
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
