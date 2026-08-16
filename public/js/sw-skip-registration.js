/**
 * 🔧 SERVICE WORKER SKIP REGISTRATION - BGE HEROES DE LA PATRIA
 * Skip del registro de SW - manejado centralmente por index.html
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: conocenos.html
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // SW registration deshabilitado - manejado centralmente por index.html
        void 0;
        // navigator.serviceWorker.register('/sw-offline-first.js')
        //     .then(registration => {
        //         void 0;
        //     })
        //     .catch(registrationError => {
        //         void 0;
        //     });
    });
}
