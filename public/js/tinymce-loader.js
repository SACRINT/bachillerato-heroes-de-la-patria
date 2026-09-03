/**
 * TINYMCE LOADER - Carga dinámica de TinyMCE desde CDN
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function loadTinyMCE() {
    'use strict';
    try {
        if (document.querySelector('script[src*="tinymce"]')) return;
        const fallbackScript = document.createElement('script');
        fallbackScript.referrerPolicy = 'origin';
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
        document.head.appendChild(fallbackScript);
    } catch (error) {
        console.warn('TinyMCE loader warning:', error);
    }
})();
