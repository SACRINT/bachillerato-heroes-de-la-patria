/**
 * 🔐 UNIFIED LOGIN HANDLER
 *
 * Maneja clicks en elementos que deben abrir el modal unificado de login
 * Reemplaza el antiguo admin-auth.js modal system
 *
 * Uso: Agregar data-action="open-unified-login" a cualquier elemento
 */

(function() {
    'use strict';

    console.log('[UNIFIED-LOGIN-HANDLER] 📱 Inicializando handler...');

    // Esperar a que el documento esté listo
    function setupHandler() {
        console.log('[UNIFIED-LOGIN-HANDLER] ✅ Handler instalado');

        // Event delegation: escuchar clics en cualquier elemento con data-action="open-unified-login"
        document.addEventListener('click', function(e) {
            const element = e.target.closest('[data-action="open-unified-login"]');

            if (element) {
                e.preventDefault();
                console.log('[UNIFIED-LOGIN-HANDLER] 🎯 Click detectado en elemento con data-action="open-unified-login"');

                // Verificar que el sistema unificado esté disponible
                if (window.unifiedLogin && typeof window.unifiedLogin.showModal === 'function') {
                    console.log('[UNIFIED-LOGIN-HANDLER] ✅ Abriendo modal unificado...');
                    window.unifiedLogin.showModal();
                } else {
                    console.error('[UNIFIED-LOGIN-HANDLER] ❌ window.unifiedLogin no disponible');
                    alert('Sistema de autenticación no disponible. Por favor recarga la página.');
                }
            }
        }, false);
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupHandler);
    } else {
        setupHandler();
    }
})();
