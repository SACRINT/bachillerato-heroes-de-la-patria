/**
 * 🧹 CACHE CLEANER - Limpieza de caché y service workers
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(function() {
    'use strict';
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            if (registrations.length > 0) {
                registrations.forEach(reg => reg.unregister());
            }
        });
    }

    if ('caches' in window) {
        caches.keys().then(names => {
            if (names.length > 0) {
                names.forEach(name => caches.delete(name));
            }
        });
    }
})();
