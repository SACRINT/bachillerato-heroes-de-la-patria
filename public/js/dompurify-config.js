/**
 * 🔒 CONFIGURACIÓN CENTRALIZADA DE DOMPURIFY
 *
 * Propósito: Definir reglas seguras y consistentes para sanitización de HTML
 * en toda la aplicación BGE.
 *
 * Fecha: 11 Noviembre 2025
 * Standard: OWASP XSS Prevention / CSP Compliant
 *
 * NOTA: Este archivo DEBE cargarse ANTES de otros módulos que usen DOMPurify
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURACIÓN DE DOMPURIFY PARA BGE
    // ============================================

    const BGE_DOMPURIFY_CONFIG = {
        // Elementos permitidos (whitelist)
        ALLOWED_TAGS: [
            // Estructura
            'p', 'br', 'div', 'span', 'article', 'section', 'main',

            // ✅ HEADER/FOOTER/NAV (18 Nov 2025 - FIX para header dinámico)
            'header', 'footer', 'nav',

            // Texto
            'strong', 'b', 'em', 'i', 'u', 'mark', 'small', 'sub', 'sup',

            // Listas
            'ul', 'ol', 'li',

            // Tablas
            'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',

            // Citaciones
            'blockquote', 'cite',

            // Código
            'code', 'pre',

            // Links (IMPORTANTE: necesario para navegación)
            'a',

            // Media (controlado)
            'img',

            // Headings
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',

            // Descripciones
            'dl', 'dt', 'dd',

            // ✅ FORMULARIOS (18 Nov 2025 - FIX para header con search)
            'form', 'input', 'label', 'select', 'option', 'textarea', 'button',

            // ✅ SCRIPTS/STYLES (18 Nov 2025 - Permitir scripts del header)
            'script', 'link', 'style',
        ],

        // Atributos permitidos por elemento
        ALLOWED_ATTR: [
            // Links
            'href', 'title', 'target', 'rel',

            // Imágenes
            'src', 'alt', 'width', 'height', 'loading',

            // Accesibilidad
            'aria-label', 'aria-hidden', 'aria-expanded', 'aria-controls', 'role', 'id', 'class',

            // Data attributes (para framework)
            'data-*',

            // ✅ BOOTSTRAP (18 Nov 2025 - FIX para navbar collapse y dropdowns)
            'data-bs-toggle', 'data-bs-target', 'data-bs-dismiss',

            // ✅ FORMULARIOS (18 Nov 2025 - FIX para search en header)
            'type', 'placeholder', 'value', 'name', 'for', 'tabindex',

            // ✅ ESTILOS INLINE (18 Nov 2025 - Permitir inline styles del header)
            'style',

            // ✅ TENANT AWARE (18 Nov 2025 - Atributos tenant-config-loader)
            'data-tenant', 'data-action', 'data-context',
        ],

        // Politicas de parsing
        FORCE_BODY: false,           // No forzar body
        RETURN_DOM: false,           // Retornar string HTML
        RETURN_DOM_FRAGMENT: false,  // No retornar fragment
        RETURN_DOM_IMPORT: false,

        // Comportamiento
        KEEP_CONTENT: true,          // Preservar contenido dentro de tags removidos
        IN_PLACE: false,             // No modificar el input original

        // URLs seguras (solo protocolos permitidos)
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|urn|magnet):|[^a-z]|[a-z+.\-]*(?:[^a-z+.\-:]|$))/i,

        // ✅ TAGS/ATTR ADICIONALES (18 Nov 2025 - Asegurar que scripts y links sean permitidos)
        ADD_TAGS: ['script', 'link', 'style'],
        ADD_ATTR: ['src', 'rel', 'href', 'type', 'crossorigin', 'integrity'],

        // ✅ DATA ATTRIBUTES (18 Nov 2025 - Permitir todos los data-* y aria-*)
        ALLOW_DATA_ATTR: true,
        ALLOW_ARIA_ATTR: true,

        // Logging
        RETURN_TRUSTED_TYPE: true,
    };

    // ============================================
    // VALIDACIÓN Y CONFIGURACIÓN DE DOMPURIFY
    // ============================================

    if (window.DOMPurify) {
        DOMPurify.setConfig(BGE_DOMPURIFY_CONFIG);
    }

    // ============================================
    // FUNCIONES HELPER PARA SANITIZACIÓN
    // ============================================

    /**
     * Sanitizar HTML puro (permite tags específicos)
     * @param {string} html - HTML a sanitizar
     * @param {string} context - Contexto opcional (ignorado, para compatibilidad con dompurify-helper.js)
     * @returns {string} HTML sanitizado
     */
    window.sanitizeHTML = function(html, context) {
        if (!html || typeof html !== 'string') return '';
        if (!window.DOMPurify) {
            console.warn('[DOMPURIFY] DOMPurify no disponible, retornando texto sin HTML');
            return html;
        }

        const result = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: BGE_DOMPURIFY_CONFIG.ALLOWED_TAGS,
            ALLOWED_ATTR: BGE_DOMPURIFY_CONFIG.ALLOWED_ATTR,
        });

        // ✅ FIX (19 Nov 2025): Convertir TrustedHTML a string para compatibilidad
        // DOMPurify con RETURN_TRUSTED_TYPE: true retorna TrustedHTML object, no string
        // Necesitamos convertirlo a string para que .substring() y otras operaciones funcionen
        if (typeof result === 'string') {
            return result;
        } else if (result && typeof result.toString === 'function') {
            return result.toString();
        } else {
            console.warn('[DOMPURIFY] Resultado de sanitización no es string ni tiene toString():', typeof result);
            return String(result || '');
        }
    };

    /**
     * Sanitizar y retornar solo texto (sin tags)
     * @param {string} text - Texto a sanitizar
     * @returns {string} Texto sin HTML
     */
    window.sanitizeText = function(text) {
        if (!text || typeof text !== 'string') return '';
        if (!window.DOMPurify) return text;

        // Sanitizar sin permitir ningún tag HTML
        return DOMPurify.sanitize(text, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
        });
    };

    /**
     * Escapar HTML (para uso en atributos, no en contenido)
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     */
    window.escapeHTML = function(text) {
        if (!text || typeof text !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Validar y sanitizar URL (prevenir javascript:, data:, etc)
     * @param {string} url - URL a validar
     * @returns {string} URL sanitizada o string vacío si inválida
     */
    window.sanitizeURL = function(url) {
        if (!url || typeof url !== 'string') return '';

        // Protocolos permitidos
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

        try {
            const urlObj = new URL(url, window.location.href);
            const isAllowed = allowedProtocols.some(protocol =>
                urlObj.protocol === protocol
            );

            return isAllowed ? url : '';
        } catch (e) {
            // URL relativa - permitir si comienza con / o #
            if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
                return url;
            }
            return '';
        }
    };

    /**
     * Sanitizar objeto JSON (prevenir inyecciones en data)
     * @param {object} obj - Objeto a sanitizar
     * @returns {object} Objeto sanitizado
     */
    window.sanitizeObject = function(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        const sanitized = {};

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];

                if (typeof value === 'string') {
                    sanitized[key] = window.sanitizeText(value);
                } else if (typeof value === 'object' && value !== null) {
                    sanitized[key] = window.sanitizeObject(value);
                } else {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    };

    // ============================================
    // EXPORTAR CONFIGURACIÓN
    // ============================================

    window.BGE_DOMPURIFY_CONFIG = BGE_DOMPURIFY_CONFIG;
})();
