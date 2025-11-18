/**
 * 🔒 DOMPurify Global Loader
 * Carga DOMPurify desde el bundle incluido en node_modules
 * Hace disponible globalmente: window.DOMPurify
 */

(function() {
    'use strict';

    // Crear un script que cargue DOMPurify desde CDN como fallback
    function loadDOMPurifyFromCDN() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';
            script.onload = () => {
                console.log('✅ [DOMPURIFY-LOADER] DOMPurify cargado exitosamente desde CDN');
                resolve(window.DOMPurify);
            };
            script.onerror = () => {
                console.warn('⚠️ [DOMPURIFY-LOADER] Error cargando DOMPurify desde CDN');
                resolve(null);
            };
            document.head.appendChild(script);
        });
    }

    // Intentar primera opción: esperar a que DOMPurify esté disponible
    async function initDOMPurify() {
        // Esperar máximo 3 segundos para que DOMPurify esté disponible
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos (100ms * 30)

        while (attempts < maxAttempts && !window.DOMPurify) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.DOMPurify) {
            console.log('✅ [DOMPURIFY-LOADER] DOMPurify ya estaba disponible');
            return window.DOMPurify;
        }

        // Si no está disponible, cargar desde CDN
        console.log('⚠️ [DOMPURIFY-LOADER] DOMPurify no disponible, cargando desde CDN...');
        return await loadDOMPurifyFromCDN();
    }

    // Inicializar cuando el documento esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDOMPurify);
    } else {
        initDOMPurify();
    }
})();
