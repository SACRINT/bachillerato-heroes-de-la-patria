/**
 * 🎓 Portal Escolar Unificado - Manejo de Pestañas por Hash
 * Activa la pestaña correspondiente (e.g. #padres) si está presente en la URL.
 * CSP Compliant - Cero scripts inline
 */
(function () {
    'use strict';
    function activateTabFromHash() {
        if (!window.location.hash) return;
        var hash = window.location.hash.toLowerCase();
        if (hash === '#padres' || hash === '#padres-familia') {
            var padresBtn = document.getElementById('tab-padres-btn') || document.querySelector('[data-bs-target="#tab-padres"]');
            if (padresBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
                var tab = new bootstrap.Tab(padresBtn);
                tab.show();
            }
        } else if (hash === '#estudiantes') {
            var estBtn = document.getElementById('tab-estudiantes-btn') || document.querySelector('[data-bs-target="#tab-estudiantes"]');
            if (estBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
                var tab = new bootstrap.Tab(estBtn);
                tab.show();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', activateTabFromHash);
    } else {
        activateTabFromHash();
    }

    window.addEventListener('hashchange', activateTabFromHash);
})();
