/**
 * 🔧 SERVICE WORKER CACHE BUSTING - BGE HEROES DE LA PATRIA
 * Desregistrar service workers para forzar recarga de scripts
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: calificaciones.html
 */

// Cache busting - Forzar recarga de scripts
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
        void 0;
    });
}
