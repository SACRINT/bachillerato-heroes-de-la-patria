/**
 * 🔧 LOAD ADMIN HEADER - Carga dinámica del header del dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function loadAdminHeader() {
    try {
        // Cargar header
        const response = await fetch('partials/header.html');
        if (!response.ok) throw new Error('Error al cargar header');

        const headerHTML = await response.text();
        document.getElementById('main-header').innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(headerHTML) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(headerHTML) : headerHTML));

        // INICIALIZAR DROPDOWNS DE BOOTSTRAP DINÁMICAMENTE
        var dropdownElementList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
        var dropdownList = dropdownElementList.map(function (dropdownToggleEl) {
            return new bootstrap.Dropdown(dropdownToggleEl);
        });

        // ELIMINADO: El fix de preventDefault() rompía los enlaces de los submenús.


        // Esperar a que bge-security-module esté disponible y luego actualizar el estado
        // 🔧 OPTIMIZADO: Usar Promise con timeout en lugar de setInterval para evitar LAG
        const maxAttempts = 10; // Reducido de 20 a 10
        let attempts = 0;

        const checkModuleAvailability = () => {
            return new Promise((resolve) => {
                const checkOnce = () => {
                    attempts++;

                    if (typeof window.updateAdminHeaderStatus === 'function' && typeof window.secureAdminAuth !== 'undefined') {
                        const isAuth = window.secureAdminAuth.isUserAuthenticated();
                        if (isAuth) {
                            const user = window.secureAdminAuth.getCurrentUser();
                            window.updateAdminHeaderStatus(true, user);
                        }
                        resolve(true);
                    } else if (attempts >= maxAttempts) {
                        resolve(false);
                    } else {
                        // Reintentar con delay progresivo (300ms, 600ms, 900ms, etc.)
                        setTimeout(checkOnce, 300 * attempts);
                    }
                };
                checkOnce();
            });
        };

        checkModuleAvailability();

    } catch (error) {
        console.error('❌ [ADMIN DASHBOARD] Error cargando header:', error);
    }
})();
