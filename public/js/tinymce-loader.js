/**
 * TINYMCE LOADER - Carga dinámica de TinyMCE desde CDN
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function loadTinyMCE() {
    'use strict';
    try {
        const response = await fetch('/api/config/public-keys');
        if (!response.ok) {
            loadFallback();
            return;
        }

        const config = await response.json();
        if (config.success && config.keys && config.keys.tinymce) {
            const apiKey = config.keys.tinymce;
            window.TINYMCE_API_KEY = apiKey;

            const script = document.createElement('script');
            script.referrerPolicy = 'origin';
            script.src = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6/tinymce.min.js`;
            script.onerror = () => loadFallback();
            document.head.appendChild(script);
        } else {
            loadFallback();
        }
    } catch (error) {
        loadFallback();
    }

    function loadFallback() {
        if (document.querySelector('script[src*="tinymce"]')) return;
        const fallbackScript = document.createElement('script');
        fallbackScript.referrerPolicy = 'origin';
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js';
        document.head.appendChild(fallbackScript);
    }
})();
