/**
 * @fileoverview Sanitization Helper Utilities.
 * Migrated from public/js/dompurify-config.js
 */

declare const DOMPurify: any;

export const DOMPURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'div', 'span', 'article', 'section', 'main', 'header', 'footer', 'nav',
        'strong', 'b', 'em', 'i', 'u', 'mark', 'small', 'sub', 'sup',
        'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
        'blockquote', 'cite', 'code', 'pre', 'a', 'img',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'dl', 'dt', 'dd',
        'form', 'input', 'label', 'select', 'option', 'textarea', 'button',
        'script', 'link', 'style'
    ],
    ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'loading',
        'aria-label', 'aria-hidden', 'aria-expanded', 'aria-controls', 'role', 'id', 'class',
        'data-*', 'data-bs-toggle', 'data-bs-target', 'data-bs-dismiss',
        'type', 'placeholder', 'value', 'name', 'for', 'tabindex', 'style',
        'data-tenant', 'data-action', 'data-context'
    ],
    FORCE_BODY: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    KEEP_CONTENT: true,
    IN_PLACE: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|urn|magnet):|[^a-z]|[a-z+.\-]*(?:[^a-z+.\-:]|$))/i,
    ADD_TAGS: ['script', 'link', 'style'],
    ADD_ATTR: ['src', 'rel', 'href', 'type', 'crossorigin', 'integrity'],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    RETURN_TRUSTED_TYPE: true
};

export function sanitizeHTML(html: string): string {
    if (!html || typeof html !== 'string') return '';
    if (typeof DOMPurify === 'undefined') {
        console.warn('[DOMPURIFY] DOMPurify unavailable. Returning raw HTML.');
        return html;
    }

    const result = DOMPurify.sanitize(html, DOMPURIFY_CONFIG);

    if (typeof result === 'string') {
        return result;
    } else if (result && typeof result.toString === 'function') {
        return result.toString();
    }
    return String(result || '');
}

export function sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    if (typeof DOMPurify === 'undefined') return text;

    return DOMPurify.sanitize(text, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: []
    }) as string;
}

export function escapeHTML(text: string): string {
    if (!text || typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') return '';

    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

    try {
        const urlObj = new URL(url, window.location.href);
        const isAllowed = allowedProtocols.some(protocol => urlObj.protocol === protocol);
        return isAllowed ? url : '';
    } catch (e) {
        if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
            return url;
        }
        return '';
    }
}

// Make globally available for hybrid legacy support
(window as any).sanitizeHTML = sanitizeHTML;
(window as any).sanitizeText = sanitizeText;
(window as any).escapeHTML = escapeHTML;
(window as any).sanitizeURL = sanitizeURL;
