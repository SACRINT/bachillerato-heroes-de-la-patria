/**
 * ✅ INICIALIZACIÓN GLOBAL DE DEBUGLOG Y DOMPURIFY FALLBACK
 * Proporciona una interfaz simple de logging para toda la aplicación
 * y un sistema de sanitización HTML robusto con fallback
 */

// ============================================
// 1. DEBUGLOG - Sistema de logging condicional
// ============================================
if (typeof debugLog === 'undefined') {
    window.debugLog = {
        log: (...args) => console.log('[BGE]', ...args),
        error: (...args) => console.error('[BGE ERROR]', ...args),
        warn: (...args) => console.warn('[BGE WARN]', ...args),
        info: (...args) => console.info('[BGE INFO]', ...args),
        debug: (...args) => console.debug('[BGE DEBUG]', ...args)
    };
}

console.log('✅ debugLog initialized');

// ============================================
// 2. DOMPURIFY - Sanitización de HTML
// ============================================
let dompurifyCheckCount = 0;
const dompurifyCheckInterval = setInterval(() => {
    dompurifyCheckCount++;

    if (typeof DOMPurify !== 'undefined' || (window && window.DOMPurify)) {
        window.DOMPurify = window.DOMPurify || DOMPurify;
        clearInterval(dompurifyCheckInterval);
        console.log('✅ DOMPurify is available');
    } else if (dompurifyCheckCount > 50) {
        // Si DOMPurify no llega en 5 segundos, crear fallback
        clearInterval(dompurifyCheckInterval);
        console.warn('⚠️ DOMPurify timeout - using fallback sanitizer');
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
}, 100);

// ============================================
// 3. SANITIZEH TMLHELPER - Wrapper global para sanitización
// ============================================
if (typeof window.sanitizeHTML === 'undefined') {
    window.sanitizeHTML = function(html, mode = 'default') {
        if (typeof html !== 'string') return html;

        // Si DOMPurify está disponible, usarlo
        if (typeof window.DOMPurify !== 'undefined' && window.DOMPurify.sanitize) {
            return window.DOMPurify.sanitize(html, {
                ALLOWED_TAGS: mode === 'simple' ? ['b', 'i', 'br'] : undefined,
                ALLOWED_ATTR: []
            });
        }

        // Fallback: escape básico de HTML
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    };
    console.log('✅ sanitizeHTML helper initialized');
}
