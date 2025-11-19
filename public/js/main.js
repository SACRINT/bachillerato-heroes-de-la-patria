// Main JavaScript para el sitio web

// ✅ LOGGER MANAGER - Cargar primero para centralizar logging
(function loadLogger() {
    const script = document.createElement('script');
    script.src = 'js/logger-manager.js';
    script.async = false;
    document.head.appendChild(script);
})();

// ✅ BRIDGES - Cargar inmediatamente después de logger para desacoplamiento
// Orden crítico: data-event-emitter primero (base), luego bridges específicos
(function loadBridges() {
    const bridges = [
        'js/data-event-emitter.js',      // Base event emitter (usado por otros bridges)
        'js/auth-context-bridge.js',     // Desacopla auth ↔ context
        'js/auth-api-bridge.js',         // Desacopla api-client ↔ auth
        'js/unified-auth-system-v2.js'   // ✅ FIX (19 Nov 2025): Sistema de autenticación V2
    ];

    bridges.forEach(bridgePath => {
        const script = document.createElement('script');
        script.src = bridgePath;
        script.async = false;
        document.head.appendChild(script);
    });

    console.log('[MAIN.JS] ✅ 4 scripts cargados: bridges + unified-auth-system-v2');
})();

// Load event handler files FIRST (in order), then event-handler-registry
// CRITICAL: event-handler-registry references functions from these modules
// Must wait for all event handlers to load before loading event-handler-registry

let eventHandlersLoaded = 0;
const eventHandlerFiles = ['js/bolsa-trabajo-events.js', 'js/calificaciones-events.js', 'js/citas-events.js', 'js/inscriptions-handler.js', 'js/orphan-handlers.js'];

function loadNextEventHandler() {
    if (eventHandlersLoaded < eventHandlerFiles.length) {
        const script = document.createElement('script');
        script.src = eventHandlerFiles[eventHandlersLoaded];
        script.onload = function() {
            eventHandlersLoaded++;
            console.log(`[MAIN.JS] ✅ Loaded ${eventHandlerFiles[eventHandlersLoaded - 1]}`);
            loadNextEventHandler(); // Load next file
        };
        script.onerror = function() {
            console.error(`[MAIN.JS] ❌ Failed to load ${eventHandlerFiles[eventHandlersLoaded]}`);
            eventHandlersLoaded++;
            loadNextEventHandler(); // Continue to next file
        };
        document.head.appendChild(script);
    } else {
        // All event handlers loaded, now load the registry
        console.log('[MAIN.JS] ✅ All event handlers loaded, loading event-handler-registry...');
        const eventHandlerScript = document.createElement('script');
        eventHandlerScript.src = 'js/event-handler-registry.js';
        eventHandlerScript.async = false;
        document.head.appendChild(eventHandlerScript);
    }
}

loadNextEventHandler();

document.addEventListener('DOMContentLoaded', function() {
    // ✅ REVERTIDO A VERSIÓN SIMPLE QUE FUNCIONABA (commit eac16ff)
    // Cargar header y footer directamente sin esperar a auth system
    initializeChatbot();
    loadHeaderFooter();

    // 🏢 LISTENER: Cuando el tenant config esté cargado, actualizar header
    document.addEventListener('tenantConfigLoaded', updateHeaderWithTenantConfig);

    // El modo oscuro ahora se maneja via script.js y header.html
    // setTimeout(() => {
    //     initializeDarkMode();
    // }, 1000);
});

// ==========================================
// MODO OSCURO
// ==========================================
function initializeDarkMode() {
    // Verificar si el botón ya existe
    if (document.getElementById('darkModeToggle')) {
        return;
    }
    
    // Crear botón de modo oscuro
    const darkModeToggle = createDarkModeToggle();
    
    // Añadir a la navegación
    const navbar = document.querySelector('.navbar-nav');
    if (navbar) {
        navbar.appendChild(darkModeToggle);
        
        // Cargar preferencia guardada
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    } else {
        // Si no encuentra navbar, intentar de nuevo en 1 segundo
        setTimeout(initializeDarkMode, 1000);
    }
}

function createDarkModeToggle() {
    const li = document.createElement('li');
    li.className = 'nav-item';
    
    const button = document.createElement('button');
    button.className = 'nav-link btn btn-link border-0 bg-transparent';
    button.id = 'darkModeToggle';
    button.setAttribute('aria-label', 'Alternar modo oscuro');
    // 🔒 Check if DOMPurify is available
    const sanitizedMoonIcon = (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize)
        ? DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-moon" id="darkModeIcon"></i>', 'simple'))
        : '<i class="fas fa-moon" id="darkModeIcon"></i>';
    button.innerHTML = sanitizedMoonIcon;
    
    button.addEventListener('click', toggleDarkMode);
    
    li.appendChild(button);
    return li;
}

function toggleDarkMode() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function setTheme(theme) {
    const body = document.body;
    const icon = document.getElementById('darkModeIcon');
    
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        if (icon) icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        if (icon) icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// ==========================================
// CHATBOT
// ==========================================
function initializeChatbot() {
    createChatbot();
}

function createChatbot() {
    // Crear botón flotante del chatbot
    const chatButton = document.createElement('div');
    chatButton.id = 'chatbot-toggle';
    chatButton.className = 'chatbot-toggle';
    // 🔒 Check if DOMPurify is available before using it
    const sanitizedIcon = (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize)
        ? DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-comments"></i>', 'simple'))
        : '<i class="fas fa-comments"></i>';
    chatButton.innerHTML = sanitizedIcon;
    chatButton.addEventListener('click', toggleChatbot);
    
    // Crear ventana del chatbot
    const chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window';
    chatWindow.className = 'chatbot-window d-none';
    chatWindow.innerHTML = sanitizeHTML(`
        <div class="chatbot-header">
            <h5 class="mb-0">
                <i class="fas fa-robot me-2"></i>Asistente Virtual BGE
            </h5>
            <button class="btn btn-sm btn-link text-white" data-action="close-chatbot">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="chatbot-body" id="chatbot-messages">
            <div class="message bot-message">
                <div class="message-content">
                    ¡Hola! Soy el asistente virtual del window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria'). 
                    ¿En qué puedo ayudarte hoy?
                </div>
            </div>
        </div>
        <div class="chatbot-footer">
            <div class="input-group">
                <input type="text" class="form-control" id="chatbot-input" placeholder="Escribe tu mensaje...">
                <button class="btn btn-primary" data-action="send-message">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `);
    
    // Añadir al body
    document.body.appendChild(chatButton);
    document.body.appendChild(chatWindow);
    
    // Event listener para Enter en el input
    const chatbotInput = document.getElementById('chatbot-input');
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    } else {
        console.warn('⚠️ [MAIN.JS] chatbot-input no encontrado en el DOM');
    }
}

function toggleChatbot() {
    // Usar la función del chatbot.js si está disponible
    if (typeof window.toggleChatbot === 'function' && window.toggleChatbot !== toggleChatbot) {
        return window.toggleChatbot();
    }
    
    const chatWindow = document.getElementById('chatbot-window');
    const chatContainer = document.getElementById('chatbotContainer');
    
    if (chatContainer && typeof toggleChatbot !== 'undefined') {
        // Usar la función del chatbot.js
        return;
    }
    
    if (chatWindow) {
        chatWindow.classList.toggle('d-none');
        
        const chatButton = document.getElementById('chatbot-toggle');
        if (chatButton) {
            // 🔒 Check if DOMPurify is available
            if (chatWindow.classList.contains('d-none')) {
                const sanitizedComments = (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize)
                    ? DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-comments"></i>', 'simple'))
                    : '<i class="fas fa-comments"></i>';
                chatButton.innerHTML = sanitizedComments;
            } else {
                const sanitizedTimes = (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize)
                    ? DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-times"></i>', 'simple'))
                    : '<i class="fas fa-times"></i>';
                chatButton.innerHTML = sanitizedTimes;
            }
        }
    }
}

function closeChatbot() {
    const chatWindow = document.getElementById('chatbot-window');
    const chatButton = document.getElementById('chatbot-toggle');

    chatWindow.classList.add('d-none');
    // 🔒 Check if DOMPurify is available
    const sanitizedIcon = (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize)
        ? DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-comments"></i>', 'simple'))
        : '<i class="fas fa-comments"></i>';
    chatButton.innerHTML = sanitizedIcon;
}

function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Añadir mensaje del usuario
    addMessage(message, 'user');
    
    // Limpiar input
    input.value = '';
    
    // Simular respuesta del bot
    setTimeout(() => {
        const response = generateBotResponse(message);
        addMessage(response, 'bot');
    }, 1000);
}

function addMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = sanitizeHTML(`
        <div class="message-content">
            ${message}
        </div>
    `);
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateBotResponse(userMessage) {
    // Usar la función del chatbot.js si está disponible
    if (typeof processMessage === 'function') {
        return processMessage(userMessage);
    }
    
    // Respuesta de fallback si no está disponible el chatbot principal
    const message = userMessage.toLowerCase();
    
    if (message.includes('hola') || message.includes('buenos días') || message.includes('buenas tardes')) {
        return formatResponse({
            title: '👋 ¡Bienvenido!',
            content: [
                {
                    text: 'Hola, bienvenido al BGE Héroes de la Patria. Soy tu asistente virtual y estoy aquí para ayudarte.'
                }
            ],
            footer: '¿En qué puedo asistirte hoy?'
        });
    }
    
    return formatResponse({
        title: '💬 Asistencia Virtual',
        content: [
            {
                subtitle: 'Para obtener información específica, puedes:',
                text: '• Agendar una <a href="citas.html">cita</a><br>• Visitar nuestra página de <a href="contacto.html">contacto</a><br>• Explorar nuestros <a href="servicios.html">servicios</a>'
            }
        ],
        footer: '¿Hay algo específico en lo que pueda ayudarte?'
    });
}

// Función para formatear respuestas profesionales
function formatResponse(responseData) {
    if (typeof responseData === 'string') {
        return `<div class="response-simple">${responseData}</div>`;
    }
    
    let html = `<div class="response-professional">`;
    
    if (responseData.title) {
        html += `<div class="response-title">${responseData.title}</div>`;
    }
    
    if (responseData.content && Array.isArray(responseData.content)) {
        html += `<div class="response-content">`;
        responseData.content.forEach(item => {
            html += `<div class="response-section">`;
            if (item.subtitle) {
                html += `<div class="response-subtitle">${item.subtitle}</div>`;
            }
            if (item.text) {
                html += `<div class="response-text">${item.text}</div>`;
            }
            html += `</div>`;
        });
        html += `</div>`;
    }
    
    if (responseData.footer) {
        html += `<div class="response-footer">${responseData.footer}</div>`;
    }
    
    html += `</div>`;
    return html;
}

// ==========================================
// CARGA DE HEADER Y FOOTER
// ==========================================
// ✅ FASE 1.3 REFACTORIZACIÓN: Scripts dinámicos movidos a carga estática en header.html
// ELIMINADO: loadScriptDynamically() y loadScriptsSequentially() (eran causa de race conditions)
// Cambio: nested-dropdowns.js y admin-auth.js ahora se cargan en header.html líneas 812-813

function loadHeaderFooter() {
    console.log('🔍 [MAIN.JS] loadHeaderFooter() iniciando...');

    // ✅ REVERTIDO A VERSIÓN SIMPLE QUE FUNCIONABA (commit eac16ff)
    const headerContainer = document.getElementById('main-header');
    const footerContainer = document.getElementById('main-footer');

    if (headerContainer && !headerContainer.innerHTML.trim()) {
        console.log('📥 [MAIN.JS] Iniciando fetch de header.html...');

        fetch('partials/header.html')
            .then(response => {
                console.log(`📥 [MAIN.JS] Header fetch status: ${response.status}`);
                return response.text();
            })
            .then(data => {
                console.log(`📏 [MAIN.JS] Header HTML original size: ${data.length} caracteres`);
                console.log(`🔍 [MAIN.JS] Primeros 200 caracteres del HTML original:`, data.substring(0, 200));

                const sanitizedHTML = sanitizeHTML(data, 'partials');
                console.log(`🧼 [MAIN.JS] Header HTML sanitizado size: ${sanitizedHTML.length} caracteres`);
                console.log(`🔍 [MAIN.JS] Primeros 200 caracteres del HTML sanitizado:`, sanitizedHTML.substring(0, 200));

                headerContainer.innerHTML = sanitizedHTML;
                console.log('✅ [MAIN.JS] Header HTML inyectado en el DOM (usando config PARTIALS)');

                // Verificar si el navbar-collapse existe después de inyectar
                const navbarCollapse = document.getElementById('mainNavbarCollapse');
                if (navbarCollapse) {
                    console.log('✅ [MAIN.JS] navbar-collapse encontrado:', navbarCollapse.className);
                    console.log('✅ [MAIN.JS] navbar-collapse computed display:', window.getComputedStyle(navbarCollapse).display);
                    console.log('✅ [MAIN.JS] navbar-collapse computed visibility:', window.getComputedStyle(navbarCollapse).visibility);
                } else {
                    console.error('❌ [MAIN.JS] navbar-collapse NO encontrado en el DOM');
                }

                // ✅ FASE 1.3: Los scripts ya se cargan de forma estática en header.html
                // (nested-dropdowns.js y admin-auth.js en líneas 812-813)
                // ELIMINADO: Carga dinámica que causaba race conditions

                // Disparar evento para que otros scripts sepan que el header está listo
                console.log('📡 [MAIN.JS] Disparando evento headerLoaded...');
                document.dispatchEvent(new Event('headerLoaded'));
                console.log('✅ [MAIN.JS] loadHeaderFooter() completado exitosamente');
            })
            .catch(error => {
                console.error('❌ [MAIN.JS] Error en loadHeaderFooter:', error);
                console.error('❌ [MAIN.JS] Error stack:', error.stack);
            });
    } else {
        console.log('⚠️ [MAIN.JS] Header container no encontrado o ya contiene datos');
    }

    if (footerContainer && !footerContainer.innerHTML.trim()) {
        console.log('📥 [MAIN.JS] Iniciando fetch de footer.html...');

        fetch('partials/footer.html')
            .then(response => {
                console.log(`📥 [MAIN.JS] Footer fetch status: ${response.status}`);
                return response.text();
            })
            .then(data => {
                footerContainer.innerHTML = sanitizeHTML(data, 'partials');
                console.log('✅ [MAIN.JS] Footer cargado dinámicamente (usando config PARTIALS)');
            })
            .catch(error => {
                console.error('❌ [MAIN.JS] Error en footer:', error);
            });
    } else {
        console.log('⚠️ [MAIN.JS] Footer container no encontrado o ya contiene datos');
    }
}


// ==========================================
// ESTILOS CSS PARA CHATBOT Y MODO OSCURO
// ==========================================
const styles = document.createElement('style');
styles.textContent = `
    /* Modo Oscuro */
    .dark-mode {
        background-color: #1a1a1a !important;
        color: #f8f9fa !important;
    }
    
    .dark-mode .navbar {
        background-color: #2d3748 !important;
    }
    
    .dark-mode .card {
        background-color: #2d3748 !important;
        border-color: #4a5568 !important;
        color: #f8f9fa !important;
    }
    
    .dark-mode .bg-light {
        background-color: #2d3748 !important;
    }
    
    .dark-mode .text-muted {
        color: #a0aec0 !important;
    }
    
    /* Chatbot Styles */
    .chatbot-toggle {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 60px !important;
        height: 60px !important;
        background: linear-gradient(135deg, #1976D2, #0D47A1) !important;
        border-radius: 50% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        z-index: 9999 !important;
        transition: all 0.3s ease !important;
        color: white !important;
        font-size: 24px !important;
        border: none !important;
    }
    
    .chatbot-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(0,0,0,0.25);
    }
    
    .chatbot-window {
        position: fixed !important;
        bottom: 90px !important;
        right: 20px !important;
        width: 350px !important;
        height: 500px !important;
        background: white !important;
        border-radius: 15px !important;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2) !important;
        z-index: 9998 !important;
        flex-direction: column !important;
        overflow: hidden !important;
        animation: slideIn 0.3s ease;
    }
    
    .chatbot-window:not(.d-none) {
        display: flex !important;
    }
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .chatbot-header {
        background: linear-gradient(135deg, var(--bs-primary), var(--bs-secondary));
        color: white;
        padding: 15px;
        display: flex;
        justify-content: between;
        align-items: center;
    }
    
    .chatbot-body {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        background: #f8f9fa;
    }
    
    .chatbot-footer {
        padding: 15px;
        border-top: 1px solid #dee2e6;
        background: white;
    }
    
    .message {
        margin-bottom: 15px;
    }
    
    .message-content {
        padding: 10px 15px;
        border-radius: 18px;
        max-width: 85%;
        word-wrap: break-word;
    }
    
    .user-message {
        display: flex;
        justify-content: flex-end;
    }
    
    .user-message .message-content {
        background: var(--bs-primary);
        color: white;
    }
    
    .bot-message .message-content {
        background: white;
        color: #333;
        border: 1px solid #dee2e6;
    }
    
    .bot-message .message-content a {
        color: var(--bs-primary);
        text-decoration: none;
    }
    
    .bot-message .message-content a:hover {
        text-decoration: underline;
    }
    
    /* Professional Response Styles */
    .response-professional {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        padding: 16px;
        margin: 8px 0;
        border-left: 4px solid var(--bs-primary);
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .response-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--bs-primary);
        margin-bottom: 12px;
        display: flex;
        align-items: center;
    }
    
    .response-content {
        margin-bottom: 8px;
    }
    
    .response-section {
        margin-bottom: 12px;
    }
    
    .response-subtitle {
        font-weight: 600;
        color: #495057;
        margin-bottom: 4px;
        font-size: 14px;
    }
    
    .response-text {
        color: #6c757d;
        line-height: 1.4;
        font-size: 14px;
    }
    
    .response-footer {
        font-size: 12px;
        color: #868e96;
        font-style: italic;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #dee2e6;
    }
    
    .response-simple {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid var(--bs-primary);
    }

    /* Dark mode chatbot */
    .dark-mode .chatbot-window {
        background: #2d3748;
        color: #f8f9fa;
    }
    
    .dark-mode .chatbot-body {
        background: #1a1a1a;
    }
    
    .dark-mode .chatbot-footer {
        background: #2d3748;
        border-color: #4a5568;
    }
    
    .dark-mode .bot-message .message-content {
        background: #4a5568;
        color: #f8f9fa;
        border-color: #718096;
    }
    
    .dark-mode .response-professional {
        background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
        border-left-color: #63b3ed;
    }
    
    .dark-mode .response-title {
        color: #63b3ed;
    }
    
    .dark-mode .response-subtitle {
        color: #e2e8f0;
    }
    
    .dark-mode .response-text {
        color: #cbd5e0;
    }
    
    .dark-mode .response-footer {
        color: #a0aec0;
        border-top-color: #4a5568;
    }
    
    .dark-mode .response-simple {
        background: #4a5568;
        border-left-color: #63b3ed;
        color: #f8f9fa;
    }
    
    .dark-mode .form-control {
        background-color: #4a5568;
        border-color: #718096;
        color: #f8f9fa;
    }
    
    .dark-mode .form-control:focus {
        background-color: #4a5568;
        border-color: var(--bs-primary);
        color: #f8f9fa;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .chatbot-window {
            width: 300px;
            height: 400px;
            right: 10px;
            bottom: 80px;
        }
        
        .chatbot-toggle {
            right: 15px;
            bottom: 15px;
            width: 50px;
            height: 50px;
            font-size: 20px;
        }
    }
`;
document.head.appendChild(styles);

// ==========================================
// 🏢 TENANT CONFIG INTEGRATION
// ==========================================

/**
 * Actualizar header con configuración dinámica del tenant
 * Se ejecuta cuando el evento 'tenantConfigLoaded' se dispara
 */
function updateHeaderWithTenantConfig(event) {
    try {
        const config = event.detail || TenantConfigManager.getConfig();

        if (!config) {
            console.warn('[MAIN.JS] ⚠️ No hay configuración de tenant disponible');
            return;
        }

        console.log('[MAIN.JS] 🏢 Actualizando header, footer y contacto con configuración del tenant...');

        // ========== HEADER UPDATES ==========
        // 1. Actualizar nombre de la escuela en el header
        const schoolNameElements = document.querySelectorAll('[data-tenant="school-name"]');
        if (schoolNameElements.length > 0 && config.school && config.school.name) {
            schoolNameElements.forEach(element => {
                element.textContent = config.school.name;
                console.log('[MAIN.JS] ✅ Nombre de escuela actualizado:', config.school.name);
            });
        }

        // 2. Actualizar logo en el header
        const logoElements = document.querySelectorAll('[data-tenant="school-logo"]');
        if (logoElements.length > 0 && config.branding && config.branding.logoUrl) {
            logoElements.forEach(element => {
                element.src = config.branding.logoUrl;
                element.alt = config.school?.name || 'Logo de la escuela';
                console.log('[MAIN.JS] ✅ Logo actualizado:', config.branding.logoUrl);
            });
        }

        // 3. Actualizar colores primarios si existen
        if (config.branding && config.branding.primaryColor) {
            const root = document.documentElement;
            root.style.setProperty('--primary-color', config.branding.primaryColor);
            console.log('[MAIN.JS] ✅ Color primario actualizado:', config.branding.primaryColor);
        }

        // 4. Actualizar título de la página
        if (config.school && config.school.name) {
            document.title = config.school.name;
            console.log('[MAIN.JS] ✅ Título de página actualizado');
        }

        // ========== FOOTER UPDATES ==========
        // 5. Actualizar nombre de escuela en copyright del footer
        const schoolNameCopyrightElements = document.querySelectorAll('[data-tenant="school-name-copyright"]');
        if (schoolNameCopyrightElements.length > 0 && config.school && config.school.name) {
            schoolNameCopyrightElements.forEach(element => {
                element.textContent = config.school.name;
                console.log('[MAIN.JS] ✅ Nombre de escuela en copyright actualizado');
            });
        }

        // 6. Actualizar dirección en footer
        const addressElements = document.querySelectorAll('[data-tenant="school-address"]');
        if (addressElements.length > 0 && config.contact && config.contact.address) {
            addressElements.forEach(element => {
                element.textContent = config.contact.address;
                console.log('[MAIN.JS] ✅ Dirección en footer actualizada');
            });
        }

        // 7. Actualizar teléfono en footer
        const phoneElements = document.querySelectorAll('[data-tenant="school-phone"]');
        if (phoneElements.length > 0 && config.contact && config.contact.phone) {
            phoneElements.forEach(element => {
                element.textContent = config.contact.phone;
                element.href = `tel:${config.contact.phone}`;
                console.log('[MAIN.JS] ✅ Teléfono en footer actualizado');
            });
        }

        // 8. Actualizar email en footer
        const emailElements = document.querySelectorAll('[data-tenant="school-email"]');
        if (emailElements.length > 0 && config.contact && config.contact.email) {
            emailElements.forEach(element => {
                element.textContent = config.contact.email;
                element.href = `mailto:${config.contact.email}`;
                console.log('[MAIN.JS] ✅ Email en footer actualizado');
            });
        }

        // 9. Actualizar horario en footer
        const hoursElements = document.querySelectorAll('[data-tenant="school-hours"]');
        if (hoursElements.length > 0 && config.contact && config.contact.hours) {
            hoursElements.forEach(element => {
                element.textContent = config.contact.hours;
                console.log('[MAIN.JS] ✅ Horario en footer actualizado');
            });
        }

        // ========== CONTACT PAGE UPDATES ==========
        // 10. Actualizar dirección en página de contacto
        const contactAddressElements = document.querySelectorAll('[data-tenant="contact-address"]');
        if (contactAddressElements.length > 0 && config.contact && config.contact.address) {
            contactAddressElements.forEach(element => {
                element.textContent = config.contact.address;
                console.log('[MAIN.JS] ✅ Dirección en página de contacto actualizada');
            });
        }

        // 11. Actualizar email en página de contacto
        const contactEmailElements = document.querySelectorAll('[data-tenant="contact-email"]');
        if (contactEmailElements.length > 0 && config.contact && config.contact.email) {
            contactEmailElements.forEach(element => {
                element.textContent = config.contact.email;
                element.href = `mailto:${config.contact.email}`;
                console.log('[MAIN.JS] ✅ Email en página de contacto actualizado');
            });
        }

        console.log('[MAIN.JS] ✅ Todos los elementos dinámicos actualizados exitosamente con configuración de tenant');

    } catch (error) {
        console.error('[MAIN.JS] ❌ Error actualizando elementos con tenant config:', error);
    }
}