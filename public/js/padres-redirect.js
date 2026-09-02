/**
 * 🔄 Redirección automática de padres.html al Portal Escolar unificado (Pestaña Padres)
 * CSP Compliant - Cero scripts inline
 */
(function () {
    'use strict';
    var seconds = 5;
    var el = document.getElementById('countdown');
    var interval = setInterval(function () {
        seconds--;
        if (el) el.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(interval);
            window.location.href = 'estudiantes.html#padres';
        }
    }, 1000);
})();
