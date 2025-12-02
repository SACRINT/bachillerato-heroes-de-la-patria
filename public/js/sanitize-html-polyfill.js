// ==========================================
// SANITIZE HTML HELPER - Polyfill global
// ==========================================
// Este archivo debe cargarse ANTES de main.js y otros scripts que usen sanitizeHTML
if (typeof sanitizeHTML === 'undefined') {
    window.sanitizeHTML = function (html, context = 'default') {
        if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
            return DOMPurify.sanitize(html);
        }
        // Fallback: basic escaping if DOMPurify not loaded yet
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    };
}
