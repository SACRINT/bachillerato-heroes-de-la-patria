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
        console.log('[SW] Registration skipped - handled by main app');
        // navigator.serviceWorker.register('/sw-offline-first.js')
        //     .then(registration => {
        //         console.log('SW registered: ', registration);
        //     })
        //     .catch(registrationError => {
        //         console.log('SW registration failed: ', registrationError);
        //     });
    });
}
