/**
 * Archivo de eventos para index.html - Reemplaza scripts inline por eventos externos
 * Compatible con CSP (Content Security Policy)
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 index-events.js cargado correctamente');

    // Inicializar todos los event listeners
    initializeChatbotEvents();
    initializeDevCredentialsEvents();

    console.log('✅ Todos los eventos de index.html configurados');
});

/**
 * Eventos del chatbot
 */
function initializeChatbotEvents() {
    // Botón para cerrar chatbot
    const chatbotCloseBtn = document.querySelector('[onclick="toggleChatbot()"]');
    if (chatbotCloseBtn) {
        chatbotCloseBtn.removeAttribute('onclick');
        chatbotCloseBtn.addEventListener('click', function() {
            if (typeof toggleChatbot === 'function') {
                toggleChatbot();
            } else {
                console.warn('⚠️ Función toggleChatbot no encontrada');
            }
        });
        console.log('✅ Evento chatbot close configurado');
    }

    // Botón para enviar mensaje
    const sendMessageBtn = document.querySelector('[onclick="sendMessage()"]');
    if (sendMessageBtn) {
        sendMessageBtn.removeAttribute('onclick');
        sendMessageBtn.addEventListener('click', function() {
            if (typeof sendMessage === 'function') {
                sendMessage();
            } else {
                console.warn('⚠️ Función sendMessage no encontrada');
            }
        });
        console.log('✅ Evento send message configurado');
    }
}

/**
 * Eventos para credenciales de desarrollo
 */
function initializeDevCredentialsEvents() {
    // Buscar todos los botones de credenciales de desarrollo
    const devButtons = [
        { selector: '[onclick="fillDevCredentials(\'admin\')"]', type: 'admin' },
        { selector: '[onclick="fillDevCredentials(\'teacher\')"]', type: 'teacher' },
        { selector: '[onclick="fillDevCredentials(\'student\')"]', type: 'student' }
    ];

    devButtons.forEach(({ selector, type }) => {
        const button = document.querySelector(selector);
        if (button) {
            button.removeAttribute('onclick');
            button.addEventListener('click', function() {
                if (typeof fillDevCredentials === 'function') {
                    fillDevCredentials(type);
                } else {
                    console.warn(`⚠️ Función fillDevCredentials no encontrada para tipo: ${type}`);
                }
            });
            console.log(`✅ Evento dev credentials '${type}' configurado`);
        }
    });
}

/**
 * Función de utilidad para debug
 */
function logEventSetup(eventName, element) {
    console.log(`✅ Evento '${eventName}' configurado en elemento:`, element);
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
        console.warn('⚠️ Funciones faltantes:', missing);
        console.info('ℹ️ Estas funciones deberían estar definidas en otros archivos JS');
    } else {
        console.log('✅ Todas las dependencias encontradas');
    }

    return missing.length === 0;
}

// Verificar dependencias cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        verifyDependencies();
    }, 1000); // Esperar 1 segundo para que otros scripts carguen
});