/**
 * ✅ INICIALIZACIÓN GLOBAL DE DEBUGLOG Y DOMPURIFY FALLBACK
 * Proporciona una interfaz silenciosa de logging y un sistema de sanitización HTML robusto.
 */

(function() {
    'use strict';

    if (typeof window.debugLog === 'undefined') {
        window.debugLog = {
            log: () => {},
            error: (...args) => console.error('[BGE ERROR]', ...args),
            warn: () => {},
            info: () => {},
            debug: () => {}
        };
    }

    if (typeof window.DOMPurify === 'undefined') {
        window.DOMPurify = {
            sanitize: (str) => {
                if (typeof str !== 'string') return str;
                const div = document.createElement('div');
                div.textContent = str;
                return div.innerHTML;
            },
            isSupported: false
        };
    }

    if (typeof window.sanitizeHTML === 'undefined') {
        window.sanitizeHTML = function(html, mode = 'default') {
            if (typeof html !== 'string') return html;

            if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
                return window.DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: mode === 'simple' ? ['b', 'i', 'br'] : undefined,
                    ALLOWED_ATTR: []
                });
            }

            const div = document.createElement('div');
            div.textContent = html;
            return div.innerHTML;
        };
    }
})();
