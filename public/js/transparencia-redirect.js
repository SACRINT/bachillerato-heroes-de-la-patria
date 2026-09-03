/**
 * Transparencia Redirect - External JS (CSP Compliant)
 * Cuenta regresiva y redirección automática hacia contacto.html#transparencia
 * Mobile-First con touch targets de 48px
 */
(function () {
    'use strict';

    var REDIRECT_URL = 'contacto.html#transparencia';
    var COUNTDOWN_SECONDS = 5;
    var count = COUNTDOWN_SECONDS;

    function updateCountdown() {
        var el = document.getElementById('countdown');
        var circleEl = document.getElementById('countdown-circle-num');
        if (el) el.textContent = count;
        if (circleEl) circleEl.textContent = count;
    }

    function tick() {
        count--;
        if (count <= 0) {
            window.location.href = REDIRECT_URL;
            return;
        }
        updateCountdown();
        setTimeout(tick, 1000);
    }

    function init() {
        updateCountdown();
        setTimeout(tick, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
