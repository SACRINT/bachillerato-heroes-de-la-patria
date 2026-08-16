/**
 * 🎯 CENTRO DE DESCARGAS - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onkeypress a addEventListener
 *
 * Archivo: descargas-events.js
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
        

        registerDocumentDownloadButtons();
        registerCategoryFilterButtons();
        registerSearchButton();
        registerHelpAndSupportButtons();
        registerChatbotHandlers();

        
    }

    /**
     * 📥 HANDLERS 1-6: Document Download Buttons
     * Botones para descargar documentos destacados
     */
    function registerDocumentDownloadButtons() {
        // Registrar botones por su data-document attribute
        const downloadButtons = document.querySelectorAll('.download-document-btn');
        downloadButtons.forEach(btn => {
            const docId = btn.getAttribute('data-document');
            if (docId) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    downloadDocument(docId);
                });
            }
        });

        // Fallback: registrar botones por onclick attribute (compatibilidad)
        const legacyButtons = document.querySelectorAll('button[onclick*="downloadCenter.downloadDocument"]');
        legacyButtons.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            const match = onclick.match(/downloadCenter\.downloadDocument\('([^']+)'\)/);
            if (match && match[1]) {
                const docId = match[1];
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    downloadDocument(docId);
                });
            }
        });
    }

    /**
     * 🎯 HANDLERS 7-10: Category Filter Buttons
     * Botones para filtrar documentos por categoría
     */
    function registerCategoryFilterButtons() {
        // Registrar botones por su data-category attribute
        const categoryButtons = document.querySelectorAll('.filter-category-btn');
        categoryButtons.forEach(btn => {
            const category = btn.getAttribute('data-category');
            if (category) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    filterCategory(category);
                });
            }
        });

        // Fallback: registrar botones por onclick attribute (compatibilidad)
        const legacyButtons = document.querySelectorAll('button[onclick*="filterCategory"]');
        legacyButtons.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            const match = onclick.match(/filterCategory\('([^']+)'\)/);
            if (match && match[1]) {
                const category = match[1];
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    filterCategory(category);
                });
            }
        });
    }

    /**
     * 🔍 HANDLER 11: Search Button
     * Botón para buscar documentos
     */
    function registerSearchButton() {
        // Búsqueda por ID
        const searchBtn = document.querySelector('button[onclick*="searchDocuments"]');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                searchDocuments();
            });
        }

        // Buscar por clase (nuevo patrón)
        const searchBtnClass = document.querySelector('.search-documents-btn');
        if (searchBtnClass) {
            searchBtnClass.addEventListener('click', function(e) {
                e.preventDefault();
                searchDocuments();
            });
        }
    }

    /**
     * ❓ HANDLERS 12-13: Help and Support Buttons
     * Botones para mostrar ayuda y solicitar documentos
     */
    function registerHelpAndSupportButtons() {
        // Botón mostrar ayuda
        const helpBtn = document.querySelector('button[onclick*="showHelp"]');
        if (helpBtn) {
            helpBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showHelp();
            });
        }

        // Botón solicitar documento
        const requestBtn = document.querySelector('button[onclick*="requestDocument"]');
        if (requestBtn) {
            requestBtn.addEventListener('click', function(e) {
                e.preventDefault();
                requestDocument();
            });
        }
    }

    /**
     * 🤖 HANDLERS 14-16: Chatbot Interaction
     * Manejo del chatbot y envío de mensajes
     */
    function registerChatbotHandlers() {
        // Botón toggle del chatbot por onclick (fallback para compatibilidad)
        const chatbotToggleBtn = document.querySelector('button[onclick*="toggleChatbot"]');
        if (chatbotToggleBtn) {
            chatbotToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                toggleChatbot();
            });
        }

        // Botón toggle por ID (nuevo patrón)
        const chatbotToggleId = document.getElementById('chatbotToggle');
        if (chatbotToggleId) {
            chatbotToggleId.addEventListener('click', toggleChatbot);
        }

        // Botón cerrar chatbot con ID (nuevo patrón)
        const chatbotCloseBtn = document.getElementById('chatbotCloseBtn');
        if (chatbotCloseBtn) {
            chatbotCloseBtn.addEventListener('click', toggleChatbot);
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

        // Botón enviar mensaje por ID (nuevo patrón)
        const sendBtn = document.getElementById('chatbotSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Botón enviar mensaje selector antiguo (fallback para compatibilidad)
        const sendBtnFallback = document.querySelector('.chatbot-input button');
        if (sendBtnFallback && sendBtn !== sendBtnFallback) {
            sendBtnFallback.addEventListener('click', sendMessage);
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    /**
     * 📥 Descarga un documento por su ID
     */
    function downloadDocument(docId) {
        

        // Llamar a downloadCenter si está disponible
        if (window.downloadCenter && typeof window.downloadCenter.downloadDocument === 'function') {
            window.downloadCenter.downloadDocument(docId);
        } else {
            // Fallback
            alert(`Descargando documento: ${docId}`);
        }
    }

    /**
     * 🎯 Filtra documentos por categoría
     */
    function filterCategory(category) {
        

        // Scroll a la sección de catálogo
        const catalogSection = document.getElementById('catalogo-documentos');
        if (catalogSection) {
            catalogSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Aquí iría la lógica de filtrado real
        alert(`Filtrando documentos por categoría: ${category}`);
    }

    /**
     * 🔍 Busca documentos
     */
    function searchDocuments() {
        

        const searchInput = document.getElementById('documentSearch');
        const searchTerm = searchInput ? searchInput.value.trim() : '';

        if (!searchTerm) {
            alert('Por favor ingresa un término de búsqueda');
            return;
        }

        
        alert(`Buscando: "${searchTerm}"`);
    }

    /**
     * ❓ Muestra la modal de ayuda
     */
    function showHelp() {
        

        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function(){
                helpModal.style.display = 'block';
            })(helpModal);
            bootstrapModal.show?.();
        }
    }

    /**
     * 📝 Muestra la modal de solicitud de documento
     */
    function requestDocument() {
        

        const requestModal = document.getElementById('requestModal');
        if (requestModal) {
            const bootstrapModal = new (window.bootstrap?.Modal || function(){
                requestModal.style.display = 'block';
            })(requestModal);
            bootstrapModal.show?.();
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
