/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * Archivo de eventos para index.html - Reemplaza scripts inline por eventos externos
 * Compatible con CSP (Content Security Policy)
 */

document.addEventListener('DOMContentLoaded', function() {
    debugLog.log('APP', '🔧 index-events.js cargado correctamente');

    // Inicializar todos los event listeners
    initializeChatbotEvents();
    // initializeDevCredentialsEvents(); // DESHABILITADO: El archivo dev-credentials.js no existe.

    debugLog.log('APP', '✅ Todos los eventos de index.html configurados');
});

/**
 * Eventos del chatbot
 */
function initializeChatbotEvents() {
    // Botón para cerrar chatbot
    const chatbotCloseBtn = document.querySelector('[data-action="toggle-chatbot"]');
    if (chatbotCloseBtn) {
        chatbotCloseBtn.removeAttribute('onclick');
        chatbotCloseBtn.addEventListener('click', function() {
            if (typeof toggleChatbot === 'function') {
                toggleChatbot();
            } else {
                debugLog.warn('APP', '⚠️ Función toggleChatbot no encontrada');
            }
        });
        debugLog.log('APP', '✅ Evento chatbot close configurado');
    }

    // Botón para enviar mensaje
    const sendMessageBtn = document.querySelector('[data-action="send-message"]');
    if (sendMessageBtn) {
        sendMessageBtn.removeAttribute('onclick');
        sendMessageBtn.addEventListener('click', function() {
            if (typeof sendMessage === 'function') {
                sendMessage();
            } else {
                debugLog.warn('APP', '⚠️ Función sendMessage no encontrada');
            }
        });
        debugLog.log('MESSAGE', '✅ Evento send message configurado');
    }
}

/**
 * Eventos para credenciales de desarrollo
 */
function initializeDevCredentialsEvents() {
    // Buscar todos los botones de credenciales de desarrollo
    const devButtons = [
        { selector: '[data-action="fill-dev-credentials" data-param-1="\'admin\'"]', type: 'admin' },
        { selector: '[data-action="fill-dev-credentials" data-param-1="\'teacher\'"]', type: 'teacher' },
        { selector: '[data-action="fill-dev-credentials" data-param-1="\'student\'"]', type: 'student' }
    ];

    devButtons.forEach(({ selector, type }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function() {
                if (typeof fillDevCredentials === 'function') {
                    fillDevCredentials(type);
                } else {
                    debugLog.warn('APP', `⚠️ Función fillDevCredentials no encontrada para tipo: ${type}`);
                }
            });
            debugLog.log('APP', `✅ Evento dev credentials '${type}' configurado`);
        }
    });
}

/**
 * Función de utilidad para debug
 */
function logEventSetup(eventName, element) {
    debugLog.log('APP', `✅ Evento '${eventName}' configurado en elemento:`, element);
}

/**
 * Función para verificar que todas las dependencias están cargadas
 */
function verifyDependencies() {
    const requiredFunctions = ['toggleChatbot', 'sendMessage', 'fillDevCredentials'];
    const missing = [];

    requiredFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            missing.push(funcName);
        }
    });

    if (missing.length > 0) {
        debugLog.warn('APP', '⚠️ Funciones faltantes:', missing);
        void 0;
    } else {
        debugLog.log('APP', '✅ Todas las dependencias encontradas');
    }

    return missing.length === 0;
}

// Verificar dependencias cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        verifyDependencies();
    }, 1000); // Esperar 1 segundo para que otros scripts carguen
});