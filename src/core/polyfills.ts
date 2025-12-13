
/**
 * src/core/polyfills.ts
 * Polyfills for legacy compatibility
 */

import DOMPurify from 'dompurify';

export function installPolyfills() {
    // 1. sanitizeHTML (Global helper used by many legacy files)
    if (typeof (window as any).sanitizeHTML === 'undefined') {
        (window as any).sanitizeHTML = function (html: string, context: string = 'simple') {
            if (typeof DOMPurify !== 'undefined') {
                const config = {
                    ALLOWED_TAGS: ['div', 'p', 'span', 'a', 'strong', 'em', 'i', 'br', 'small', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'ul', 'li', 'nav', 'header', 'footer', 'img', 'form', 'input', 'label', 'select', 'option', 'textarea'],
                    ALLOWED_ATTR: ['class', 'id', 'role', 'aria-*', 'href', 'src', 'alt', 'data-action', 'data-bs-toggle', 'data-bs-target', 'data-bs-dismiss', 'type', 'placeholder', 'autocomplete', 'name', 'value'],
                    ALLOW_ARIA_ATTR: true,
                    ALLOW_DATA_ATTR: true,
                    KEEP_CONTENT: true
                };
                return DOMPurify.sanitize(html, config);
            }
            console.warn('[sanitizeHTML] DOMPurify not available, returning empty string');
            return '';
        };
    }
}
