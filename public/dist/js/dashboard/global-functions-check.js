/**
 * 🌐 GLOBAL FUNCTIONS CHECK - Asegura que funciones del chatbot estén accesibles
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

// Make sure functions are globally accessible if they exist
if (typeof toggleChatbot !== 'undefined') {
    window.toggleChatbot = toggleChatbot;
}
if (typeof sendMessage !== 'undefined') {
    window.sendMessage = sendMessage;
}
if (typeof handleKeyPress !== 'undefined') {
    window.handleKeyPress = handleKeyPress;
}
