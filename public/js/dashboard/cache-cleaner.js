/**
 * 🧹 CACHE CLEANER - Limpieza de caché y service workers
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function() {
    'use strict';
    console.log('🧹 [CACHE CLEANER] Iniciando limpieza de caché...');

    // Limpiar service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            if (registrations.length > 0) {
                console.log('🧹 [CACHE CLEANER] Service Workers encontrados:', registrations.length);
                registrations.forEach(reg => {
                    reg.unregister();
                    console.log('🧹 [CACHE CLEANER] Service Worker desregistrado');
                });
            }
        });
    }

    // Limpiar cachés
    if ('caches' in window) {
        caches.keys().then(names => {
            if (names.length > 0) {
                console.log('🧹 [CACHE CLEANER] Cachés encontradas:', names.length);
                names.forEach(name => {
                    caches.delete(name);
                    console.log('🧹 [CACHE CLEANER] Caché eliminada:', name);
                });
            }
        });
    }

    console.log('✅ [CACHE CLEANER] Limpieza de caché completada');
})();
